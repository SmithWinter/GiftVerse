import { IsString, IsOptional, IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GiftOrderStatus } from '../gift-order.entity';

export class CreateGiftOrderDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipientContact: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  giftId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  occasion: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mood: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  intent?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detail?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  generationMethod: string;

  @ApiProperty({ required: false })
  @IsOptional()
  imageCount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  promptInput?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  promptFinal?: string;

  @ApiProperty({ required: false, enum: GiftOrderStatus })
  @IsEnum(GiftOrderStatus)
  @IsOptional()
  status?: GiftOrderStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  imageUrls?: string[];
}
