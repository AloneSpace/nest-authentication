import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import JwtAuthGuard from './jwt-auth.guard';
import JwtRefreshGuard from './jwt-refresh.guard';
import { LocalAuthenticationGuard } from './localAuth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Req() request): Promise<any> {
    const user = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    const {
      cookie: accessTokenCookie,
      token: accessToken,
    } = this.authService.getCookieWithJwtAccessToken(user.id);
    const {
      cookie: refreshTokenCookie,
      token: refreshToken,
    } = this.authService.getCookieWithJwtRefreshToken(user.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);

    return {
      refreshToken,
      accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return { id: req.user.id, email: req.user.email };
  }

  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh_token(@Request() req) {
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      req.user.id,
    );
    req.res.setHeader('Set-Cookie', accessTokenCookie.cookie);
    return { id: req.user.id, email: req.user.email };
  }

  @HttpCode(201)
  @Post('/register')
  async register(@Body() registerDto: RegisterDto): Promise<any | undefined> {
    return await this.authService.register(registerDto);
  }
}
