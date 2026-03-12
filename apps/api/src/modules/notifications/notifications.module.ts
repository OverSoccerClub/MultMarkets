import { Module, Global } from '@nestjs/common';
import { MarketsGateway } from './markets.gateway';
import { UsersGateway } from './users.gateway';

@Global()
@Module({
    providers: [MarketsGateway, UsersGateway],
    exports: [MarketsGateway, UsersGateway],
})
export class NotificationsModule { }
