import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'transactions',
})
export class TransactionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TransactionsGateway');

  handleConnection(client: Socket) {
    const businessId = client.handshake.query.businessId as string;
    if (businessId) {
      client.join(businessId);
      this.logger.log(
        `Client ${client.id} joined business room: ${businessId}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitTransaction(businessId: string, transaction: any) {
    this.server.to(businessId).emit('transaction:new', transaction);
    this.logger.log(`Emitted new transaction to business room: ${businessId}`);
  }
}
