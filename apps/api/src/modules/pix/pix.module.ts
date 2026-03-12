import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { WebhookController } from './webhook.controller';
import { GatewaysModule } from '../gateways/gateways.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [GatewaysModule, WalletModule],
    providers: [PixService],
    controllers: [PixController, WebhookController],
    exports: [PixService],
})
export class PixModule { }
