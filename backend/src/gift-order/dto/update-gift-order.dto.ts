import { PartialType } from '@nestjs/swagger';
import { CreateGiftOrderDto } from './create-gift-order.dto';

export class UpdateGiftOrderDto extends PartialType(CreateGiftOrderDto) {}
