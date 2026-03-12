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
            const response = type === 'CASH_IN' 
                ? await this.bankiziService.getCashInStatus(txId, config)
                : await this.bankiziService.getCashOutStatus(txId, config);

            let status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' = 'PENDING';
            if (response.status === 'PAID') status = 'PAID';
            else if (response.status === 'FAILED') status = 'FAILED';
            else if (response.status === 'EXPIRED') status = 'EXPIRED';

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
