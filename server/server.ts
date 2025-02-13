// server/server.ts
import express, { Request, Response, NextFunction } from 'express';
import redis from 'redis';

// Create a Redis client
const client = redis.createClient();

// Rate limiter configuration
const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute
const MAX_REQUESTS = 15; // 15 requests per minute (adjust as needed)

// Middleware for rate limiting
function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip; // Get client's IP address

    client.incr(ip, (err, count) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (count === 1) {
            client.expire(ip, WINDOW_SIZE_IN_SECONDS, (err) => {
                if (err) {
                    console.error('Redis error:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }
            });
        }

        if (count > MAX_REQUESTS) {
            return res.status(429).json({ message: 'Too many requests. Please try again later.' });
        }

        next();
    });
}

const app = express();
app.use(rateLimiter);

// Example route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
