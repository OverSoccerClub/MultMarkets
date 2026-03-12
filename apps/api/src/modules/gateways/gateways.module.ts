import { Module } from '@nestjs/common';
import { GatewaysService } from './gateways.service';
import { GatewaysController } from './gateways.controller';
import { GatewayProviderFactory } from './gateway-provider.factory';
import { BankiziProvider } from './providers/bankizi.provider';
import { BankiziModule } from '../bankizi/bankizi.module';

@Module({
    imports: [BankiziModule],
    providers: [GatewaysService, GatewayProviderFactory, BankiziProvider],
    controllers: [GatewaysController],
    exports: [GatewaysService, GatewayProviderFactory],
})
export class GatewaysModule {}
