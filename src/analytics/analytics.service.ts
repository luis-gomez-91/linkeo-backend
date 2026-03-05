import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordClick(
    linkId: string,
    data: { userAgent?: string; referrer?: string; ip?: string },
  ) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Enlace no encontrado');
    await this.prisma.linkClick.create({
      data: {
        linkId,
        userAgent: data.userAgent,
        referrer: data.referrer,
        ip: data.ip,
      },
    });
    return { ok: true };
  }

  async getPageStats(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, userId },
      select: { id: true },
    });
    if (!page) throw new ForbiddenException('Página no encontrada');
    const totalClicks = await this.prisma.linkClick.count({
      where: { link: { pageId } },
    });
    const byLink = await this.prisma.link.findMany({
      where: { pageId },
      select: {
        id: true,
        title: true,
        _count: { select: { clicks: true } },
      },
    });
    return {
      totalClicks,
      byLink: byLink.map((l) => ({ linkId: l.id, title: l.title, clicks: l._count.clicks })),
    };
  }

  async getPageClicks(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, userId },
      select: { id: true },
    });
    if (!page) throw new ForbiddenException('Página no encontrada');
    return this.prisma.linkClick.findMany({
      where: { link: { pageId } },
      include: { link: { select: { id: true, title: true, url: true } } },
      orderBy: { clickedAt: 'desc' },
      take: 500,
    });
  }
}
