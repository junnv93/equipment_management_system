import winston from 'winston';
import path from 'path';

// 로그 레벨 설정
const logLevel = process.env.LOG_LEVEL || 'info';

// 로그 형식 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// 콘솔 출력 설정
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
});

// 파일 출력 설정 (선택적)
const fileTransports: winston.transport[] = [];

// 개발 환경이 아닌 경우 파일 로깅 활성화
if (process.env.NODE_ENV !== 'development') {
  const logsDir = path.join(process.cwd(), 'logs');

  // 오류 로그 파일
  fileTransports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    })
  );

  // 전체 로그 파일
  fileTransports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    })
  );
}

// 로거 생성
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'equipment-management-api' },
  transports: [consoleTransport, ...fileTransports],
  exitOnError: false,
});

export default logger;
