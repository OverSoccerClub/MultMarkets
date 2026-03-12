import { Module, forwardRef } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { TradingModule } from '../trading/trading.module';

@Module({
    imports: [forwardRef(() => TradingModule)],
    providers: [MarketsService],
    controllers: [MarketsController],
    exports: [MarketsService],
})
export class MarketsModule { }
