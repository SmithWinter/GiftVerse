import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Occasion } from './occasion.entity';

@Injectable()
export class OccasionService {
  constructor(
    @InjectRepository(Occasion)
    private occasionRepository: Repository<Occasion>,
  ) {}

  async findAll(): Promise<Occasion[]> {
    return this.occasionRepository.find();
  }

  async findOne(id: number): Promise<Occasion> {
    const occasion = await this.occasionRepository.findOne({ where: { id } });
    if (!occasion) {
      throw new NotFoundException(`Occasion with ID ${id} not found`);
    }
    return occasion;
  }
}
