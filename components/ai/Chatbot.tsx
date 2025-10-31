'use client';

// AI Chatbot Component
// Conversational interface accessible from all pages

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getChatbotService, ChatMessage, ChatAction } from '@/services/gemini/chatbot';
import { toast } from 'react-hot-toast';

interface ChatbotProps {
  userId: string;
  onClose?: () => void;
}

export function Chatbot({ userId, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotService = getChatbotService();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session
  useEffect(() => {
    const session = chatbotService.createSession(userId);
    setSessionId(session.id);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Answering business questions\n• Finding products, customers, and orders\n• Analyzing sales and inventory data\n• Creating reports and insights\n• Navigating the system\n\nWhat would you like to know?',
      timestamp: new Date(),
      metadata: {
        confidence: 1,
      },
    };
    setMessages([welcomeMessage]);
  }, [userId]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Get AI response
      const response = await chatbotService.sendMessage(sessionId, userMessage, userId);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Failed to get response. Please try again.');
      
      // Add error message
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
        metadata: {
          confidence: 0,
        },
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = async (action: ChatAction) => {
    try {
      const result = await chatbotService.executeAction(action, userId);
      
      if (result.navigate) {
        // Navigate to the specified path
        window.location.href = result.navigate;
      } else {
        toast.success(`Action executed: ${action.label}`);
      }
    } catch (error) {
      console.error('Action execution error:', error);
      toast.error('Failed to execute action');
    }
  };

  const handleClearHistory = () => {
    if (sessionId) {
      chatbotService.clearHistory(sessionId);
      setMessages([]);
      toast.success('Chat history cleared');
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Confidence badge */}
                {message.metadata?.confidence !== undefined && message.role === 'assistant' && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}

                {/* Action buttons */}
                {message.metadata?.actions && message.metadata.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.metadata.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionClick(action)}
                        className="w-full text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-1 text-xs opacity-70">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}

// Floating chatbot button component
export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}
      
      {isOpen && (
        <Chatbot
          userId="current-user" // This should come from auth context
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
