import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateRoomDto, SendMessageDto } from './dto/chat.dto';
import { ChatRoomType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getRooms(userId: string, businessId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        businessId,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => {
      const lastMessage = room.messages[0];
      const unreadCount = 0; // We'll count unread per user
      const otherMembers = room.members.filter((m) => m.userId !== userId);

      return {
        id: room.id,
        name: room.name || otherMembers.map((m) => m.user.fullName).join(', '),
        type: room.type,
        members: room.members.map((m) => ({
          id: m.user.id,
          name: m.user.fullName,
          avatarUrl: m.user.avatarUrl,
        })),
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              sender: lastMessage.sender.fullName,
              time: lastMessage.sentAt,
            }
          : null,
        unreadCount,
      };
    });
  }

  async getUsers(userId: string, businessId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        businessId,
        id: { not: userId },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        inviteStatus: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      inviteStatus: u.inviteStatus,
    }));
  }

  async getMessages(roomId: string, userId: string) {
    // Verify user is member
    const membership = await this.prisma.chatMember.findFirst({
      where: { roomId, userId },
    });
    if (!membership) throw new NotFoundException('Room not found');

    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });

    // Mark messages as read
    await this.prisma.chatMessage.updateMany({
      where: { roomId, read: false, senderId: { not: userId } },
      data: { read: true },
    });

    return messages.map((m) => ({
      id: m.id,
      text: m.text,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      senderAvatar: m.sender.avatarUrl,
      sentAt: m.sentAt,
      read: m.read,
      isMine: m.senderId === userId,
    }));
  }

  async createRoom(userId: string, businessId: string, dto: CreateRoomDto) {
    const allMemberIds = [...new Set([userId, ...dto.memberIds])];

    if (
      (dto.type === 'DIRECT' || dto.type === ChatRoomType.DM) &&
      allMemberIds.length === 2
    ) {
      // Check for existing direct room
      const existingRooms = await this.prisma.chatRoom.findMany({
        where: { type: ChatRoomType.DM, businessId },
        include: { members: true },
      });
      const existing = existingRooms.find(
        (r: any) =>
          r.members.length === 2 &&
          r.members.every((m: any) => allMemberIds.includes(m.userId)),
      );
      if (existing) return existing;
    }

    const room = await this.prisma.chatRoom.create({
      data: {
        name: dto.name || null,
        type: dto.type as ChatRoomType,
        businessId,
        members: {
          create: allMemberIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    return room;
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    // Verify user is member of the room
    const membership = await this.prisma.chatMember.findFirst({
      where: { roomId: dto.roomId, userId },
    });
    if (!membership) throw new NotFoundException('Room not found');

    const message = await this.prisma.chatMessage.create({
      data: {
        text: dto.text,
        roomId: dto.roomId,
        senderId: userId,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Send email notification to other members
    try {
      const otherMembers = await this.prisma.chatMember.findMany({
        where: { roomId: dto.roomId, userId: { not: userId } },
        include: {
          user: { select: { email: true, emailNotifications: true } },
        },
      });
      for (const m of otherMembers) {
        if (m.user.email && m.user.emailNotifications !== false) {
          this.emailService
            .sendRawEmail(
              m.user.email,
              `New Message from ${message.sender.fullName}`,
              `You have received a new message on BizhubNg from ${message.sender.fullName}:\n\n"${message.text}"\n\nLog in to your dashboard to reply.`,
              'BizhubNg Chat',
            )
            .catch((e) => console.error('Email send error', e));
        }
      }
    } catch (e) {
      console.error('Failed to notify members via email', e);
    }

    return {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      senderName: message.sender.fullName,
      sentAt: message.sentAt,
      isMine: true,
    };
  }
}
