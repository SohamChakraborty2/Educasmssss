
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SearchBar } from '../shared/SearchBar';
import { api } from '../../services/api'; // Updated import
import { MarkdownComponentProps, UserContext } from '../../types';
import { RelatedTopics } from './RelatedTopics';
import { RelatedQuestions } from './RelatedQuestions';
import { LoadingAnimation } from '../shared/LoadingAnimation';

interface Message {
  type: 'user' | 'ai';
  content?: string;
  topics?: Array<{
    topic: string;
    type: string;
    reason: string;
  }>;
  questions?: Array<{
    question: string;
    type: string;
    context: string;
  }>;
}

interface ExploreViewProps {
  initialQuery?: string;
  onError: (message: string) => void;
  onRelatedQueryClick?: (query: string) => void;
  userContext: UserContext;
}

// Custom Markdown components for AI-rendered content
const MarkdownComponents: Record<string, React.FC<MarkdownComponentProps>> = {
  h1: ({ children, ...props }) => (
    <h1 className="text-xl sm:text-2xl font-bold text-gray-100 mt-4 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg sm:text-xl font-semibold text-gray-100 mt-3 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-base sm:text-lg font-medium text-gray-200 mt-2 mb-1" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-sm sm:text-base text-gray-300 my-1.5 leading-relaxed break-words" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-2 text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside my-2 text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="my-1 text-gray-300" {...props}>
      {children}
    </li>
  ),
  code: ({ children, inline, ...props }) =>
    inline ? (
      <code className="bg-gray-700 px-1 rounded text-xs sm:text-sm" {...props}>
        {children}
      </code>
    ) : (
      <code className="block bg-gray-700 p-2 rounded my-2 text-xs sm:text-sm overflow-x-auto" {...props}>
        {children}
      </code>
    ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-gray-500 pl-4 my-2 text-gray-400 italic" {...props}>
      {children}
    </blockquote>
  ),
};

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialQuery,
  onError,
  onRelatedQueryClick,
  userContext,
}) => {
  // State to store full chat history
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInitialSearch, setShowInitialSearch] = useState(!initialQuery);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for scrollable container and end marker
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll function: scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // When messages update, auto-scroll if user is near the bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = messagesContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  // Listen for external reset events
  useEffect(() => {
    const handleReset = () => {
      setMessages([]);
      setShowInitialSearch(true);
    };
    window.addEventListener('resetExplore', handleReset);
    return () => window.removeEventListener('resetExplore', handleReset);
  }, []);

  // Handle search: include conversation context for follow-up questions
  const handleSearch = useCallback(async (query: string) => {
    try {
      // Vibrate device for feedback if available
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      // Append the new user query to existing messages
      const updatedMessages = [...messages, { type: 'user', content: query }];
      setMessages(updatedMessages);

      // Build conversation context: a string with all previous messages
      const conversationContext = updatedMessages
        .map(msg => (msg.type === 'user' ? `User: ${msg.content}` : `AI: ${msg.content || ''}`))
        .join('\n');

      // Construct the prompts
      const systemPrompt = "You are a Gen-Z tutor who explains complex topics concisely.";
      const userPrompt = `Here is our conversation so far:
${conversationContext}

Now, answer the new query in JSON format with keys "content", "relatedTopics", and "relatedQuestions".`;

      // Append a placeholder for the AI response
      setMessages(prev => [...prev, { type: 'ai', content: '' }]);
      setShowInitialSearch(false);
      setIsLoading(true);

      // Use the backend endpoint via our API helper; note the change here:
      const data = await api.explore(query, userContext);
      
      // Assume backend returns result in data (if string, parse it)
      const result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

      // Replace the last AI placeholder with the actual response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'ai',
          content: result.content,
          topics: result.relatedTopics,
          questions: result.relatedQuestions
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Search error:', error);
      onError(error instanceof Error ? error.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [messages, onError, userContext]);

  const handleRelatedQueryClick = useCallback((query: string) => {
    if (onRelatedQueryClick) {
      onRelatedQueryClick(query);
    }
    handleSearch(query);
  }, [handleSearch, onRelatedQueryClick]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col">
      {showInitialSearch ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            What do you want to explore?
          </h1>
          <div className="w-full px-2 sm:px-4 max-w-3xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Ask a follow-up question..."
              centered={false}
              className="bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 h-10"
              value=""
              onChange={() => {}}
            />
          </div>

            <p className="text-sm text-gray-400 text-center mt-1">Press Enter to search</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="text-sm text-gray-400">Try:</span>
              <button
                onClick={() => handleSearch("Quantum Physics")}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors text-xs sm:text-sm text-purple-300"
              >
                ⚛️ Quantum Physics
              </button>
              <button
                onClick={() => handleSearch("Machine Learning")}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors text-xs sm:text-sm text-blue-300"
              >
                🤖 Machine Learning
              </button>
              <button
                onClick={() => handleSearch("World History")}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors text-xs sm:text-sm text-green-300"
              >
                🌍 World History
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div ref={messagesContainerRef} className="relative flex flex-col w-full overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="space-y-2 pb-16">
            {messages.map((message, index) => (
              <div key={index} className="px-2 sm:px-4 w-full mx-auto">
                <div className="max-w-3xl mx-auto">
                  {message.type === 'user' ? (
                    <div className="text-base sm:text-lg font-semibold text-gray-100">
                      {message.content}
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      {!message.content && isLoading ? (
                        <div className="flex items-center space-x-2 py-2">
                          <LoadingAnimation />
                          <span className="text-sm text-gray-400">Thinking...</span>
                        </div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            ...MarkdownComponents,
                            p: ({ children }) => (
                              <p className="text-sm sm:text-base text-gray-300 my-1.5 leading-relaxed break-words">
                                {children}
                              </p>
                            ),
                          }}
                          className="whitespace-pre-wrap break-words space-y-1.5"
                        >
                          {message.content || ''}
                        </ReactMarkdown>
                      )}
                      {message.topics && message.topics.length > 0 && (
                        <div className="mt-3">
                          <RelatedTopics
                            topics={message.topics}
                            onTopicClick={handleRelatedQueryClick}
                          />
                        </div>
                      )}
                      {message.questions && message.questions.length > 0 && (
                        <div className="mt-3">
                          <RelatedQuestions
                            questions={message.questions}
                            onQuestionClick={handleRelatedQueryClick}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-8 w-full" aria-hidden="true" />
          </div>
          <div className="fixed bottom-12 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pb-1 pt-2 z-50">
            <div className="w-full px-2 sm:px-4 max-w-3xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Ask a follow-up question..."
                centered={false}
                className="bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 h-10"
                value=""
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ExploreView.displayName = 'ExploreView';
   centered={false}
                className="bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 h-10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ExploreView.displayName = 'ExploreView';
