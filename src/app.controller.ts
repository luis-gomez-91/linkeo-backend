import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Bienvenida a la API' })
  welcome() {
    return {
      message: 'Bienvenido a Linkeo API',
      version: '1.0',
      docs: '/api/docs',
      health: 'ok',
    };
  }
}
