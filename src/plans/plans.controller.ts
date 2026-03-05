import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planes disponibles' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener plan por slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }
}
