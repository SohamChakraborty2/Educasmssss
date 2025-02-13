import { Question, UserContext, ExploreResponse } from '../types';
import OpenAI from 'openai';

// Define interfaces for related content in streamExploreContent
interface RelatedTopic {
  topic: string;
  type: string;
  reason: string;
}

interface RelatedQuestion {
  question: string;
  type: string;
  context: string;
}

export class GPTService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  private async makeRequest(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `${systemPrompt} Provide your response in JSON format.` 
          },
          { 
            role: 'user', 
            content: userPrompt 
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      return response.choices[0].message?.content || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async getExploreContent(query: string, userContext: UserContext): Promise<ExploreResponse> {
    try {
      const systemPrompt = `You are a Gen-Z tutor who explains complex topics concisely considering you are teaching someone with a low IQ.
        First, identify the domain of the topic from these categories:
        - SCIENCE: Physics, Chemistry, Biology
        - MATHEMATICS: Algebra, Calculus, Geometry
        - TECHNOLOGY: Computer Science, AI, Robotics
        - MEDICAL: Anatomy, Healthcare, Medicine
        - HISTORY: World History, Civilizations
        - BUSINESS: Economics, Finance, Marketing
        - LAW: Legal Systems, Rights
        - PSYCHOLOGY: Human Behavior, Development
        - CURRENT_AFFAIRS: Global Events, Politics
        - GENERAL: Any other topic

        Return your response in this EXACT JSON format:
        {
          "domain": "identified domain",
          "content": {
            "paragraph1": "Core concept in around 20-30 words - clear, simple, story-telling based introduction and definition",
            "paragraph2": "talk more detail about it in around 20-30 words - main ideas and examples",
            "paragraph3": "Real world applications in around 20-40 words - practical uses and relevance"
          },
          "relatedTopics": [
            {
              "topic": "Most fundamental prerequisite concept",
              "type": "prerequisite",
              "reason": "Brief explanation of why this is essential to understand first"
            },
            {
              "topic": "Most exciting advanced application",
              "type": "extension",
              "reason": "Why this advanced topic is fascinating"
            },
            {
              "topic": "Most impactful real-world use",
              "type": "application",
              "reason": "How this changes everyday life"
            },
            {
              "topic": "Most interesting related concept",
              "type": "parallel",
              "reason": "What makes this connection intriguing"
            },
            {
              "topic": "Most thought-provoking aspect",
              "type": "deeper",
              "reason": "Why this specific aspect is mind-bending"
            }
          ],
          "relatedQuestions": [
            {
              "question": "What if...? (speculative question)",
              "type": "curiosity",
              "context": "Thought-provoking scenario"
            },
            {
              "question": "How exactly...? (mechanism question)",
              "type": "mechanism",
              "context": "Fascinating process to understand"
            },
            {
              "question": "Why does...? (causality question)",
              "type": "causality",
              "context": "Surprising cause-effect relationship"
            },
            {
              "question": "Can we...? (possibility question)",
              "type": "innovation",
              "context": "Exciting potential development"
            },
            {
              "question": "What's the connection between...? (insight question)",
              "type": "insight",
              "context": "Unexpected relationship"
            }
          ]
        }

        IMPORTANT RULES:
        - Each paragraph MUST be around 20-30 words
        - Use simple, clear language
        - Focus on key information only
        - No repetition between paragraphs
        - Make every word count
        - Keep examples specific and brief

        SUBTOPIC GUIDELINES:
        - Focus on the most fascinating aspects
        - Highlight unexpected connections
        - Show real-world relevance
        - Include cutting-edge developments
        - Connect to current trends
        - Emphasize "wow factor"

        QUESTION GUIDELINES:
        - Start with curiosity triggers: "What if", "How exactly", "Why does", "Can we"
        - Focus on mind-bending aspects
        - Highlight counterintuitive elements
        - Explore edge cases
        - Connect to emerging trends
        - Challenge assumptions
        - Spark imagination
        - Make reader think "I never thought about that!"`;

      const userPrompt = `Explain "${query}" in approximately three 20-30 word paragraphs:
        1. Basic definition without using words like imagine
        2. more details
        3. Real-world application examples without using the word real world application
        Make it engaging for someone aged ${userContext.age}.`;

      const content = await this.makeRequest(systemPrompt, userPrompt);
      console.log('Raw GPT response:', content);
      
      if (!content) {
        throw new Error('Empty response from GPT');
      }

      const parsedContent = JSON.parse(content);
      console.log('Parsed content:', parsedContent);

      // Validate the response structure
      if (!parsedContent.domain || !parsedContent.content || 
          !parsedContent.content.paragraph1 || 
          !parsedContent.content.paragraph2 || 
          !parsedContent.content.paragraph3) {
        throw new Error('Invalid response structure');
      }

      // Combine paragraphs into content
      const formattedContent = [
        parsedContent.content.paragraph1,
        parsedContent.content.paragraph2,
        parsedContent.content.paragraph3
      ].join('\n\n');

      // Ensure related topics and questions exist
      const relatedTopics = Array.isArray(parsedContent.relatedTopics) 
        ? parsedContent.relatedTopics.slice(0, 5) 
        : [];

      const relatedQuestions = Array.isArray(parsedContent.relatedQuestions)
        ? parsedContent.relatedQuestions.slice(0, 5)
        : [];

      return {
        content: formattedContent,
        relatedTopics: relatedTopics,
        relatedQuestions: relatedQuestions
      };

    } catch (error) {
      console.error('Explore content error:', error);
      throw new Error('Failed to generate explore content');
    }
  }

  private validateQuestionFormat(question: Question): boolean {
    try {
      // Basic validation
      if (!question.text?.trim()) return false;
      if (!Array.isArray(question.options) || question.options.length !== 4) return false;
      if (question.options.some(opt => !opt?.trim())) return false;
      if (typeof question.correctAnswer !== 'number' || 
          question.correctAnswer < 0 || 
          question.correctAnswer > 3) return false;

      // Explanation validation
      if (!question.explanation?.correct?.trim() || 
          !question.explanation?.key_point?.trim()) return false;

      // Additional validation
      if (question.text.length < 10) return false;  // Too short
      if (question.options.length !== new Set(question.options).size) return false; // Duplicates
      if (question.explanation.correct.length < 5 || 
          question.explanation.key_point.length < 5) return false; // Too short explanations

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  async getPlaygroundQuestion(topic: string, level: number, userContext: UserContext): Promise<Question> {
    try {
      const aspects = [
        'core_concepts',
        'applications',
        'problem_solving',
        'analysis',
        'current_trends'
      ];

      // Randomly select an aspect to focus on
      const selectedAspect = aspects[Math.floor(Math.random() * aspects.length)];
      
      const systemPrompt = `Generate a UNIQUE multiple-choice question about ${topic}.
        Focus on: ${selectedAspect.replace('_', ' ')}

        Return in this JSON format:
        {
          "text": "question text here",
          "options": ["option A", "option B", "option C", "option D"],
          "correctAnswer": RANDOMLY_PICKED_NUMBER_0_TO_3,
          "explanation": {
            "correct": "Brief explanation of why the correct answer is right (max 15 words)",
            "key_point": "One key concept to remember (max 10 words)"
          },
          "difficulty": ${level},
          "topic": "${topic}",
          "subtopic": "specific subtopic",
          "questionType": "conceptual",
          "ageGroup": "${userContext.age}"
        }

        IMPORTANT RULES FOR UNIQUENESS:
        1. For ${topic}, based on selected aspect:
           - core_concepts: Focus on fundamental principles and theories
           - applications: Focus on real-world use cases and implementations
           - problem_solving: Present a scenario that needs solution
           - analysis: Compare different approaches or technologies
           - current_trends: Focus on recent developments and future directions

        2. Question Variety:
           - NEVER use the same question pattern twice
           - Mix theoretical and practical aspects
           - Include industry-specific examples
           - Use different question formats (what/why/how/compare)
           - Incorporate current developments in ${topic}

        3. Answer Choices:
           - Make ALL options equally plausible
           - Randomly assign the correct answer (0-3)
           - Ensure options are distinct but related
           - Include common misconceptions
           - Make wrong options educational

        4. Format Requirements:
           - Question must be detailed and specific
           - Each option must be substantive
           - Explanation must cover why correct answer is right AND why others are wrong
           - Include real-world context where possible
           - Use age-appropriate language

        ENSURE HIGH ENTROPY:
        - Randomize question patterns
        - Vary difficulty within level ${level}
        - Mix theoretical and practical aspects
        - Use different companies/technologies as examples
        - Include various ${topic} scenarios

        EXPLANATION GUIDELINES:
        - Keep explanations extremely concise and clear
        - Focus on the most important point only
        - Use simple language
        - Highlight the key concept
        - No redundant information
        - Maximum 25 words total`;

      const userPrompt = `Create a completely unique ${level}/10 difficulty question about ${topic}.
        Focus on ${selectedAspect.replace('_', ' ')}.
        Ensure the correct answer is randomly placed.
        Make it engaging for a ${userContext.age} year old student.
        Use current examples and trends.`;

      const content = await this.makeRequest(syste
