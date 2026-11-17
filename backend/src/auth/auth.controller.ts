import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ChangePasswordDto } from '../users/dto/change-password.dto.js';
import { UpdateProfileDto } from '../users/dto/update-profile.dto.js';
import type { PublicUser } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // JWTs are stateless: the real "logout" is the client deleting the token.
  // This endpoint exists so the frontend has one place to call.
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout() {
    return;
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: PublicUser) {
    return user;
  }

  @ApiBearerAuth()
  @Patch('me')
  updateProfile(@CurrentUser() user: PublicUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password')
  changePassword(@CurrentUser() user: PublicUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }
}