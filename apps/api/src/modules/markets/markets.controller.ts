import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { TradingService } from '../trading/trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarketStatus } from '@prisma/client';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
    constructor(
        private readonly marketsService: MarketsService,
        private readonly tradingService: TradingService
    ) { }

    @Get('categories')
    @ApiOperation({ summary: 'Listar todas as categorias ativas' })
    async getCategories() {
        return this.marketsService.findAllCategories();
    }

    @Get()
    @ApiOperation({ summary: 'Listar mercados (com filtros e paginação)' })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('category') categorySlug?: string,
        @Query('status') status?: MarketStatus,
        @Query('sort') sortBy?: string,
        @Query('search') search?: string,
    ) {
        return this.marketsService.findAll({ page: +page, limit: +limit, categorySlug, status, sortBy, search });
    }

    @Get('trending')
    @ApiOperation({ summary: 'Mercados em destaque (maior volume)' })
    trending(@Query('limit') limit = 10) {
        return this.marketsService.getTrending(+limit);
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Detalhe de um mercado por slug' })
    findOne(@Param('slug') slug: string) {
        return this.marketsService.findOne(slug);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Histórico de preços para gráfico' })
    priceHistory(
        @Param('id') id: string,
        @Query('period') period: '1h' | '24h' | '7d' | '30d' | 'all' = '24h',
    ) {
        return this.marketsService.getPriceHistory(id, period);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Criar mercado manualmente (Admin)' })
    create(@Body() data: any) {
        // By default set source URL to Admin
        return this.marketsService.create({ ...data, sourceUrl: data.sourceUrl || '#admin', createdByBot: false });
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Atualizar mercado (Admin)' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.marketsService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Excluir mercado sem volume (Admin)' })
    delete(@Param('id') id: string) {
        return this.marketsService.delete(id);
    }

    @Post(':id/resolve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Resolver mercado manualmente (Admin)' })
    resolve(
        @Param('id') id: string,
        @Body() body: { outcome: 'YES' | 'NO' | 'CANCELLED' },
        @Req() req: any
    ) {
        return this.tradingService.resolveMarket(id, body.outcome, req.user.id);
    }
}
