import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftOrder, GiftOrderStatus } from './gift-order.entity';
import { CreateGiftOrderDto } from './dto/create-gift-order.dto';
import { UpdateGiftOrderDto } from './dto/update-gift-order.dto';
import { User } from '../user/user.entity';
import { Gift } from '../gift/gift.entity';
import * as crypto from 'crypto';

function generateRedeemCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

@Injectable()
export class GiftOrderService {
  constructor(
    @InjectRepository(GiftOrder)
    private giftOrderRepository: Repository<GiftOrder>,
    @InjectRepository(Gift)
    private giftRepository: Repository<Gift>,
  ) {}

  async create(createGiftOrderDto: CreateGiftOrderDto, giver: User): Promise<GiftOrder> {
    const gift = await this.giftRepository.findOne({ where: { id: createGiftOrderDto.giftId } });
    if (!gift) {
      throw new NotFoundException(`Gift with ID ${createGiftOrderDto.giftId} not found`);
    }
    
    const redeemCode = generateRedeemCode();
    const giftOrder = this.giftOrderRepository.create({
      ...createGiftOrderDto,
      giver,
      giverId: giver.id,
      gift,
      giftId: createGiftOrderDto.giftId,
      redeemCode,
      status: createGiftOrderDto.status || GiftOrderStatus.DRAFT,
    });
    return this.giftOrderRepository.save(giftOrder);
  }

  async findAllByGiver(giverId: number): Promise<GiftOrder[]> {
    return this.giftOrderRepository.find({ where: { giverId }, relations: { gift: true } });
  }

  async findOne(id: number): Promise<GiftOrder> {
    const giftOrder = await this.giftOrderRepository.findOne({ where: { id }, relations: { gift: true } });
    if (!giftOrder) {
      throw new NotFoundException(`GiftOrder with ID ${id} not found`);
    }
    return giftOrder;
  }

  async update(id: number, updateGiftOrderDto: UpdateGiftOrderDto): Promise<GiftOrder> {
    const giftOrder = await this.findOne(id);
    
    if (updateGiftOrderDto.giftId) {
      const gift = await this.giftRepository.findOne({ where: { id: updateGiftOrderDto.giftId } });
      if (!gift) {
        throw new NotFoundException(`Gift with ID ${updateGiftOrderDto.giftId} not found`);
      }
      giftOrder.gift = gift;
      giftOrder.giftId = updateGiftOrderDto.giftId;
    }
    
    Object.assign(giftOrder, updateGiftOrderDto);
    return this.giftOrderRepository.save(giftOrder);
  }

  async updateStatus(id: number, status: GiftOrderStatus): Promise<GiftOrder> {
    return this.update(id, { status });
  }

  async remove(id: number): Promise<void> {
    const giftOrder = await this.findOne(id);
    await this.giftOrderRepository.remove(giftOrder);
  }
}
