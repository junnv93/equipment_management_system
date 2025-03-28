import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // passport-local 기본값은 'username'이므로 변경
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    try {
      const user = await this.authService.validateUser(email, password);
      return user;
    } catch (error) {
      throw new UnauthorizedException(error.message || '인증에 실패했습니다.');
    }
  }
}
