import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({
    description: 'JWT emitido por Auth.js (p. ej. getToken() en Next.js tras iniciar sesión con correo, Google, Apple, Facebook)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MinLength(10)
  access_token: string;
}
