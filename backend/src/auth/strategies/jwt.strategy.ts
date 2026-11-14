import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { toPublicUser } from '../../users/public-user.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Runs only after the signature and expiry are valid. The return value
  // becomes request.user (and what @CurrentUser() reads)
  async validate(payload: { sub: string }) {
    const user = await this.users.findById(payload.sub);

    if (!user || !user.isActive) throw new UnauthorizedException();

    return toPublicUser(user);
  }
}