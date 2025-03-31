import Redis from 'ioredis';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.info(`Retrying Redis connection in ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (error) => {
  logger.error(`Redis Error: ${error}`);
});

redis.on('connect', () => {
  logger.info('Successfully connected to Redis');
}); 