import { Pool, PoolClient, PoolConfig } from 'pg';
import { Logger } from '@nestjs/common';
import * as process from 'process';
import postgres from 'postgres';

export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

// PostgresJS 연결 인스턴스
export const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'equipment_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly logger = new Logger('DatabaseConnection');
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private readonly reconnectInterval = 5000; // 5초
  private readonly healthCheckInterval = 30000; // 30초
  
  // 성능 메트릭
  private metrics = {
    connectionsCreated: 0,
    connectionsAcquired: 0,
    connectionErrors: 0,
    queriesExecuted: 0,
    queriesSucceeded: 0,
    queriesFailed: 0,
    avgQueryTime: 0,
    totalQueryTime: 0,
    lastErrorTime: null as Date | null,
    lastReconnectTime: null as Date | null
  };

  private constructor() {
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'equipment_management',
      max: parseInt(process.env.DB_POOL_MAX || '50'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '60000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      application_name: 'equipment_management_system',
      statement_timeout: 30000, // 30초
      query_timeout: 30000, // 30초
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };

    this.initializePool(poolConfig);
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private initializePool(config: PoolConfig): void {
    this.pool = new Pool(config);

    // 이벤트 리스너 등록
    this.pool.on('connect', () => {
      this.logger.log('새로운 데이터베이스 연결이 생성되었습니다.');
      this.metrics.connectionsCreated++;
    });

    this.pool.on('acquire', () => {
      this.logger.debug('연결 풀에서 클라이언트를 획득했습니다.');
      this.metrics.connectionsAcquired++;
    });

    this.pool.on('remove', () => {
      this.logger.debug('연결 풀에서 클라이언트가 제거되었습니다.');
    });

    this.pool.on('error', (err) => {
      this.logger.error(`풀 수준 오류 발생: ${err.message}`);
      this.metrics.connectionErrors++;
      this.metrics.lastErrorTime = new Date();
      this.handleConnectionError(err);
    });

    // 주기적인 헬스 체크 시작
    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    setInterval(async () => {
      if (!this.isConnected || !this.pool) return;

      try {
        const client = await this.pool.connect();
        try {
          const startTime = Date.now();
          await client.query('SELECT 1');
          const endTime = Date.now();
          
          // 헬스 체크 쿼리 성능 메트릭 업데이트
          this.updateQueryMetrics(endTime - startTime, true);
          
          this.logger.debug('헬스 체크 성공');
        } finally {
          client.release();
        }
      } catch (error) {
        this.logger.error(`헬스 체크 실패: ${error.message}`);
        this.metrics.connectionErrors++;
        this.metrics.lastErrorTime = new Date();
        this.handleConnectionError(error);
      }
    }, this.healthCheckInterval);
  }

  public async connect(): Promise<Pool> {
    if (this.pool && this.isConnected) {
      return this.pool;
    }

    try {
      if (!this.pool) {
        throw new Error('데이터베이스 풀이 초기화되지 않았습니다.');
      }

      // 연결 테스트
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.metrics.lastReconnectTime = new Date();
      this.logger.log('데이터베이스에 성공적으로 연결되었습니다.');

      return this.pool;
    } catch (error) {
      this.logger.error(`데이터베이스 연결 실패: ${error.message}`);
      this.metrics.connectionErrors++;
      this.metrics.lastErrorTime = new Date();
      this.handleConnectionError(error);
      throw error;
    }
  }

  public handleConnectionError(error: Error): void {
    this.logger.error(`데이터베이스 연결 오류: ${error.message}`);
    this.isConnected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('최대 재연결 시도 횟수를 초과했습니다.');
      // 모니터링 시스템에 알림 전송
      this.sendAlert('DATABASE_CONNECTION_FAILED');
      return;
    }

    const backoffTime = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    this.logger.log(`${backoffTime}ms 후 재연결 시도 예정 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      this.logger.log(`데이터베이스 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      try {
        if (this.pool) {
          // 기존 풀 종료 후 재생성
          await this.pool.end();
          this.pool = null;
          
          // 풀 재생성
          const config: PoolConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'equipment_management',
            max: parseInt(process.env.DB_POOL_MAX || '50'),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '60000'),
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
            application_name: 'equipment_management_system',
            statement_timeout: 30000,
            query_timeout: 30000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000
          };
          this.initializePool(config);
        }
        
        await this.connect();
        this.logger.log('데이터베이스에 성공적으로 재연결되었습니다.');
      } catch (error) {
        this.logger.error(`재연결 실패: ${error.message}`);
        this.metrics.connectionErrors++;
        this.metrics.lastErrorTime = new Date();
        this.scheduleReconnect();
      } finally {
        this.reconnectTimer = null;
      }
    }, backoffTime);
  }

  public async executeQuery<T>(
    queryText: string,
    params: any[] = [],
    transactionClient?: PoolClient
  ): Promise<T> {
    if (!this.pool && !transactionClient) {
      await this.connect();
    }

    const client = transactionClient || await this.pool!.connect();
    const startTime = Date.now();
    this.metrics.queriesExecuted++;

    try {
      const result = await client.query(queryText, params);
      const endTime = Date.now();
      
      this.updateQueryMetrics(endTime - startTime, true);
      
      return result.rows as T;
    } catch (error) {
      const endTime = Date.now();
      this.updateQueryMetrics(endTime - startTime, false);
      
      this.logger.error(`쿼리 실행 오류: ${error.message}`);
      this.metrics.queriesFailed++;
      
      throw error;
    } finally {
      if (!transactionClient) {
        client.release();
      }
    }
  }

  public async executeTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    if (!this.pool) {
      await this.connect();
    }

    const client = await this.pool!.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`트랜잭션 오류: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  private updateQueryMetrics(duration: number, success: boolean): void {
    this.metrics.totalQueryTime += duration;
    
    if (success) {
      this.metrics.queriesSucceeded++;
    } else {
      this.metrics.queriesFailed++;
    }
    
    const totalQueries = this.metrics.queriesSucceeded + this.metrics.queriesFailed;
    this.metrics.avgQueryTime = this.metrics.totalQueryTime / totalQueries;
  }

  private sendAlert(alertType: string): void {
    // 여기에 알림 로직 구현
    this.logger.warn(`알림 발송: ${alertType}`);
    // TODO: 외부 모니터링 시스템으로 알림 전송
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  public async end(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
} 