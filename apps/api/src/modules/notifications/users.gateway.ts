import {
    WebSocketGateway, WebSocketServer,
    OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/users',
})
export class UsersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(UsersGateway.name);

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) throw new UnauthorizedException();

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            const userId = payload.sub;
            client.join(`user:${userId}`);
            this.logger.log(`User connected to private room: user:${userId} (socket: ${client.id})`);
        } catch (e) {
            this.logger.warn(`Client failed authentication, disconnecting: ${client.id}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`User disconnected: ${client.id}`);
    }

    @OnEvent('wallet.updated')
    handleWalletUpdate(payload: { userId: string; balance: number; available: number }) {
        this.server.to(`user:${payload.userId}`).emit('wallet_updated', payload);
    }

    @OnEvent('orders.updated')
    handleOrdersUpdate(payload: { userId: string }) {
        this.server.to(`user:${payload.userId}`).emit('orders_updated', payload);
    }
}
