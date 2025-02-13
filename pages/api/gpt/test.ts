// pages/api/gpt/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GPTService } from '../../../services/gptService';

const gptService = new GPTService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { topic, examType } = req.body;

  try {
    const questions = await gptService.getTestQuestions(topic, examType);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error in generateTest endpoint:', error);
    res.status(500).json({ error: 'Failed to generate test questions' });
  }
}
