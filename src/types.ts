export interface UserContext {
  age: number;
  studyingFor: string;
}

export interface MarkdownComponentProps {
  children: React.ReactNode;
  [key: string]: any;
}

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  topic: string;
  subtopic: string;
  questionType: string;
  ageGroup: string;
}

export interface ExploreResponse {
  content: string;
  relatedTopics: Array<{
    topic: string;
    type: string;
  }>;
  relatedQuestions: Array<{
    question: string;
    type: string;
    context: string;
  }>;
}

export interface PreFillFormProps {
  onSubmit: (context: UserContext) => void;
} 