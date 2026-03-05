import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkPageOwnership(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, userId },
      include: { user: { select: { id: true } } },
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async create(userId: string, pageId: string, dto: CreateLinkDto) {
    const page = await this.checkPageOwnership(userId, pageId);
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const maxLinks = sub?.plan?.maxLinks ?? 5;
    const count = await this.prisma.link.count({ where: { pageId } });
    if (count >= maxLinks) {
      throw new ForbiddenException(
        `Tu plan permite hasta ${maxLinks} enlaces. Mejora tu plan para añadir más.`,
      );
    }
    const nextOrder = await this.prisma.link
      .aggregate({ where: { pageId }, _max: { sortOrder: true } })
      .then((r) => (r._max.sortOrder ?? -1) + 1);
    return this.prisma.link.create({
      data: {
        pageId,
        title: dto.title,
        url: dto.url,
        type: dto.type ?? 'LINK',
        iconUrl: dto.iconUrl,
        isActive: dto.isActive ?? true,
        sortOrder: nextOrder,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        whatsappPayload: dto.whatsappPayload,
        paymentConfig: dto.paymentConfig,
      },
    });
  }

  async findAllByPage(userId: string, pageId: string) {
    await this.checkPageOwnership(userId, pageId);
    return this.prisma.link.findMany({
      where: { pageId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(userId: string, linkId: string) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: { page: true },
    });
    if (!link || link.page.userId !== userId) throw new NotFoundException('Enlace no encontrado');
    return link;
  }

  async update(userId: string, linkId: string, dto: UpdateLinkDto) {
    await this.findOne(userId, linkId);
    return this.prisma.link.update({
      where: { id: linkId },
      data: {
        ...dto,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
      },
    });
  }

  async remove(userId: string, linkId: string) {
    await this.findOne(userId, linkId);
    return this.prisma.link.delete({ where: { id: linkId } });
  }

  async reorder(userId: string, pageId: string, linkIds: string[]) {
    await this.checkPageOwnership(userId, pageId);
    await this.prisma.$transaction(
      linkIds.map((id, index) =>
        this.prisma.link.updateMany({
          where: { id, pageId },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.prisma.link.findMany({
      where: { pageId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
