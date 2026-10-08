import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@buildcorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'employee', enum: ['admin', 'company', 'manager', 'employee'] })
  @IsOptional()
  @IsIn(['admin', 'company', 'manager', 'employee'])
  role?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  password: string;
}
