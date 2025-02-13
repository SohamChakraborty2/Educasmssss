// pages/api/gpt/explore.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  dangerouslyAllowBrowser: false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { query, userContext } = req.body;
  try {
    const exploreContent = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are a Gen-Z tutor who explains complex topics concisely. Provide JSON output.` },
        { role: 'user', content: `Explain "${query}" in simple terms.` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    res.status(200).json({ result: exploreContent });
  } catch (error) {
    console.error('Error in explore endpoint:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}
