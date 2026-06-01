import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { SyncService } from './sync.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsGateway } from './transactions.gateway';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, SyncService, TransactionsGateway],
  exports: [TransactionsService, SyncService, TransactionsGateway],
})
export class TransactionsModule {}
