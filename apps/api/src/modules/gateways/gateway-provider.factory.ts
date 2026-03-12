import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BankiziProvider } from './providers/bankizi.provider';
import { PaymentGatewayProvider } from './gateway-provider.interface';

@Injectable()
export class GatewayProviderFactory {
    constructor(private moduleRef: ModuleRef) {}

    getProvider(providerName: string): PaymentGatewayProvider {
        switch (providerName.toUpperCase()) {
            case 'BANKIZI':
                return this.moduleRef.get(BankiziProvider, { strict: false });
            default:
                throw new InternalServerErrorException(`Provedor de pagamento '${providerName}' não suportado.`);
        }
    }
}
