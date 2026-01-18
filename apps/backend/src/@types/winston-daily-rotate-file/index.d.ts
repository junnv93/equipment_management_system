// winston-daily-rotate-file 타입 정의
declare module 'winston-daily-rotate-file' {
  import { transport } from 'winston';

  interface DailyRotateFileTransportOptions {
    level?: string;
    filename?: string;
    dirname?: string;
    datePattern?: string;
    zippedArchive?: boolean;
    maxSize?: string;
    maxFiles?: string;
    format?: any;
    options?: any;
    // 추가 옵션들
    [key: string]: any;
  }

  export default class DailyRotateFileTransport extends transport {
    constructor(options: DailyRotateFileTransportOptions);
  }
}
