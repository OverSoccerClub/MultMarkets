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

    private tokenCache = new Map<string, { token: string, expiresAt: number }>();

    constructor(
        private config: ConfigService,
        private settings: SettingsService,
    ) {
        this.logger.log('Bankizi service initialized (multi-gateway support)');
    }

    private async getConfig() {
        // Try getting from DB first via SettingsService
        const dbConfig = await this.settings.getBankiziConfig();
        const envPrefix = dbConfig.environment === 'PRODUCTION' ? 'BANKIZI_PRODUCTION_' : 'BANKIZI_SANDBOX_';
        const defaultUrl = dbConfig.environment === 'PRODUCTION' ? 'https://api.bankizi.com.br/api' : 'https://api-hom.bankizi.com/api';

        // Fallback to environment variables if not set in DB
        const baseUrl = dbConfig.baseUrl || this.config.get<string>(`${envPrefix}BASE_URL`, defaultUrl);
        const clientId = dbConfig.clientId || this.config.get<string>(`${envPrefix}CLIENT_ID`, '');
        const clientSecret = dbConfig.clientSecret || this.config.get<string>(`${envPrefix}CLIENT_SECRET`, '');
        const accountId = dbConfig.accountId || this.config.get<string>(`${envPrefix}ACCOUNT_ID`, '');

        return { baseUrl, clientId, clientSecret, accountId, environment: dbConfig.environment };
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
    private async authenticate(customConfig?: any): Promise<string> {
        const config = customConfig || await this.ensureConfigured();
        const cacheKey = config.clientId;

        const cached = this.tokenCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt - 60_000) {
            return cached.token;
        }

        this.logger.log(`Authenticating with Bankizi API (${config.environment})...`);

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
        this.tokenCache.set(cacheKey, {
            token: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        });

        this.logger.log(`Bankizi authentication successful for client=${cacheKey.substring(0, 8)}...`);
        return data.access_token;
    }

    private async getHeaders(customConfig?: any): Promise<{ headers: Record<string, string>, config: any }> {
        const config = customConfig || await this.getConfig();
        const token = await this.authenticate(config);

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
    async createDynamicQrCode(params: CreateQrCodeParams, customConfig?: any): Promise<QrCodeResponse> {
        this.logger.log(`Creating dynamic QR code: txId=${params.txId}, amount=${params.amount} cents`);

        const { headers, config } = await this.getHeaders(customConfig);
        const body: any = {
            amount: params.amount,
            expiration: params.expiration || 3600,
            txId: params.txId,
        };

        // If webhook configuration is acting up, we explicitly send the callback URL in the payload
        // (Many gateways support webhookUrl, callbackUrl, or notifyUrl overrides)
        const baseUrl = config.environment === 'PRODUCTION' 
            ? 'https://mult-markets-api.ptehea.easypanel.host' 
            : 'http://localhost:3000';
            
        const envSuffix = config.environment === 'PRODUCTION' ? '/production' : '/sandbox';
        const webhookUrl = `${baseUrl}/api/v1/webhooks/bankizi${envSuffix}`;
            
        body.webhookUrl = webhookUrl;
        body.callbackUrl = webhookUrl;
        body.notifyUrl = webhookUrl;

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
    async initiateWithdrawal(amount: number, txId: string, pixKey: string, customConfig?: any): Promise<WithdrawResponse> {
        this.logger.log(`Initiating withdrawal: txId=${txId}, amount=${amount} cents, pixKey=${pixKey}`);

        const { headers, config } = await this.getHeaders(customConfig);
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

    async confirmWithdrawal(txId: string, customConfig?: any): Promise<WithdrawResponse> {
        this.logger.log(`Confirming withdrawal: txId=${txId}`);

        const { headers, config } = await this.getHeaders(customConfig);
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
    async getCashInSmartStatus(internalTxId: string, bankiziTxId?: string, customConfig?: any): Promise<TransactionStatusResponse> {
        const { headers, config } = await this.getHeaders(customConfig);
        
        this.logger.debug(`Bankizi Config: baseUrl=${config.baseUrl}, environment=${config.environment}`);

        // Accumulate all IDs we might want to try
        const idsToTry = [internalTxId];
        if (bankiziTxId && bankiziTxId !== internalTxId) {
            idsToTry.push(bankiziTxId);
        }

        // List of candidate endpoints for Bankizi status check
        // We try paths and also query param variations
        const candidates: { path: string, method: string, useQuery?: boolean }[] = [
            { path: '/pix/qrcode/dynamic/{id}', method: 'GET' },
            { path: '/pix/transaction/cashin/{id}', method: 'GET' },
            { path: '/pix/transaction/{id}', method: 'GET' },
            { path: '/pix/transaction/cashin/txid/{id}', method: 'GET' },
            { path: '/pix/transaction/txId/{id}', method: 'GET' },
            { path: '/pix/qrcode/dynamic/status/{id}', method: 'GET' },
            { path: '/pix/qrcode/dynamic/{id}/status', method: 'GET' },
            { path: '/pix/status/{id}', method: 'GET' },
            { path: '/pix/cash-in/{id}', method: 'GET' },
            { path: '/pix/cashin/{id}', method: 'GET' },
            { path: '/pix/qrcode/{id}', method: 'GET' },
            { path: '/pix/qrcode/{id}/status', method: 'GET' },
            { path: '/pix/transaction?txId={id}', method: 'GET', useQuery: true },
            { path: '/pix/qrcode/dynamic?txId={id}', method: 'GET', useQuery: true },
            { path: '/pix/status?txId={id}', method: 'GET', useQuery: true }
        ];

        let lastError: any = null;

        for (const id of idsToTry) {
            for (const cand of candidates) {
                const path = cand.path.replace('{id}', id);
                const fullUrl = `${config.baseUrl}${path}`;
                
                try {
                    this.logger.debug(`Probing Bankizi status: ${fullUrl}`);
                    const response = await fetch(fullUrl, {
                        method: cand.method as any,
                        headers,
                    });

                    if (response.ok) {
                        const jsonRes = await response.json();
                        this.logger.log(`Bankizi status FOUND at ${path} using ID ${id}: ${JSON.stringify(jsonRes)}`);
                        return jsonRes.data || jsonRes;
                    }

                    if (response.status !== 404) {
                        const errorText = await response.text();
                        this.logger.warn(`Bankizi returned ${response.status} at ${path} for ID ${id}: ${errorText}`);
                        // If it's 401/403, we might have a config issue, but we keep trying other paths just in case
                    } else {
                        this.logger.debug(`Bankizi path ${path} for ID ${id} is 404`);
                    }
                } catch (error: any) {
                    this.logger.error(`Fetch error for ${fullUrl}: ${error.message}`);
                    lastError = error;
                }
            }
        }

        throw new Error(lastError?.message || `Failed to find status for IDs [${idsToTry.join(', ')}] across all Bankizi candidates.`);
    }

    async getCashOutStatus(txId: string, customConfig?: any): Promise<TransactionStatusResponse> {
        const { headers, config } = await this.getHeaders(customConfig);
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
