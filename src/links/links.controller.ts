import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@ApiTags('links')
@Controller('pages/:pageId/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear enlace en una página' })
  create(
    @CurrentUser('sub') userId: string,
    @Param('pageId') pageId: string,
    @Body() dto: CreateLinkDto,
  ) {
    return this.linksService.create(userId, pageId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar enlaces de una página' })
  findAll(@CurrentUser('sub') userId: string, @Param('pageId') pageId: string) {
    return this.linksService.findAllByPage(userId, pageId);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reordenar enlaces (array de IDs)' })
  reorder(
    @CurrentUser('sub') userId: string,
    @Param('pageId') pageId: string,
    @Body('linkIds') linkIds: string[],
  ) {
    return this.linksService.reorder(userId, pageId, linkIds);
  }

  @Get(':linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un enlace' })
  findOne(@CurrentUser('sub') userId: string, @Param('linkId') linkId: string) {
    return this.linksService.findOne(userId, linkId);
  }

  @Put(':linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar enlace' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linksService.update(userId, linkId, dto);
  }

  @Delete(':linkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar enlace' })
  remove(@CurrentUser('sub') userId: string, @Param('linkId') linkId: string) {
    return this.linksService.remove(userId, linkId);
  }
}
