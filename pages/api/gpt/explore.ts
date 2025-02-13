// pages/api/gpt/explore.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter } from '../../../middlewares/rateLimiter'; // if you're using the middleware
import { GPTService } from '../../../services/gptService';

const gptService = new GPTService();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { query, userContext } = req.body;
  try {
    const response = await gptService.getExploreContent(query, userContext);
    return res.status(200).json({ result: response });
  } catch (error) {
    console.error('Explore error:', error);
    return res.status(500).json({ message: 'Failed to generate content' });
  }
}

export default rateLimiter ? rateLimiter(handler) : handler;
