import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankiziService } from './bankizi.service';

@Module({
    imports: [ConfigModule],
    providers: [BankiziService],
    exports: [BankiziService],
})
export class BankiziModule { }
