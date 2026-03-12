import { Module } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { WalletModule } from '../wallet/wallet.module';
import { SettingsModule } from '../settings/settings.module';
import { MarketsGateway } from '../notifications/markets.gateway';

@Module({
    imports: [WalletModule, SettingsModule],
    providers: [TradingService],
    controllers: [TradingController],
    exports: [TradingService],
})
export class TradingModule { }
