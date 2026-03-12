import { Module, Global } from '@nestjs/common';
import { MarketsGateway } from './markets.gateway';
import { UsersGateway } from './users.gateway';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [AuthModule],
    providers: [MarketsGateway, UsersGateway],
    exports: [MarketsGateway, UsersGateway],
})
export class NotificationsModule { }
