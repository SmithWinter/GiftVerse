import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { GiftOrderService } from './gift-order.service';
import { CreateGiftOrderDto } from './dto/create-gift-order.dto';
import { UpdateGiftOrderDto } from './dto/update-gift-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GiftOrder, GiftOrderStatus } from './gift-order.entity';

@ApiTags('gift-orders')
@Controller('gift-orders')
export class GiftOrderController {
  constructor(private readonly giftOrderService: GiftOrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gift order' })
  @ApiResponse({ status: 201, description: 'The gift order has been successfully created.', type: GiftOrder })
  create(@Request() req: any, @Body() createGiftOrderDto: CreateGiftOrderDto) {
    return this.giftOrderService.create(createGiftOrderDto, req.user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my gift orders' })
  @ApiResponse({ status: 200, description: 'Return all gift orders of the current user.', type: [GiftOrder] })
  findAll(@Request() req: any) {
    return this.giftOrderService.findAllByGiver(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a gift order by id' })
  @ApiResponse({ status: 200, description: 'Return the gift order.', type: GiftOrder })
  findOne(@Param('id') id: string) {
    return this.giftOrderService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gift order' })
  @ApiResponse({ status: 200, description: 'The gift order has been successfully updated.', type: GiftOrder })
  update(@Param('id') id: string, @Body() updateGiftOrderDto: UpdateGiftOrderDto) {
    return this.giftOrderService.update(+id, updateGiftOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of a gift order' })
  @ApiResponse({ status: 200, description: 'The status has been successfully updated.', type: GiftOrder })
  updateStatus(@Param('id') id: string, @Body('status') status: GiftOrderStatus) {
    return this.giftOrderService.updateStatus(+id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gift order' })
  @ApiResponse({ status: 200, description: 'The gift order has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.giftOrderService.remove(+id);
  }
}
