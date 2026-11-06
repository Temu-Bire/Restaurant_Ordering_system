import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);

    // role is not passed, so the database default (CUSTOMER) is used
    return this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashed,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Same message for unknown email and wrong password (criterion 7)
    const invalid = new UnauthorizedException('Invalid email or password');
    if (!user) throw invalid;

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) throw invalid;

    const payload = { sub: user.id, role: user.role };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}