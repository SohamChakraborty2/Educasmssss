// pages/api/gpt/question.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GPTService } from '../../../services/gptService';

const gptService = new GPTService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { topic, level, userContext } = req.body;

  try {
    const question = await gptService.getPlaygroundQuestion(topic, level, userContext);
    res.status(200).json(question);
  } catch (error) {
    console.error('Error in getQuestion endpoint:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
