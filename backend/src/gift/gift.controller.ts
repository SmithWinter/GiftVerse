import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GiftService } from './gift.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gifts')
@Controller('gifts')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gift' })
  @ApiResponse({ status: 201, description: 'Gift created successfully' })
  create(@Body() createGiftDto: CreateGiftDto) {
    return this.giftService.create(createGiftDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gifts' })
  @ApiResponse({ status: 200, description: 'Returns all gifts' })
  findAll() {
    return this.giftService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gift by ID' })
  @ApiResponse({ status: 200, description: 'Returns the gift' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  findOne(@Param('id') id: string) {
    return this.giftService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gift' })
  @ApiResponse({ status: 200, description: 'Gift updated successfully' })
  update(@Param('id') id: string, @Body() updateGiftDto: UpdateGiftDto) {
    return this.giftService.update(+id, updateGiftDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gift' })
  @ApiResponse({ status: 200, description: 'Gift deleted successfully' })
  remove(@Param('id') id: string) {
    return this.giftService.remove(+id);
  }
}
