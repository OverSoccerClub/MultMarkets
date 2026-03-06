import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MarketStatus } from '@prisma/client';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
    constructor(private marketsService: MarketsService) { }

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

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Atualizar mercado (Admin)' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.marketsService.update(id, data);
    }
}
