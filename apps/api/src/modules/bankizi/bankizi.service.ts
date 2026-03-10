import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    private readonly baseUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly accountId: string;

    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(private config: ConfigService) {
        this.baseUrl = this.config.get<string>('BANKIZI_BASE_URL', 'https://api-sandbox.bankizi.com.br');
        this.clientId = this.config.get<string>('BANKIZI_CLIENT_ID', '');
        this.clientSecret = this.config.get<string>('BANKIZI_CLIENT_SECRET', '');
        this.accountId = this.config.get<string>('BANKIZI_ACCOUNT_ID', '');

        if (!this.clientId || !this.clientSecret || !this.accountId) {
            this.logger.warn('⚠ Bankizi credentials not configured — PIX operations will be unavailable');
        } else {
            this.logger.log('Bankizi service initialized');
        }
    }

    /** Whether Bankizi credentials are properly configured */
    get isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.accountId);
    }

    private ensureConfigured(): void {
        if (!this.isConfigured) {
            throw new BadRequestException(
                'Gateway PIX não configurado. Entre em contato com o suporte.',
            );
        }
    }

    // ── Authentication ─────────────────────────────────────────────────
    private async authenticate(): Promise<string> {
        this.ensureConfigured();

        // Return cached token if still valid (with 60s buffer)
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
            return this.accessToken;
        }

        this.logger.log('Authenticating with Bankizi API...');

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });

        const response = await fetch(`${this.baseUrl}/auth/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi auth failed: ${response.status} - ${errorText}`);
            throw new Error(`Bankizi authentication failed: ${response.status}`);
        }

        const data: BankiziTokenResponse = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

        this.logger.log('Bankizi authentication successful');
        return this.accessToken;
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const token = await this.authenticate();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-target-account-id': this.accountId,
        };
    }

    // ── PIX Cash-In (Deposit) ──────────────────────────────────────────
    async createDynamicQrCode(params: CreateQrCodeParams): Promise<QrCodeResponse> {
        this.logger.log(`Creating dynamic QR code: txId=${params.txId}, amount=${params.amount} cents`);

        const headers = await this.getHeaders();
        const body: any = {
            amount: params.amount,
            expiration: params.expiration || 3600,
            txId: params.txId,
        };

        if (params.payerInfo) {
            body.payerInfo = params.payerInfo;
        }

        const response = await fetch(`${this.baseUrl}/pix/qrcode/dynamic`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi createQrCode failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to create QR code: ${response.status} - ${errorText}`);
        }

        const data: QrCodeResponse = await response.json();
        this.logger.log(`QR code created: bankiziTxId=${data.transactionId}`);
        return data;
    }

    // ── PIX Cash-Out (Withdrawal) ──────────────────────────────────────
    async initiateWithdrawal(amount: number, txId: string, pixKey: string): Promise<WithdrawResponse> {
        this.logger.log(`Initiating withdrawal: txId=${txId}, amount=${amount} cents, pixKey=${pixKey}`);

        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/pix/withdraw/initiate/key`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount, txId, pixKey }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi initiateWithdrawal failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to initiate withdrawal: ${response.status} - ${errorText}`);
        }

        const data: WithdrawResponse = await response.json();
        this.logger.log(`Withdrawal initiated: bankiziTxId=${data.transactionId}`);
        return data;
    }

    async confirmWithdrawal(txId: string): Promise<WithdrawResponse> {
        this.logger.log(`Confirming withdrawal: txId=${txId}`);

        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/pix/withdraw/confirm/key/${txId}`, {
            method: 'PUT',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Bankizi confirmWithdrawal failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to confirm withdrawal: ${response.status} - ${errorText}`);
        }

        const data: WithdrawResponse = await response.json();
        this.logger.log(`Withdrawal confirmed: status=${data.status}`);
        return data;
    }

    // ── Transaction Status Queries ─────────────────────────────────────
    async getCashInStatus(txId: string): Promise<TransactionStatusResponse> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/pix/transaction/cashin/${txId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get cash-in status: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    async getCashOutStatus(txId: string): Promise<TransactionStatusResponse> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/pix/transaction/cashout/${txId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get cash-out status: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    // ── Balance ────────────────────────────────────────────────────────
    async getConsolidatedBalance(): Promise<any> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/balances/consolidated`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get balance: ${response.status} - ${errorText}`);
        }

        return response.json();
    }
}
