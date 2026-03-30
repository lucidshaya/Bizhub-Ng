import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
    constructor(private prisma: PrismaService) { }

    async createTicket(dto: { userEmail: string; subject: string; message: string }) {
        return this.prisma.supportTicket.create({
            data: dto,
        });
    }

    async getTickets() {
        return this.prisma.supportTicket.findMany({
            include: { responses: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getTicket(id: string) {
        return this.prisma.supportTicket.findUnique({
            where: { id },
            include: { responses: true },
        });
    }

    async addResponse(ticketId: string, dto: { sender: string; message: string }) {
        return this.prisma.supportResponse.create({
            data: {
                ticketId,
                ...dto,
            },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.supportTicket.update({
            where: { id },
            data: { status },
        });
    }
}
