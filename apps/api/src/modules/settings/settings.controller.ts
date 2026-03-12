import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    async getAll() {
        const settings = await this.settingsService.getAllSettings();
        
        // Mask secrets for frontend
        return settings.map((s) => ({
            ...s,
            value: s.isSecret ? '••••••••••••••••' : s.value,
        }));
    }

    @Put()
    async bulkUpdate(@Body() settings: { key: string; value: string; description?: string; isSecret?: boolean }[]) {
        const results = [];
        for (const setting of settings) {
            // Only update if value is provided and not fully masked
            if (setting.value === undefined || setting.value === null || setting.value.includes('••••')) continue;

            const res = await this.settingsService.upsertSetting(
                setting.key,
                setting.value,
                setting.description,
                setting.isSecret || false,
            );
            results.push(res);
        }
        return { message: 'Settings updated successfully', updatedCount: results.length };
    }
}
