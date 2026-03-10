import {
    Controller, Post, Get, Body, Param, Query,
    UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PixService } from './pix.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsNumber, IsString, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CreateDepositDto {
    @ApiProperty({ description: 'Valor do depósito em reais', example: 50 })
    @IsNumber()
    @Min(10)
    @Max(50000)
    amount: number;
}

class CreateWithdrawDto {
    @ApiProperty({ description: 'Valor do saque em reais', example: 50 })
    @IsNumber()
    @Min(10)
    amount: number;

    @ApiProperty({ description: 'Chave PIX de destino', example: 'email@exemplo.com' })
    @IsString()
    @MinLength(5)
    pixKey: string;
}

@ApiTags('PIX')
@Controller('pix')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PixController {
    constructor(private pixService: PixService) { }

    @Post('deposit')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Gerar QR Code PIX para depósito' })
    async createDeposit(
        @CurrentUser() user: any,
        @Body() dto: CreateDepositDto,
    ) {
        return this.pixService.createDeposit(user.id, dto.amount);
    }

    @Post('withdraw')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar saque via PIX' })
    async createWithdraw(
        @CurrentUser() user: any,
        @Body() dto: CreateWithdrawDto,
    ) {
        return this.pixService.createWithdrawal(user.id, dto.amount, dto.pixKey);
    }

    @Get('status/:txId')
    @ApiOperation({ summary: 'Consultar status de transação PIX' })
    async getStatus(
        @CurrentUser() user: any,
        @Param('txId') txId: string,
    ) {
        return this.pixService.getTransactionStatus(user.id, txId);
    }

    @Get('transactions')
    @ApiOperation({ summary: 'Listar transações PIX' })
    async listTransactions(
        @CurrentUser() user: any,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.pixService.getPixTransactions(user.id, +page, +limit);
    }
}
