import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('상태 확인')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiResponse({ status: 200, description: '서버가 정상적으로 동작 중입니다.' })
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: '서버가 정상적으로 동작 중입니다.',
    };
  }
}
