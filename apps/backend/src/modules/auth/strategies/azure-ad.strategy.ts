import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureADStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
  constructor(private configService: ConfigService) {
    super({
      identityMetadata: `https://login.microsoftonline.com/${configService.get<string>('AZURE_AD_TENANT_ID')}/v2.0/.well-known/openid-configuration`,
      clientID: configService.get<string>('AZURE_AD_CLIENT_ID'),
      validateIssuer: true,
      issuer: `https://login.microsoftonline.com/${configService.get<string>('AZURE_AD_TENANT_ID')}/v2.0`,
      passReqToCallback: false,
      loggingLevel: 'info',
      loggingNoPII: true,
    });
  }

  async validate(payload: any) {
    // Azure AD의 claims에서 필요한 정보 추출
    return {
      userId: payload.oid,
      email: payload.preferred_username,
      name: payload.name,
      roles: payload.roles || [],
      department: payload.department,
    };
  }
} 