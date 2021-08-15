import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  firstName: string;

  lastName: string;

  isActive: boolean;
}
