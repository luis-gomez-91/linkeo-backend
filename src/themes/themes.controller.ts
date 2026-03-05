import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThemesService } from './themes.service';

@ApiTags('themes')
@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar temas disponibles' })
  findAll() {
    return this.themesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tema por ID' })
  findOne(@Param('id') id: string) {
    return this.themesService.findOne(id);
  }
}
