import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GiftService } from './gift.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('gifts')
@Controller('gifts')
export class GiftController {
  constructor(
    private readonly giftService: GiftService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload image' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinaryService.uploadImage(file);
  }

  @Post()
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
  @ApiOperation({ summary: 'Update a gift' })
  @ApiResponse({ status: 200, description: 'Gift updated successfully' })
  update(@Param('id') id: string, @Body() updateGiftDto: UpdateGiftDto) {
    return this.giftService.update(+id, updateGiftDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gift' })
  @ApiResponse({ status: 200, description: 'Gift deleted successfully' })
  remove(@Param('id') id: string) {
    return this.giftService.remove(+id);
  }
}
