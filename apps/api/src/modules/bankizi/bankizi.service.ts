import { Injectable, Logger, BadRequestException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

interface BankiziTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface CreateQrCodeParams {
    amount: number;        // in cents
    txId: string;
    expiration?: number;   // seconds, default 3600
    payerInfo?: {
        document: string;
        name: string;
    };
}

interface QrCodeResponse {
    qrCode: string;
    transactionId: string;
    [key: string]: any;
}

interface WithdrawResponse {
    transactionId: string;
    status: string;
    [key: string]: any;
}

interface TransactionStatusResponse {
    txId: string;
    status: string;
    amount: number;
    transactionId: string;
    [key: string]: any;
}

@Injectable()
export class BankiziService {
    private readonly logger = new Logger(BankiziService.name);

    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(
        private config: ConfigService,
        private settings: SettingsService,
    ) {
        this.logger.log('Bankizi service initialized (lazy configuration)');
    }

    private async getConfig() {
        // Try getting from DB first via SettingsService
        const dbConfig = await this.settings.getBankiziConfig();

        // Fallback to environment variables
        const baseUrl = dbConfig.baseUrl || this.config.get<string>('BANKIZI_BASE_URL', 'https://api-sandbox.bankizi.com.br');
        const clientId = dbConfig.clientId || this.config.get<string>('BANKIZI_CLIENT_ID', '');
        const clientSecret = dbConfig.clientSecret || this.config.get<string>('BANKIZI_CLIENT_SECRET', '');
        const accountId = dbConfig.accountId || this.config.get<string>('BANKIZI_ACCOUNT_ID', '');

        return { baseUrl, clientId, clientSecret, accountId };
    }

    private async ensureConfigured() {
        const config = await this.getConfig();
        if (!config.clientId || !config.clientSecret) {
            throw new BadRequestException(
                'Gateway PIX não configurado. Adicione as credenciais no painel de administração (Configurações do Gateway).',
            );
        }
        return config;
    }

    // ── Authentication ─────────────────────────────────────────────────
    private async authenticate(): Promise<string> {
        const config = await this.ensureConfigured();

        // Return cached token if still valid (with 60s buffer)
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
            return this.accessToken;
        }

        this.logger.log('Authenticating with Bankizi API...');

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret,
        });

        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/auth/oauth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
        } catch (error: any) {
            this.logger.error(`Bankizi auth fetch failed: ${error.message}`);
            throw new BadGatewayException(`Falha de conexão com o gateway PIX: ${error.message}`);
        }

        if (!response.ok) {
            const err = await response.text();
            this.logger.error(`Bankizi auth failed: ${response.status} - ${err}`);
            throw new BadRequestException('Falha na autenticação com o gateway PIX. Verifique suas credenciais no painel.');
        }

        const data: BankiziTokenResponse = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

        this.logger.log('Bankizi authentication successful');
        return this.accessToken;
    }

    private async getHeaders(): Promise<{ headers: Record<string, string>, config: any }> {
        const token = await this.authenticate();
        const config = await this.getConfig();

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        if (config.accountId) {
            headers['x-target-account-id'] = config.accountId;
        }
        return { headers, config };
    }

    // ── PIX Cash-In (Deposit) ──────────────────────────────────────────
    async createDynamicQrCode(params: CreateQrCodeParams): Promise<QrCodeResponse> {
        this.logger.log(`Creating dynamic QR code: txId=${params.txId}, amount=${params.amount} cents`);

        const { headers, config } = await this.getHeaders();
        const body: any = {
            amount: params.amount,
            expiration: params.expiration || 3600,
            txId: params.txId,
        };

        if (params.payerInfo) {
            body.payerInfo = params.payerInfo;
        }

        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/pix/qrcode/dynamic`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
        } catch (error: any) {
            this.logger.error(`Bankizi QR code fetch failed: ${error.message}`);
            throw new BadGatewayException(`Falha de rede ao gerar QR Code: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi createQrCode failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to create QR code: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        const data: QrCodeResponse = jsonRes.data || jsonRes;
        this.logger.log(`QR code created: bankiziTxId=${data.transactionId}`);
        return data;
    }

    // ── PIX Cash-Out (Withdrawal) ──────────────────────────────────────
    async initiateWithdrawal(amount: number, txId: string, pixKey: string): Promise<WithdrawResponse> {
        this.logger.log(`Initiating withdrawal: txId=${txId}, amount=${amount} cents, pixKey=${pixKey}`);

        const { headers, config } = await this.getHeaders();
        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/pix/withdraw/initiate/key`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ amount, txId, pixKey }),
            });
        } catch (error: any) {
            this.logger.error(`Bankizi withdraw initiate fetch failed: ${error.message}`);
            throw new BadGatewayException(`Falha de rede ao iniciar saque: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi initiateWithdrawal failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to initiate withdrawal: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        const data: WithdrawResponse = jsonRes.data || jsonRes;
        this.logger.log(`Withdrawal initiated: bankiziTxId=${data.transactionId}`);
        return data;
    }

    async confirmWithdrawal(txId: string): Promise<WithdrawResponse> {
        this.logger.log(`Confirming withdrawal: txId=${txId}`);

        const { headers, config } = await this.getHeaders();
        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/pix/withdraw/confirm/key/${txId}`, {
                method: 'PUT',
                headers,
            });
        } catch (error: any) {
            this.logger.error(`Bankizi withdraw confirm fetch failed: ${error.message}`);
            throw new BadGatewayException(`Falha de rede ao confirmar saque: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi confirmWithdrawal failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to confirm withdrawal: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        const data: WithdrawResponse = jsonRes.data || jsonRes;
        this.logger.log(`Withdrawal confirmed: status=${data.status}`);
        return data;
    }

    // ── Transaction Status Queries ─────────────────────────────────────
    async getCashInStatus(txId: string): Promise<TransactionStatusResponse> {
        const { headers, config } = await this.getHeaders();
        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/pix/transaction/cashin/${txId}`, {
                method: 'GET',
                headers,
            });
        } catch (error: any) {
            throw new BadGatewayException(`Falha de rede ao consultar status de depósito: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get cash-in status: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        return jsonRes.data || jsonRes;
    }

    async getCashOutStatus(txId: string): Promise<TransactionStatusResponse> {
        const { headers, config } = await this.getHeaders();
        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/pix/transaction/cashout/${txId}`, {
                method: 'GET',
                headers,
            });
        } catch (error: any) {
            throw new BadGatewayException(`Falha de rede ao consultar status de saque: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get cash-out status: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        return jsonRes.data || jsonRes;
    }

    // ── Balance ────────────────────────────────────────────────────────
    async getConsolidatedBalance(): Promise<any> {
        const { headers, config } = await this.getHeaders();
        let response: Response;
        try {
            response = await fetch(`${config.baseUrl}/balances/consolidated`, {
                method: 'GET',
                headers,
            });
        } catch (error: any) {
             throw new BadGatewayException(`Falha de rede ao consultar saldo do gateway: ${error.message}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get balance: ${response.status} - ${errorText}`);
        }

        const jsonRes = await response.json();
        return jsonRes.data || jsonRes;
    }
}
