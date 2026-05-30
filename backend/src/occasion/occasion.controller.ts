import { Controller, Get, Param } from '@nestjs/common';
import { OccasionService } from './occasion.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('occasions')
@Controller('occasions')
export class OccasionController {
  constructor(private readonly occasionService: OccasionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all occasions' })
  @ApiResponse({ status: 200, description: 'Returns all occasions' })
  findAll() {
    return this.occasionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an occasion by ID' })
  @ApiResponse({ status: 200, description: 'Returns the occasion' })
  @ApiResponse({ status: 404, description: 'Occasion not found' })
  findOne(@Param('id') id: string) {
    return this.occasionService.findOne(+id);
  }
}
