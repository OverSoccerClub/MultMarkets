import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { WalletModule } from '../wallet/wallet.module';
import { SettingsModule } from '../settings/settings.module';
import { MarketsGateway } from '../notifications/markets.gateway';

@Module({
    imports: [WalletModule, SettingsModule],
    controllers: [TradingController],
    exports: [TradingService],
})
export class TradingModule { }
