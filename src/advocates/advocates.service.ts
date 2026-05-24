import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advocate } from './entities/advocate.entity';

@Injectable()
export class AdvocatesService {
  constructor(
    @InjectRepository(Advocate)
    private advocateRepository: Repository<Advocate>,
  ) {}

  async findAll() {
    return await this.advocateRepository.find({ take: 100 });
  }

  // FIXED: id parameter typed as string
  async findOne(id: string) {
    const advocate = await this.advocateRepository.findOne({ where: { advocate_id: id } });
    if (!advocate) {
      throw new NotFoundException(`Advocate with ID ${id} not found`);
    }
    return advocate;
  }
}