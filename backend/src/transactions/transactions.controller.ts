import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionFilterDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(
        private txnService: TransactionsService,
        private prisma: PrismaService,
    ) { }

    private async getBusinessId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.businessId) throw new Error('No business found for user');
        return user.businessId;
    }

    @Get()
    async findAll(@Request() req: any, @Query() filters: TransactionFilterDto) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.findAll(businessId, filters);
    }

    @Get('summary')
    async getSummary(@Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.getSummary(businessId);
    }

    @Get('export')
    async getExport(@Request() req: any, @Query() filters: TransactionFilterDto) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.getExportData(businessId, filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.findOne(id, businessId);
    }

    @Post()
    async create(@Body() dto: CreateTransactionDto, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.create(businessId, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        const businessId = await this.getBusinessId(req.user.sub);
        return this.txnService.delete(id, businessId);
    }
}
