import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankiziService } from './bankizi.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [ConfigModule, SettingsModule],
    providers: [BankiziService],
    exports: [BankiziService],
})
export class BankiziModule { }
