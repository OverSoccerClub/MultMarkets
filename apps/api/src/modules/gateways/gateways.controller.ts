import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GatewaysService } from './gateways.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Gateways (Admin)')
@Controller('gateways')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class GatewaysController {
    constructor(private readonly gatewaysService: GatewaysService) {}

    @Get()
    @ApiOperation({ summary: 'Listar todos os gateways configurados' })
    findAll() {
        return this.gatewaysService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de um gateway' })
    findOne(@Param('id') id: string) {
        return this.gatewaysService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Cadastrar novo gateway' })
    create(@Body() data: any) {
        return this.gatewaysService.create(data);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar configurações do gateway' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.gatewaysService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover um gateway' })
    remove(@Param('id') id: string) {
        return this.gatewaysService.remove(id);
    }

    @Patch(':id/activate')
    @ApiOperation({ summary: 'Ativar este gateway' })
    activate(@Param('id') id: string) {
        return this.gatewaysService.update(id, { isActive: true });
    }
}
