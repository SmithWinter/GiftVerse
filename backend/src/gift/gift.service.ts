import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gift } from './gift.entity';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';

@Injectable()
export class GiftService {
  constructor(
    @InjectRepository(Gift)
    private giftRepository: Repository<Gift>,
  ) {}

  async create(createGiftDto: CreateGiftDto): Promise<Gift> {
    const gift = this.giftRepository.create(createGiftDto);
    return this.giftRepository.save(gift);
  }

  async findAll(): Promise<Gift[]> {
    return this.giftRepository.find();
  }

  async findOne(id: number): Promise<Gift> {
    const gift = await this.giftRepository.findOne({ where: { id } });
    if (!gift) {
      throw new NotFoundException(`Gift with ID ${id} not found`);
    }
    return gift;
  }

  async update(id: number, updateGiftDto: UpdateGiftDto): Promise<Gift> {
    const gift = await this.findOne(id);
    Object.assign(gift, updateGiftDto);
    return this.giftRepository.save(gift);
  }

  async remove(id: number): Promise<void> {
    const gift = await this.findOne(id);
    await this.giftRepository.remove(gift);
  }
}
