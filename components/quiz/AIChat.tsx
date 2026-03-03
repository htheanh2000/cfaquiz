'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  X, 
  Send, 
  Sparkles, 
  User,
  Bot,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface QuestionContext {
  questionText: string;
  topic?: string;
  difficulty?: string;
  answers?: string[];
}

interface AIChatProps {
  questionContext: QuestionContext;
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedPrompts = [
  "Can you explain the key concept here?",
  "What formula should I use?",
  "Give me a hint without the answer",
  "Break down the problem step by step",
];

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

export default function AIChat({ questionContext, isOpen, onToggle }: AIChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Reset chat when question changes
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [questionContext.questionText]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          questionContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        let fullContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullContent }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    // Use setTimeout to ensure state is updated before submitting
    setTimeout(() => {
      // Need to use the prompt directly since state might not be updated yet
      handleSubmitWithContent(prompt);
    }, 0);
  };

  const handleSubmitWithContent = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          questionContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        let fullContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullContent }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button - Fixed on right side when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            onClick={onToggle}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-l-xl shadow-lg flex items-center gap-2 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">AI Tutor</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            ref={panelRef}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={isResizing ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="border-l border-border bg-white flex overflow-hidden relative"
            style={{ minWidth: isOpen ? MIN_WIDTH : 0, height: 'calc(100vh - 4rem)' }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center group hover:bg-emerald-100/50 transition-colors",
                isResizing && "bg-emerald-100"
              )}
            >
              <div className={cn(
                "w-1 h-12 rounded-full bg-slate-300 group-hover:bg-emerald-400 transition-colors",
                isResizing && "bg-emerald-500"
              )} />
            </div>

            {/* Panel Content */}
            <div className="flex flex-col flex-1 ml-3 h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">AI Study Assistant</h3>
                      <p className="text-xs text-emerald-100">Ask for hints & explanations</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Need help with this question?</h4>
                    <p className="text-sm text-slate-500 mb-6">
                      I can explain concepts and give hints without revealing the answer.
                    </p>
                    
                    {/* Suggested Prompts */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Try asking:
                      </p>
                      {suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedPrompt(prompt)}
                          disabled={isLoading}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-sm text-slate-700 transition-colors flex items-center gap-2 group disabled:opacity-50"
                        >
                          <Lightbulb className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                          <span className="truncate">{prompt}</span>
                          <ChevronRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-emerald-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? "flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          message.role === 'user' 
                            ? "bg-slate-200" 
                            : "bg-emerald-100"
                        )}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-slate-600" />
                          ) : (
                            <Bot className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className={cn(
                          "flex-1 p-3 rounded-xl text-sm overflow-x-auto",
                          message.role === 'user'
                            ? "bg-emerald-500 text-white rounded-tr-none"
                            : "bg-slate-100 text-slate-700 rounded-tl-none"
                        )}>
                          <div className={cn(
                            "prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0",
                            message.role === 'user' && "prose-invert"
                          )}>
                            {message.content ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              isLoading && message.role === 'assistant' ? '...' : ''
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="bg-slate-100 p-3 rounded-xl rounded-tl-none">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-slate-50 shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    name="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this question..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  AI won&apos;t give you the answer directly
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
