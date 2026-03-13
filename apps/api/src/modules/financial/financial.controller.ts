import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PixTransactionStatus } from '@prisma/client';

@Controller('admin/financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('transactions')
  async listTransactions(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('status') status?: PixTransactionStatus,
    @Query('type') type?: 'CASH_IN' | 'CASH_OUT',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('id') id?: string,
  ) {
    return this.financialService.listTransactions(page, limit, { status, type, startDate, endDate, txId: id });
  }

  @Patch('transactions/:txId/approve')
  async approveWithdrawal(@Param('txId') txId: string) {
    return this.financialService.approveWithdrawal(txId);
  }

  @Patch('transactions/:txId/approve-deposit')
  async approveDeposit(@Param('txId') txId: string) {
    return this.financialService.approveDeposit(txId);
  }

  @Patch('transactions/:txId/reject')
  async rejectWithdrawal(
    @Param('txId') txId: string,
    @Body('reason') reason?: string,
  ) {
    return this.financialService.rejectWithdrawal(txId, reason);
  }
}
