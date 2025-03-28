import { Pool, PoolConfig } from 'pg';
import { Logger } from '@nestjs/common';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly logger = new Logger('DatabaseConnection');
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private readonly reconnectInterval = 5000; // 5초

  private constructor(private readonly config: PoolConfig) {}

  public static getInstance(config: PoolConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<Pool> {
    if (this.pool && this.isConnected) {
      return this.pool;
    }

    try {
      this.pool = new Pool(this.config);
      
      // 연결 테스트
      const client = await this.pool.connect();
      client.release();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('데이터베이스에 성공적으로 연결되었습니다.');
      
      // 이벤트 리스너 등록
      this.pool.on('error', (err) => this.handleConnectionError(err));
      
      return this.pool;
    } catch (error) {
      this.logger.error(`데이터베이스 연결 실패: ${error.message}`);
      this.scheduleReconnect();
      throw error;
    }
  }

  private handleConnectionError(error: Error): void {
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
      this.logger.error('최대 재연결 시도 횟수를 초과했습니다. 애플리케이션을 재시작하세요.');
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      this.logger.log(`데이터베이스 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      try {
        if (this.pool) {
          await this.pool.end();
          this.pool = null;
        }
        
        await this.connect();
        this.reconnectTimer = null;
      } catch (error) {
        this.logger.error(`재연결 실패: ${error.message}`);
        this.reconnectTimer = null;
        this.scheduleReconnect();
      }
    }, this.reconnectInterval);
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      this.logger.log('데이터베이스 연결이 종료되었습니다.');
    }
  }

  public getPool(): Pool | null {
    return this.pool;
  }
} 