import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Checks the token is present, valid, and not expired (else 401)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}