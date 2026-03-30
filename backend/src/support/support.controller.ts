import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Post('tickets')
    createTicket(@Body() dto: { userEmail: string; subject: string; message: string }) {
        return this.supportService.createTicket(dto);
    }

    @Get('tickets')
    getTickets() {
        return this.supportService.getTickets();
    }

    @Get('tickets/:id')
    getTicket(@Param('id') id: string) {
        return this.supportService.getTicket(id);
    }

    @Post('tickets/:id/responses')
    addResponse(@Param('id') id: string, @Body() dto: { sender: string; message: string }) {
        return this.supportService.addResponse(id, dto);
    }

    @Patch('tickets/:id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.supportService.updateStatus(id, status);
    }
}
