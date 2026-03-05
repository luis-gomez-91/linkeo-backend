import { IsString, IsOptional, IsBoolean, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ example: 'Mi perfil' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'miusuario', description: 'Slug para URL: /p/miusuario' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  themeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customDomain?: string;
}
