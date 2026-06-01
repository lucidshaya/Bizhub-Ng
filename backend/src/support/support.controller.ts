import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { SupportService } from './support.service';

const multerOptions = {
  storage: diskStorage({
    destination: process.env.VERCEL
      ? join('/tmp', 'uploads')
      : join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `support-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowed.test(file.originalname)) {
      cb(new BadRequestException('Only image files are allowed'), false);
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createTicket(
    @Body() body: { userEmail: string; subject: string; message: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3333';
    const imageUrl = file ? `${baseUrl}/uploads/${file.filename}` : undefined;
    return this.supportService.createTicket({ ...body, imageUrl });
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
  addResponse(
    @Param('id') id: string,
    @Body() dto: { sender: string; message: string },
  ) {
    return this.supportService.addResponse(id, dto);
  }

  @Patch('tickets/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }
}
