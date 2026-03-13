import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { BankiziService } from '../../bankizi/bankizi.service';
import { PaymentGatewayProvider, CreateDepositDto, DepositResponse, WithdrawalResponse, StatusResponse } from '../gateway-provider.interface';

@Injectable()
export class BankiziProvider implements PaymentGatewayProvider {
    private readonly logger = new Logger(BankiziProvider.name);

    constructor(private readonly bankiziService: BankiziService) {}

    async createDeposit(dto: CreateDepositDto, config?: any): Promise<DepositResponse> {
        try {
            const response = await this.bankiziService.createDynamicQrCode({
                amount: dto.amount,
                txId: dto.txId,
                expiration: dto.expiration || 3600,
            }, config);

            return {
                transactionId: response.transactionId,
                qrCode: response.qrCode,
                metadata: response,
            };
        } catch (error) {
            this.logger.error(`Error creating deposit on Bankizi: ${error.message}`);
            throw new InternalServerErrorException('Falha ao gerar QR Code de depósito via Bankizi.');
        }
    }

    async initiateWithdrawal(amount: number, txId: string, pixKey: string, config?: any): Promise<WithdrawalResponse> {
        try {
            const response = await this.bankiziService.initiateWithdrawal(amount, txId, pixKey, config);
            return {
                transactionId: response.transactionId,
                status: 'CONFIRMED',
                metadata: response,
            };
        } catch (error) {
            this.logger.error(`Error initiating withdrawal on Bankizi: ${error.message}`);
            throw new InternalServerErrorException('Falha ao iniciar saque via Bankizi.');
        }
    }

    async confirmWithdrawal(txId: string, config?: any): Promise<WithdrawalResponse> {
        try {
            const response = await this.bankiziService.confirmWithdrawal(txId, config);
            return {
                transactionId: response.transactionId,
                status: response.status === 'PAID' ? 'PAID' : 'CONFIRMED',
                metadata: response,
            };
        } catch (error) {
            this.logger.error(`Error confirming withdrawal on Bankizi: ${error.message}`);
            throw new InternalServerErrorException('Falha ao confirmar saque via Bankizi.');
        }
    }

    async getStatus(txId: string, type: 'CASH_IN' | 'CASH_OUT', config?: any): Promise<StatusResponse> {
        try {
            const bankiziTxId = config?.bankiziTxId;
            const rawResponse = type === 'CASH_IN' 
                ? await this.bankiziService.getCashInSmartStatus(txId, bankiziTxId, config)
                : await this.bankiziService.getCashOutStatus(txId, config);

            // Some APIs return an array for a single txId query
            const response = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

            if (!response) {
                return { status: 'PENDING' };
            }

            const rawStatus = response.status ? String(response.status).toUpperCase() : '';
            let status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' = 'PENDING';
            
            if (['PAID', 'APPROVED', 'COMPLETED', 'SUCCESS', 'CONCLUDED'].includes(rawStatus)) {
                status = 'PAID';
            } else if (['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'ERROR'].includes(rawStatus)) {
                status = 'FAILED';
            }

            return {
                status,
                transactionId: response.transactionId,
                metadata: response,
            };
        } catch (error) {
            this.logger.error(`Error getting status from Bankizi: ${error.message}`);
            return { status: 'PENDING' }; // Fallback
        }
    }
}
