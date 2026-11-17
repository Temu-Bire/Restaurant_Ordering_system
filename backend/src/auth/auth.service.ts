import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { compare, hash, hashSync } from 'bcryptjs';
import { toPublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from '../users/dto/change-password.dto.js';
import { UpdateProfileDto } from '../users/dto/update-profile.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

// Compared against when the email doesn't exist, so a wrong email and a wrong
// password take the same time and can't be told apart
const DUMMY_HASH = hashSync('not-a-real-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      password: await hash(dto.password, 10),
      role: Role.CUSTOMER, // public sign-up is ALWAYS a customer
    });

    return toPublicUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const passwordOk = await compare(dto.password, user?.password ?? DUMMY_HASH);

    // Same message for unknown email and wrong password
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Checked after the password, so a disabled account isn't revealed to guessers
    if (!user.isActive) {
      throw new ForbiddenException(
        'This account is disabled. Please contact the restaurant.',
      );
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    return { accessToken, user: toPublicUser(user) };
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.users.changePassword(userId, dto);
  }
}