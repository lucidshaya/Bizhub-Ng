import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
    constructor(private admin: AdminService) { }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    async getStats() {
        return this.admin.getPlatformStats();
    }

    @UseGuards(JwtAuthGuard)
    @Get('users')
    async getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.admin.getAllUsers(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            search,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('activity')
    async getActivity(@Query('limit') limit?: string) {
        return this.admin.getRecentActivity(parseInt(limit || '20'));
    }

    @UseGuards(JwtAuthGuard)
    @Get('support')
    async getSupportMetrics() {
        return this.admin.getSupportMetrics();
    }

    @Get('superadmin/data')
    async getSuperAdminData() {
        return this.admin.getSuperAdminData();
    }
}
