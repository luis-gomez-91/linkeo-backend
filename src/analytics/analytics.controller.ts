import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('links/:linkId/click')
  @ApiOperation({ summary: 'Registrar clic en enlace (público o desde app)' })
  async recordClick(
    @Param('linkId') linkId: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer;
    return this.analyticsService.recordClick(linkId, {
      userAgent: userAgent ?? undefined,
      referrer: referrer ?? undefined,
    });
  }

  @Get('pages/:pageId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Estadísticas de una página (propietario)' })
  getPageStats(@CurrentUser('sub') userId: string, @Param('pageId') pageId: string) {
    return this.analyticsService.getPageStats(userId, pageId);
  }

  @Get('pages/:pageId/clicks')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalle de clics por enlace' })
  getPageClicks(@CurrentUser('sub') userId: string, @Param('pageId') pageId: string) {
    return this.analyticsService.getPageClicks(userId, pageId);
  }
}
