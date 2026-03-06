import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitReferenceDto {
  @ApiProperty({ description: 'ID del plan en la BD' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'URL a la que redirigir tras pago exitoso' })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL si el usuario cancela' })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @ApiPropertyOptional({ description: 'true = pago anual (monto del plan anual)' })
  @IsOptional()
  @IsBoolean()
  yearly?: boolean;
}
