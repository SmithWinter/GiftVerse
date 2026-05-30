import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftOrderService } from './gift-order.service';
import { GiftOrderController } from './gift-order.controller';
import { GiftOrder } from './gift-order.entity';
import { Gift } from '../gift/gift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GiftOrder, Gift])],
  controllers: [GiftOrderController],
  providers: [GiftOrderService],
  exports: [GiftOrderService],
})
export class GiftOrderModule {}
