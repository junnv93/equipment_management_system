import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '장비 관리 시스템 API에 오신 것을 환영합니다!';
  }
}
