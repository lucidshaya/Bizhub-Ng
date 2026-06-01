import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCameraDto, UpdateCameraDto } from './dto/camera.dto';
import { CameraStatus } from '@prisma/client';

@Injectable()
export class CamerasService {
  constructor(private prisma: PrismaService) {}

  async findAll(businessId: string) {
    return this.prisma.camera.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const camera = await this.prisma.camera.findFirst({
      where: { id, businessId },
    });
    if (!camera) throw new NotFoundException('Camera not found');
    return camera;
  }

  async create(businessId: string, dto: CreateCameraDto) {
    return this.prisma.camera.create({
      data: {
        name: dto.name,
        location: dto.location,
        streamUrl: dto.streamUrl,
        status: (dto.status as CameraStatus) || CameraStatus.OFFLINE,
        businessId,
      },
    });
  }

  async update(id: string, businessId: string, dto: UpdateCameraDto) {
    await this.findOne(id, businessId);
    return this.prisma.camera.update({
      where: { id },
      data: {
        name: dto.name,
        location: dto.location,
        streamUrl: dto.streamUrl,
        status: (dto.status as CameraStatus) || undefined,
      },
    });
  }

  async remove(id: string, businessId: string) {
    await this.findOne(id, businessId);
    return this.prisma.camera.delete({ where: { id } });
  }
}
