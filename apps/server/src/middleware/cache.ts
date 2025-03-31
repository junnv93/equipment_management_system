import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import logger from '../utils/logger';

export const CACHE_TTL = 300; // 5 minutes

export const cacheMiddleware = (keyPrefix: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `${keyPrefix}:${req.originalUrl}`;
      const cachedData = await redis.get(key);

      if (cachedData) {
        res.json(JSON.parse(cachedData));
        return;
      }

      // Store the original res.json function
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response before sending
      res.json = function (data: any): Response {
        // Cache the response and handle any errors
        redis.setex(key, CACHE_TTL, JSON.stringify(data))
          .catch(err => logger.error(`Cache save error: ${err}`));
        
        // Return the response immediately while caching happens in the background
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error}`);
      next();
    }
  };
}; 