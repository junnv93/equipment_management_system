// 누락된 패키지 타입 정의

// helmet 타입 정의
declare module 'helmet' {
  import { RequestHandler } from 'express';

  interface HelmetOptions {
    contentSecurityPolicy?: boolean | object;
    crossOriginEmbedderPolicy?: boolean | object;
    crossOriginOpenerPolicy?: boolean | object;
    crossOriginResourcePolicy?: boolean | object;
    dnsPrefetchControl?: boolean | object;
    expectCt?: boolean | object;
    frameguard?: boolean | object;
    hidePoweredBy?: boolean | object;
    hsts?: boolean | object;
    ieNoOpen?: boolean | object;
    noSniff?: boolean | object;
    originAgentCluster?: boolean | object;
    permittedCrossDomainPolicies?: boolean | object;
    referrerPolicy?: boolean | object;
    xssFilter?: boolean | object;
  }

  function helmet(options?: HelmetOptions): RequestHandler;

  export = helmet;
}

// cookie-parser 타입 정의
declare module 'cookie-parser' {
  import { RequestHandler } from 'express';

  function cookieParser(secret?: string | string[], options?: object): RequestHandler;

  export = cookieParser;
}

// compression 타입 정의
declare module 'compression' {
  import { Request, Response } from 'express';
  import { RequestHandler } from 'express';

  interface CompressionOptions {
    filter?: (req: Request, res: Response) => boolean;
    threshold?: number;
    level?: number;
    chunkSize?: number;
    [key: string]: unknown;
  }

  function compression(options?: CompressionOptions): RequestHandler;

  export = compression;
}
