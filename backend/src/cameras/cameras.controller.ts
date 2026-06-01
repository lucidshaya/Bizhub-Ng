import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CreateCameraDto, UpdateCameraDto } from './dto/camera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('OWNER', 'ADMIN', 'SUBADMIN')
@Controller('cameras')
export class CamerasController {
  constructor(
    private camerasService: CamerasService,
    private prisma: PrismaService,
  ) {}

  private async getBusinessId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.businessId) throw new Error('No business found for user');
    return user.businessId;
  }

  @Get()
  async findAll(@Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.camerasService.findAll(businessId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.camerasService.findOne(id, businessId);
  }

  @Get(':id/stream')
  async getStreamConfig(@Param('id') id: string, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    const camera = await this.camerasService.findOne(id, businessId);

    // Return Ant Media or generic WebRTC signaling config
    return {
      cameraName: camera.name,
      streamId: camera.id,
      wsUrl:
        process.env.ANT_MEDIA_WS_URL ||
        'wss://example.antmedia.io:5443/WebRTCAppEE/websocket',
      rtspUrl: camera.streamUrl, // The original RTSP source if the frontend proxy handles it
    };
  }

  @Post()
  async create(@Body() dto: CreateCameraDto, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.camerasService.create(businessId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCameraDto,
    @Request() req: any,
  ) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.camerasService.update(id, businessId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const businessId = await this.getBusinessId(req.user.sub);
    return this.camerasService.remove(id, businessId);
  }
}
