import { Controller, Get, Post, Delete, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsNumber, Min, Max, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class DepositDto { @ApiProperty() @IsNumber() @Min(10) @Max(50000) amount: number; }
class WithdrawDto {
    @ApiProperty() @IsNumber() @Min(10) amount: number;
    @ApiProperty() @IsString() @MinLength(5) pixKey: string;
}

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
    constructor(private walletService: WalletService) { }

    @Get()
    @ApiOperation({ summary: 'Saldo e informações da carteira' })
    getWallet(@CurrentUser() user: any) {
        return this.walletService.getWallet(user.id);
    }

    @Post('deposit')
    @ApiOperation({ summary: 'Depositar fundos (MVP: virtual)' })
    deposit(@CurrentUser() user: any, @Body() dto: DepositDto) {
        return this.walletService.deposit(user.id, dto.amount);
    }

    @Post('withdraw')
    @ApiOperation({ summary: 'Solicitar saque via PIX' })
    withdraw(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
        return this.walletService.withdraw(user.id, dto.amount, dto.pixKey);
    }

    @Get('transactions')
    @ApiOperation({ summary: 'Histórico de transações' })
    transactions(
        @CurrentUser() user: any,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.walletService.getTransactions(user.id, +page, +limit);
    }
}
