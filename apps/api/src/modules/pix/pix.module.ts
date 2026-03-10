import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankiziModule } from '../bankizi/bankizi.module';
import { WalletModule } from '../wallet/wallet.module';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [ConfigModule, BankiziModule, WalletModule],
    providers: [PixService],
    controllers: [PixController, WebhookController],
    exports: [PixService],
})
export class PixModule { }
