// middlewares/rateLimiter.ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import redis from 'redis';

// Create a Redis client
const client = redis.createClient();

// Rate limiter configuration for a 1-minute window
const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute
const MAX_REQUESTS = 15; // 15 requests per minute

// Additional limits for hour and day (optional)
const MAX_REQUESTS_HOURLY = 250;
const MAX_REQUESTS_DAILY = 500;

export function rateLimiter(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Determine the client's IP address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip) {
      return res.status(500).json({ message: 'Unable to determine IP' });
    }
    
    const ipKey = ip.toString();

    // Increment count for the minute window
    client.incr(ipKey, (err, count) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Set expiration for this key if this is the first request
      if (count === 1) {
        client.expire(ipKey, WINDOW_SIZE_IN_SECONDS, (err) => {
          if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }
        });
      }

      // Check if the request count exceeds the per-minute limit
      if (count > MAX_REQUESTS) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
      }

      // OPTIONAL: You can implement additional limits (hourly and daily) using different keys,
      // for example: `${ipKey}:hour` and `${ipKey}:day` with corresponding expiration times.

      // If everything is fine, call the handler
      return handler(req, res);
    });
  };
}
