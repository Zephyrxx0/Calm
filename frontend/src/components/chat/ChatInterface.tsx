"use client";

import { useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";

interface ChatInterfaceProps {
  sessionId: string;
  initialMessage?: string | null;
}

export default function ChatInterface({ sessionId, initialMessage }: ChatInterfaceProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/interview/message",
        headers: {
          "x-session-id": sessionId,
        },
      }),
    [sessionId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const handleQuickAnswer = (answer: string) => {
    if (status === "streaming" || status === "submitted") return;
    sendMessage({ text: answer });
  };

  // Quick answer options for quantitative questions
  const quickAnswers = [
    { label: "0-5", value: "0-5" },
    { label: "5-20", value: "5-20" },
    { label: "20+", value: "20+" },
    { label: "Skip", value: "skip" },
  ];

  return (
    <div className="flex flex-1 flex-col max-w-3xl mx-auto w-full h-full relative px-4">
      
      {/* Scrollable message list using Conversation */}
      <Conversation className="flex-1 pb-32">
        <ConversationContent className="gap-6 pb-12 pt-8">
          {initialMessage && (
            <Message from="assistant" className="animate-fade-in">
              <MessageContent className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-border text-foreground">
                <MessageResponse className="prose prose-sm md:prose-base max-w-none text-foreground/90 leading-relaxed font-sans prose-p:leading-relaxed">
                  {initialMessage}
                </MessageResponse>
              </MessageContent>
            </Message>
          )}
          {messages.length === 0 && !initialMessage && (
            <div className="text-center text-muted py-12 animate-fade-in">
              <p className="text-sm font-sans">Your gentle conversation will appear here.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <Message key={message.id} from={message.role} className="animate-fade-in">
              <MessageContent 
                className={`p-5 shadow-sm text-sm md:text-base font-sans leading-relaxed
                  ${message.role === "user" 
                    ? "bg-accent text-white rounded-2xl rounded-tr-sm ml-auto ring-1 ring-accent-hover/20" 
                    : "bg-surface text-foreground rounded-2xl rounded-tl-sm ring-1 ring-border"
                  }
                `}
              >
                {/* Parse out streamdown components or just plain text */}
                <MessageResponse className={`prose max-w-none ${message.role === "user" ? "prose-p:text-white" : "prose-p:text-foreground/90"} prose-p:leading-relaxed`}>
                  {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("\n")}
                </MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      {/* Input area anchored to bottom */}
      <div className="absolute bottom-6 left-4 right-4 md:left-12 md:right-12">
        <div className="bg-surface/80 backdrop-blur-xl ring-1 ring-black/[0.08] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] rounded-2xl p-2 pb-3">
          
          {/* Quick-answer buttons */}
          <div className="flex gap-2 flex-wrap mb-3 px-2 pt-2">
            {quickAnswers.map((qa) => (
              <button
                key={qa.value}
                onClick={() => handleQuickAnswer(qa.value)}
                disabled={status === "streaming" || status === "submitted"}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-light transition-all hover:text-foreground hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed hover:border-muted/30"
              >
                {qa.label}
              </button>
            ))}
          </div>

          <PromptInput
            onSubmit={({ text }) => {
              if (!text.trim() || status === "streaming" || status === "submitted") return;
              sendMessage({ text });
            }}
            className="w-full relative"
          >
            <PromptInputTextarea 
              placeholder="Reflect and reply..." 
              className="min-h-[50px] bg-transparent border-none shadow-none focus-visible:ring-0 resize-none font-sans text-base px-3 py-2 text-foreground placeholder:text-muted-light"
            />
            <PromptInputFooter className="flex justify-between items-center px-2">
              <span className="text-[10px] text-muted-light tracking-wide uppercase font-medium">Take your time</span>
              <PromptInputSubmit 
                status={status} 
                className="bg-accent text-white hover:bg-accent-hover rounded-full px-5 py-2 font-medium text-sm transition-transform active:scale-95"
              >
                Respond
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
