import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Occasion } from './occasion.entity';
import { OccasionService } from './occasion.service';
import { OccasionController } from './occasion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Occasion])],
  providers: [OccasionService],
  controllers: [OccasionController],
  exports: [OccasionService],
})
export class OccasionModule {}
