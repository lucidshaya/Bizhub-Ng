import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict to frontend URL
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to keep track of connected users (userId -> socketId)
  private userSockets = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.headers.authorization?.split(' ')[1] ||
        client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Detect token algorithm before verifying — reject RS256 (Supabase) tokens early
      try {
        const [headerB64] = token.split('.');
        const header = JSON.parse(
          Buffer.from(headerB64, 'base64').toString('utf8'),
        );
        if (header.alg && header.alg !== 'HS256') {
          console.warn(
            `[WS] Rejected token with algorithm "${header.alg}" (expected HS256). ` +
              `Client must send a Bizhub JWT, not a Supabase session token.`,
          );
          client.disconnect();
          return;
        }
      } catch {
        // malformed token header — fall through to verify which will also reject it
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      const userId = payload.sub;

      client.data.user = payload;
      this.userSockets.set(userId, client.id);

      // Join a personal room to receive direct socket events
      client.join(`user:${userId}`);

      console.log(`[WS] Client connected: ${client.id}, User: ${userId}`);
    } catch (err: any) {
      console.warn(`[WS] Auth failed for ${client.id}: ${err?.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.user?.sub) {
      this.userSockets.delete(client.data.user.sub);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room:${data.roomId}`);
    console.log(`User ${client.data.user.sub} joined room ${data.roomId}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`room:${data.roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.sub;

      // Save message to DB
      const message = await this.chatService.sendMessage(userId, {
        roomId: data.roomId,
        text: data.text,
      });

      // Broadcast to everyone in the room (including sender to confirm receipt if desired,
      // but usually sender gets ACK from HTTP, though we can just broadcast)
      this.server.to(`room:${data.roomId}`).emit('new_message', {
        roomId: data.roomId,
        message,
      });

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to everyone in the room EXCEPT the sender
    client.to(`room:${data.roomId}`).emit('user_typing', {
      roomId: data.roomId,
      userId: client.data.user.sub,
      isTyping: data.isTyping,
    });
  }
}
