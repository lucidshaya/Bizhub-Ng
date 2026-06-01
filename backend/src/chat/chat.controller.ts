import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get('rooms')
  async getRooms(@Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.chatService.getRooms(req.user.sub, businessId);
  }

  @Get('users')
  async getUsers(@Request() req: RequestWithUser) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.chatService.getUsers(req.user.sub, businessId);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.getMessages(roomId, req.user.sub);
  }

  @Post('rooms')
  async createRoom(
    @Body() dto: CreateRoomDto,
    @Request() req: RequestWithUser,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.chatService.createRoom(req.user.sub, businessId, dto);
  }

  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.sendMessage(req.user.sub, dto);
  }
}
