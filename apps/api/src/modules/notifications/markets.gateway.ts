import {
    WebSocketGateway, WebSocketServer,
    SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/markets',
})
export class MarketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(MarketsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe_market')
    subscribeMarket(@MessageBody() marketId: string, @ConnectedSocket() client: Socket) {
        client.join(`market:${marketId}`);
        this.logger.log(`Client ${client.id} subscribed to market: ${marketId}`);
    }

    @SubscribeMessage('unsubscribe_market')
    unsubscribeMarket(@MessageBody() marketId: string, @ConnectedSocket() client: Socket) {
        client.leave(`market:${marketId}`);
    }

    @OnEvent('market.price_update')
    handlePriceUpdate(payload: { marketId: string; yesPrice: number; noPrice: number; timestamp: string }) {
        this.server.to(`market:${payload.marketId}`).emit('price_update', payload);
    }

    // Broadcasts to all connected clients — for global feed updates
    broadcastMarketUpdate(data: any) {
        this.server.emit('market_update', data);
    }
}
