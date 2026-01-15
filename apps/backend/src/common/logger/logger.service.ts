import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const isProduction = configService.get('NODE_ENV') === 'production';
    
    const consoleFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        return `${timestamp} [${context || 'Application'}] ${level}: ${message}${
          Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
        }${trace ? `\n${trace}` : ''}`;
      }),
    );
    
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    );
    
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ];
    
    if (isProduction) {
      // 운영 환경에서만 파일 로깅 활성화
      const fileTransport = new winston.transports.DailyRotateFile({
        format: fileFormat,
        dirname: 'logs',
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
      });

      const errorFileTransport = new winston.transports.DailyRotateFile({
        format: fileFormat,
        dirname: 'logs',
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
      });
      
      transports.push(fileTransport, errorFileTransport);
    }
    
    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'equipment-management' },
      transports,
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: string, ...optionalParams: any[]) {
    this.logger.info(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  error(message: string, trace?: string, ...optionalParams: any[]) {
    this.logger.error(message, { 
      context: this.context, 
      trace, 
      ...this.extractMetadata(optionalParams) 
    });
  }

  warn(message: string, ...optionalParams: any[]) {
    this.logger.warn(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  debug(message: string, ...optionalParams: any[]) {
    this.logger.debug(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  verbose(message: string, ...optionalParams: any[]) {
    this.logger.verbose(message, { context: this.context, ...this.extractMetadata(optionalParams) });
  }

  private extractMetadata(params: any[]) {
    if (params.length === 0) {
      return {};
    }
    
    if (params.length === 1 && typeof params[0] === 'object') {
      return params[0];
    }
    
    return { additionalParams: params };
  }
} 