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
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, PayStaffDto, BulkPayDto } from './dto/staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
    constructor(
        private staffService: StaffService,
        private prisma: PrismaService,
    ) { }

    private async getBusinessId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.businessId) throw new Error('No business found for user');
        return user.businessId;
    }

    @Get()
    async findAll(@Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.findAll(businessId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.findOne(id, businessId);
    }

    @Post()
    async create(@Body() dto: CreateStaffDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.create(businessId, dto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateStaffDto,
        @Request() req: any,
    ) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.update(id, businessId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.remove(id, businessId);
    }

    @Post('pay')
    async payStaff(@Body() dto: PayStaffDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.payStaff(businessId, dto.staffId, dto.amount, dto.reason);
    }

    @Post('pay-all')
    async bulkPay(@Body() dto: BulkPayDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.bulkPay(businessId, dto);
    }

    @Get('payroll/history')
    async payrollHistory(@Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.staffService.getPayrollHistory(businessId);
    }
}
