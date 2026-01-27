/**
 * passport-azure-ad 타입 선언
 *
 * passport-azure-ad 패키지는 공식 TypeScript 타입을 제공하지 않습니다.
 * 이 파일은 프로젝트에서 사용하는 최소한의 타입 정의입니다.
 */
declare module 'passport-azure-ad' {
  import { Strategy } from 'passport';

  export interface IBearerStrategyOptions {
    identityMetadata: string;
    clientID: string;
    validateIssuer?: boolean;
    issuer?: string | string[];
    passReqToCallback?: boolean;
    loggingLevel?: 'info' | 'warn' | 'error';
    loggingNoPII?: boolean;
    audience?: string | string[];
    isB2C?: boolean;
    policyName?: string;
    allowMultiAudiencesInToken?: boolean;
    scope?: string[];
  }

  export interface IProfile {
    oid?: string;
    sub?: string;
    upn?: string;
    preferred_username?: string;
    name?: string;
    email?: string;
    roles?: string[];
    department?: string;
    [key: string]: unknown;
  }

  export type VerifyCallback = (error: Error | null, user?: unknown, info?: unknown) => void;
  export type VerifyFunction = (token: IProfile, done: VerifyCallback) => void;

  export class BearerStrategy extends Strategy {
    constructor(options: IBearerStrategyOptions, verify?: VerifyFunction);
    name: string;
  }
}
