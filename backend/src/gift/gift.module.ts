import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gift } from './gift.entity';
import { GiftService } from './gift.service';
import { GiftController } from './gift.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gift]), CloudinaryModule],
  providers: [GiftService],
  controllers: [GiftController],
  exports: [GiftService],
})
export class GiftModule {}
