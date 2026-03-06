import {
    Controller, Post, Get, Body, Param, Req,
    UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, Verify2faDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 per minute
    @ApiOperation({ summary: 'Cadastrar nova conta' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('verify-email/:token')
    @ApiOperation({ summary: 'Verificar e-mail via token' })
    verifyEmail(@Param('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('login')
    @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 per minute
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login com e-mail e senha' })
    login(@Body() dto: LoginDto, @Req() req: any) {
        return this.authService.login(dto, req.ip, req.headers['user-agent']);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Renovar access token' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('forgot-password')
    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar redefinição de senha' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Redefinir senha com token' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.password);
    }

    // ── 2FA ─────────────────────────────────────────────────────────
    @Get('2fa/setup')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gerar QR Code para 2FA' })
    setup2fa(@CurrentUser() user: any) {
        return this.authService.setup2fa(user.id);
    }

    @Post('2fa/enable')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Ativar 2FA com código de confirmação' })
    enable2fa(@CurrentUser() user: any, @Body() dto: Verify2faDto) {
        return this.authService.enable2fa(user.id, dto.code);
    }

    @Post('2fa/disable')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Desativar 2FA' })
    disable2fa(@CurrentUser() user: any, @Body() dto: Verify2faDto) {
        return this.authService.disable2fa(user.id, dto.code);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Encerrar sessão' })
    logout(@CurrentUser() user: any) {
        return this.authService.logout(user.sessionId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Dados do usuário autenticado' })
    me(@CurrentUser() user: any) {
        return user;
    }
}
