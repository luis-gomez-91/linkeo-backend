import { IsString, IsOptional, IsBoolean, IsUrl, IsEnum, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LinkType } from '@prisma/client';

export class CreateLinkDto {
  @ApiProperty({ example: 'Mi Instagram' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'https://instagram.com/miusuario' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ enum: ['LINK', 'WHATSAPP', 'PAYMENT', 'SOCIAL'] })
  @IsOptional()
  @IsEnum(LinkType)
  type?: LinkType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Para enlaces programados (plan Emprendedor+)' })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiPropertyOptional({ description: 'Mensaje o número para WhatsApp' })
  @IsOptional()
  @IsString()
  whatsappPayload?: string;

  @ApiPropertyOptional({ description: 'Config JSON para botón de pago' })
  @IsOptional()
  @IsString()
  paymentConfig?: string;
}
