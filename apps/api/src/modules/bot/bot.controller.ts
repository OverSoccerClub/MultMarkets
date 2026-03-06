import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BotService } from './bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SetRoles } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ApproveDraftDto {
    @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() resolutionDate?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() categorySlug?: string;
}

class RejectDraftDto {
    @ApiProperty({ required: false }) @IsOptional() @IsString() reason?: string;
}

class CreateSourceDto {
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() type: string;
    @ApiProperty() @IsString() url: string;
    @ApiProperty({ required: false }) @IsOptional() active?: boolean;
    @ApiProperty({ required: false }) @IsOptional() fetchInterval?: number;
}

@ApiTags('Bot (Admin)')
@Controller('bot')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetRoles('ADMIN', 'OPERATOR')
@ApiBearerAuth()
export class BotController {
    constructor(private botService: BotService) { }

    @Get('drafts')
    @ApiOperation({ summary: 'Listar rascunhos gerados pelo bot' })
    getDrafts(@Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
        return this.botService.getDrafts(status, +page, +limit);
    }

    @Post('drafts/:id/approve')
    @ApiOperation({ summary: 'Aprovar rascunho e criar mercado' })
    approveDraft(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ApproveDraftDto) {
        return this.botService.approveDraft(id, user.id, dto);
    }

    @Post('drafts/:id/reject')
    @ApiOperation({ summary: 'Rejeitar rascunho' })
    rejectDraft(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectDraftDto) {
        return this.botService.rejectDraft(id, user.id, dto.reason);
    }

    @Post('run')
    @ApiOperation({ summary: 'Forçar execução do ciclo de descoberta agora' })
    runNow() {
        return this.botService.fetchTopics();
    }

    @Post('seed-sources')
    @ApiOperation({ summary: 'Adicionar fontes padrão do bot' })
    seedSources() {
        return this.botService.seedDefaultSources();
    }

    // -- Bot Source Management --
    @Get('sources')
    @ApiOperation({ summary: 'Listar fontes do bot' })
    getSources() {
        return this.botService.getSources();
    }

    @Post('sources')
    @ApiOperation({ summary: 'Criar nova fonte do bot' })
    createSource(@Body() dto: CreateSourceDto) {
        return this.botService.createSource(dto);
    }

    @Patch('sources/:id')
    @ApiOperation({ summary: 'Atualizar fonte do bot' })
    updateSource(@Param('id') id: string, @Body() dto: any) {
        return this.botService.updateSource(id, dto);
    }

    @Post('sources/:id/delete') // Post because some clients handle DELETE poorly
    @ApiOperation({ summary: 'Deletar fonte do bot' })
    deleteSource(@Param('id') id: string) {
        return this.botService.deleteSource(id);
    }

    // -- Bot Topic Review --
    @Get('topics')
    @ApiOperation({ summary: 'Listar tópicos descobertos' })
    getTopics(@Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
        return this.botService.getTopics(status, +page, +limit);
    }
}
