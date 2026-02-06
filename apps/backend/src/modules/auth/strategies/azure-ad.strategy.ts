import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy, IProfile } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';
import { JwtUser } from '../../../types/auth';

@Injectable()
export class AzureADStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('AZURE_AD_CLIENT_ID');
    const tenantID = configService.get<string>('AZURE_AD_TENANT_ID');

    // 테스트 환경 또는 Azure AD 설정이 없을 때는 더미 값으로 초기화
    // 실제 인증은 JWT Strategy를 사용하므로 Azure AD Strategy는 선택적
    const finalClientID = clientID || 'test-client-id-for-e2e-tests';
    const finalTenantID = tenantID || 'test-tenant-id-for-e2e-tests';
    const isTestMode = !clientID || !tenantID;

    if (isTestMode) {
      // Logger는 super() 호출 후에 사용 가능하므로 console 사용
      console.warn(
        '[AzureADStrategy] Azure AD 설정이 누락되어 테스트용 더미 값으로 초기화됩니다. ' +
          '프로덕션 환경에서는 반드시 AZURE_AD_CLIENT_ID와 AZURE_AD_TENANT_ID를 설정하세요.'
      );
    }

    // super()는 항상 호출해야 하므로 조건부 로직은 설정값에만 적용
    super({
      identityMetadata: `https://login.microsoftonline.com/${finalTenantID}/v2.0/.well-known/openid-configuration`,
      clientID: finalClientID,
      validateIssuer: !isTestMode, // 테스트 환경에서는 검증 비활성화
      issuer: `https://login.microsoftonline.com/${finalTenantID}/v2.0`,
      passReqToCallback: false,
      loggingLevel: isTestMode ? 'warn' : 'info', // 테스트 환경에서는 로그 레벨 낮춤
      loggingNoPII: true,
    });
  }

  async validate(payload: IProfile): Promise<JwtUser> {
    // Azure AD의 claims에서 필요한 정보 추출
    return {
      userId: payload.oid || '',
      email: payload.preferred_username || '',
      name: payload.name,
      roles: payload.roles || [],
      department: payload.department,
    };
  }
}
