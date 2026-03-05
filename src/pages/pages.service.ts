import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePageDto) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const plan = sub?.plan;
    const maxPages = plan?.maxPages ?? 1;
    const count = await this.prisma.page.count({ where: { userId } });
    if (count >= maxPages) {
      throw new ForbiddenException(
        `Tu plan permite hasta ${maxPages} página(s). Mejora tu plan para crear más.`,
      );
    }
    const customDomain = dto.customDomain && plan?.customDomain ? dto.customDomain : null;
    return this.prisma.page.create({
      data: {
        userId,
        name: dto.name,
        slug: dto.slug,
        headline: dto.headline,
        profileImageUrl: dto.profileImageUrl,
        themeId: dto.themeId,
        showBranding: dto.showBranding ?? true,
        customDomain,
      },
      include: { theme: true, links: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.page.findMany({
      where: { userId },
      include: { theme: true, links: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, userId },
      include: { theme: true, links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, isActive: true },
      include: {
        theme: true,
        links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        user: { select: { name: true } },
      },
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async update(userId: string, pageId: string, dto: UpdatePageDto) {
    await this.findOne(userId, pageId);
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const customDomain =
      dto.customDomain !== undefined && sub?.plan?.customDomain ? dto.customDomain : undefined;
    return this.prisma.page.update({
      where: { id: pageId },
      data: {
        ...dto,
        ...(customDomain !== undefined && { customDomain }),
      },
      include: { theme: true, links: true },
    });
  }

  async remove(userId: string, pageId: string) {
    await this.findOne(userId, pageId);
    return this.prisma.page.delete({ where: { id: pageId } });
  }
}
