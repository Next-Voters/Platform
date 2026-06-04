"use client"

import LoadingMessageBubble from "@/components/chat-platform/loading-message-bubble";
import MessageBubble from "@/components/chat-platform/message-bubble";
import NoChatScreen from "@/components/chat-platform/no-chat-screen";
import ClientMountWrapper from "@/components/client-mount-wrapper";
import PreferenceSelector from "@/components/preference-selector";
import { getPreference } from "@/lib/country-preference";
import { AIAgentResponse } from "@/types/chat-platform/chat-platform";
import { Message } from "@/types/chat-platform/message";
import { useMutation } from "@tanstack/react-query";
import { SendHorizonal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import handleFindRegionDetails from "@/lib/chat-platform/find-info-region";
import { useAuth } from "@/hooks/use-auth";

const Chat = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('message');
  const { user, isLoading: authLoading } = useAuth();
  const [message, setMessage] = useState('');

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // boolean tags
  const hasAutoSent = useRef(false);

  const region = getPreference();

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          region: region,
          collectionName: handleFindRegionDetails("collectionName", region),
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Create agent message entry for streaming updates
      let agentMessageIndex: number | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            // Isolate JSON parse errors so intentional throws (server error
            // events) propagate up and trigger React Query's onError handler.
            let data: { type: string; data?: AIAgentResponse; message?: string } | null = null;
            try {
              const jsonStr = line.slice(6);
              if (!jsonStr.trim()) continue;
              data = JSON.parse(jsonStr);
            } catch (e) {
              console.error('Error parsing SSE message:', e, 'Line:', line);
              continue;
            }

            if (!data) continue;

            if (data.type === 'party' && data.data) {
              const partyData: AIAgentResponse = {
                partyName: data.data.partyName,
                partyStance: data.data.partyStance,
                supportingDetails: data.data.supportingDetails,
                citations: data.data.citations
              };

              // Update chat history with new party response
              setChatHistory(prev => {
                const newHistory = [...prev];

                // Find or create the agent message
                if (agentMessageIndex === null) {
                  // Find the last agent message (should be the one we just created in onMutate)
                  const lastIndex = newHistory.length - 1;
                  if (lastIndex >= 0 && newHistory[lastIndex]?.type === 'agent') {
                    agentMessageIndex = lastIndex;
                  } else {
                    // Create new agent message
                    newHistory.push({
                      type: 'agent' as const,
                      parties: []
                    });
                    agentMessageIndex = newHistory.length - 1;
                  }
                }

                const agentMessage = newHistory[agentMessageIndex];
                if (agentMessage?.type === 'agent') {
                  // Check if party already exists
                  const existingIndex = agentMessage.parties.findIndex(
                    p => p.partyName === partyData.partyName
                  );

                  if (existingIndex >= 0) {
                    // Update existing party
                    newHistory[agentMessageIndex] = {
                      type: 'agent' as const,
                      parties: agentMessage.parties.map((p, idx) =>
                        idx === existingIndex ? partyData : p
                      )
                    };
                  } else {
                    // Add new party
                    newHistory[agentMessageIndex] = {
                      type: 'agent' as const,
                      parties: [...agentMessage.parties, partyData]
                    };
                  }
                }

                return newHistory;
              });
            } else if (data.type === 'done') {
              // Stream completed
              return { done: true };
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Unknown error occurred');
            }
          }
        }
      }

      return { done: true };
    },
    onMutate: (message) => {
      // Optimistically update the UI
      setMessageLoading(true);
      setChatHistory(prev => [
        ...prev,
        {
          type: 'reg' as const,
          message
        },
        {
          type: 'agent' as const,
          parties: []
        }
      ]);
    },
    onSuccess: () => {
      setMessage('');
    },
    onSettled: () => {
      setMessageLoading(false);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setChatHistory(prev => {
        const newHistory = [...prev];
        // Remove empty agent message if it exists
        const lastMessage = newHistory[newHistory.length - 1];
        if (lastMessage?.type === 'agent' && lastMessage.parties.length === 0) {
          newHistory.pop();
        }
        // Add error message
        newHistory.push({
          type: 'agent' as const,
          parties: [{
            partyName: 'System',
            partyStance: ['Error'],
            supportingDetails: ['Failed to send message. Please try again.'],
            citations: []
          }]
        });
        return newHistory;
      });
    }
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (message.trim()) {
        sendMessage(message);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      const redirectTo = initialMessage
        ? `/chat?message=${encodeURIComponent(initialMessage)}`
        : '/chat';
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }, [authLoading, user, router, initialMessage]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (initialMessage && !hasAutoSent.current) {
      hasAutoSent.current = true;
      sendMessage(initialMessage);
    }
  }, [authLoading, user, initialMessage, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (authLoading || !user) {
    return (
      <div className="w-full min-h-screen bg-page flex items-center justify-center">
        <p className="text-gray-400 text-[14px]">Loading…</p>
      </div>
    );
  }

  return (
    <ClientMountWrapper className="h-screen bg-page flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 sm:py-10 mb-32 sm:mb-28">
        <div className="max-w-4xl mx-auto">
          {chatHistory.length > 0 ? (
            <>
            {chatHistory.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg}
                  isFromMe={msg.type === "reg"}
                />
            ))}
            {messageLoading && (
              <LoadingMessageBubble />
            )}
            </>
          ) : (
            <NoChatScreen onSuggestionClick={(q) => { setMessage(q); sendMessage(q); }} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - safe area for notched devices */}
      <div className="fixed bottom-0 left-0 right-0 bg-page/95 backdrop-blur-sm border-t border-gray-200 px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0 relative">
              <textarea
                className="w-full bg-white py-3 px-4 pr-14 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 text-[14px] placeholder-gray-400 text-gray-900 resize-none max-h-32 min-h-[48px] transition-all"
                value={message}
                placeholder="Ask about any policy or legislation…"
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button
                onClick={() => message.trim() && sendMessage(message)}
                disabled={!message.trim()}
                size="sm"
                aria-label="Send message"
                className="absolute right-2 bottom-2 min-w-[40px] min-h-[40px] w-10 h-10 bg-brand hover:bg-brand-hover disabled:bg-gray-200 disabled:opacity-60 text-white rounded-xl flex items-center justify-center transition-colors border-0 p-0 touch-manipulation"
              >
                <SendHorizonal size={14} className="shrink-0" />
              </Button>

              <PreferenceSelector />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            AI can be incorrect. Always verify with the cited sources.
          </p>
        </div>
      </div>
    </ClientMountWrapper>
  );
};

const ChatPage = () => {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading chat...</div>}>
      <Chat />
    </Suspense>
  )
}

export default ChatPage;
