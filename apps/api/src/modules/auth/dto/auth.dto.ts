import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'João Silva' })
    @IsString() @MinLength(2) @MaxLength(100)
    name: string;

    @ApiProperty({ example: 'joaosilva' })
    @IsString() @MinLength(3) @MaxLength(30)
    @Matches(/^[a-z0-9_]+$/, { message: 'Username: apenas letras minúsculas, números e _' })
    username: string;

    @ApiProperty({ example: 'joao@email.com' })
    @IsEmail({}, { message: 'E-mail inválido' })
    email: string;

    @ApiProperty({ example: 'Senha@123' })
    @IsString() @MinLength(8)
    @Matches(/[A-Z]/, { message: 'Senha deve ter ao menos uma maiúscula' })
    @Matches(/[0-9]/, { message: 'Senha deve ter ao menos um número' })
    password: string;
}

export class LoginDto {
    @ApiProperty() @IsEmail() email: string;
    @ApiProperty() @IsString() @MinLength(1) password: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() totpCode?: string;
}

export class ForgotPasswordDto {
    @ApiProperty() @IsEmail() email: string;
}

export class ResetPasswordDto {
    @ApiProperty() @IsString() token: string;
    @ApiProperty() @IsString() @MinLength(8) password: string;
}

export class Verify2faDto {
    @ApiProperty() @IsString() @MinLength(6) @MaxLength(6) code: string;
}

export class RefreshTokenDto {
    @ApiProperty() @IsString() refreshToken: string;
}
