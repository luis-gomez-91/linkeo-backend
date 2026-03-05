import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'ID del plan en la BD' })
  @IsString()
  planId: string;

  @ApiProperty({ description: 'URL a la que redirigir tras pago exitoso' })
  @IsUrl()
  successUrl: string;

  @ApiProperty({ description: 'URL si el usuario cancela' })
  @IsUrl()
  cancelUrl: string;

  @ApiPropertyOptional({ description: 'true = pago anual (descuento)' })
  @IsOptional()
  @IsBoolean()
  yearly?: boolean;
}
