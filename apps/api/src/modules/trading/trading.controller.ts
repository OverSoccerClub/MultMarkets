import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TradeSide, TradeType } from '@prisma/client';

class TradeDto {
    @ApiProperty() @IsString() marketId: string;
    @ApiProperty({ enum: TradeSide }) @IsEnum(TradeSide) side: TradeSide;
    @ApiProperty({ enum: TradeType }) @IsEnum(TradeType) type: TradeType;
    @ApiProperty() @IsNumber() @IsPositive() amount: number;
}

@ApiTags('Trading')
@Controller('trading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradingController {
    constructor(private tradingService: TradingService) { }

    @Post('preview')
    @ApiOperation({ summary: 'Pré-visualizar operação (sem executar)' })
    preview(@Body() dto: TradeDto) {
        return this.tradingService.previewTrade(dto.marketId, dto.side, dto.type, dto.amount);
    }

    @Post('execute')
    @ApiOperation({ summary: 'Executar compra/venda de cotas' })
    execute(@CurrentUser() user: any, @Body() dto: TradeDto) {
        return this.tradingService.executeTrade(user.id, dto.marketId, dto.side, dto.type, dto.amount);
    }

    @Get('positions')
    @ApiOperation({ summary: 'Posições abertas do usuário' })
    positions(@CurrentUser() user: any) {
        return this.tradingService.getPositions(user.id);
    }
}
