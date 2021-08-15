import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import TokenPayload from './interfaces/tokenPayload.interface';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await this.passwordMatch(password, user.password)))
      throw new UnauthorizedException('Email or Password is not correctly.');
    await this.usersService.setCurrentRefreshToken(
      this.getCookieWithJwtRefreshToken(user.id).token,
      user.id,
    );
    return user;
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.findByEmail(registerDto.email);
    if (user) throw new BadRequestException('Email exist.');
    registerDto.password = await this.hashPassword(registerDto.password);
    await this.usersService.createUser(registerDto);
    return {
      status: 201,
      message: 'Register successful.',
    };
  }

  public getCookieWithJwtAccessToken(userId: string) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}m`,
    });
    return {
      cookie: `Authentication=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${
        +this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME') * 60
      }`,
      token,
    };
  }

  public getCookieWithJwtRefreshToken(userId: string) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}h`,
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${
      +this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') * 9999
    }`;
    return {
      cookie,
      token,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, { hashLength: 64 });
  }

  async passwordMatch(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashPassword, password);
  }
}
