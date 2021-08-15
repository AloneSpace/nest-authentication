import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ email: email });
  }

  async getById(id: string): Promise<any> {
    const user = await this.usersRepository.findOne(id);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        currentHashedRefreshToken: user.currentHashedRefreshToken,
      };
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async createUser(registerDto: RegisterDto): Promise<User | undefined> {
    return await this.usersRepository.save(registerDto);
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.getById(userId);

    const isRefreshTokenMatching = await argon2.verify(
      user.currentHashedRefreshToken,
      refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
