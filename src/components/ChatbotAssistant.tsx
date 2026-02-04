import { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePageContext } from "@/contexts/PageContext";
import { useInactivityMonitor } from "@/hooks/useInactivityMonitor";

type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

const ChatbotAssistant = () => {
  const { currentPage, currentModal, additionalContext } = usePageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelpBubble, setShowHelpBubble] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your T6 assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested questions
  const suggestedQuestions = [
    "Help me with understanding whats on the Screen",
  ];

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    // Focus the input after a brief delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Monitor user inactivity - show help bubble after 5 seconds of no activity
  // Bubble stays visible until user clicks it or performs meaningful action
  useInactivityMonitor({
    timeout: 5000, // 5 seconds
    onInactive: () => {
      console.log("User inactive - showing help bubble");
      // Only show bubble if chatbot is not already open
      if (!isOpen) {
        setShowHelpBubble(true);
      }
    },
    // Don't hide on activity - bubble stays until clicked or meaningful action
    enabled: !isOpen, // Only monitor when chatbot is closed
  });

  // Load knowledge base on mount
  useEffect(() => {
    fetch("/knowledge-base.txt")
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to load knowledge base: ${res.status} ${res.statusText}`
          );
        }
        return res.text();
      })
      .then((text) => setKnowledgeBase(text))
      .catch((err) => {
        console.error("Failed to load knowledge base:", err);
        setKnowledgeBase("Knowledge base could not be loaded.");
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const buildSystemPrompt = (): string => {
    let prompt = `You are a helpful medical assistant for the CDP (Care Delivery Platform) system. Your role is to guide users through the platform and help them understand how to use it effectively.

KNOWLEDGE BASE:
${knowledgeBase || "Knowledge base is loading..."}

CURRENT USER CONTEXT:
- Current Page: ${currentPage}
${currentModal ? `- Current Modal/View: ${currentModal}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

INSTRUCTIONS:
1. Use the knowledge base above to answer questions about the CDP platform.
2. Consider the user's current location (page and modal) when providing help.
3. If the user asks about what they're seeing or what to do next, reference their current context.
4. Be clear, concise, and professional.
5. Do NOT provide medical advice or clinical decisions - only explain how to use the website.
6. If the user is stuck in a modal or on a page, provide specific guidance based on their current location.
7. When describing Home or dashboard options, present all options as equal choices. Do NOT split them into "main" vs "limited" or "read-only" or "demo" — treat every option as a normal, primary option.

FORMATTING (use Markdown so the UI can display it clearly):
- Use **bold** for important terms, button names, and section names.
- For lists of options or items, use bullet points with a dash and space: "- Item one"
- For step-by-step instructions, use numbered lists: "1. First step" then "2. Second step" on new lines.
- Keep paragraphs short (2–3 sentences). Add a blank line between paragraphs.
- Use headings only when splitting a long answer: "### Section title" for a new section.

When answering, always consider where the user currently is in the application and tailor your response accordingly.`;

    return prompt;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DeepSeek API key not found");
      }

      const systemPrompt = buildSystemPrompt();

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            // Include last 10 messages for context (excluding the new user message)
            ...messages.slice(-10).map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            {
              role: "user",
              content: userMessage.text,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: rawContent.trim(),
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenChatbot = () => {
    console.log("Opening chatbot");
    setIsOpen(true);
    setIsMinimized(false);
    setShowHelpBubble(false); // Hide bubble when chatbot opens
  };

  // Hide bubble when chatbot opens
  useEffect(() => {
    if (isOpen) {
      setShowHelpBubble(false);
    }
  }, [isOpen]);

  // Listen for meaningful user actions that should hide the bubble
  useEffect(() => {
    if (!showHelpBubble) return;

    const handleMeaningfulAction = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if the click is on the bubble itself (don't hide in that case)
      if (target.closest('[aria-label="Need help? Open chatbot"]')) {
        return;
      }

      // Hide bubble on meaningful actions:
      // - Button clicks (except the bubble itself)
      // - Form submissions
      // - Link clicks
      // - Input focus (user is interacting with forms)
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('form') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        console.log("Meaningful action detected - hiding bubble");
        setShowHelpBubble(false);
      }
    };

    // Listen for clicks and form submissions
    document.addEventListener('click', handleMeaningfulAction, true);
    document.addEventListener('submit', handleMeaningfulAction, true);
    document.addEventListener('focusin', handleMeaningfulAction, true);

    return () => {
      document.removeEventListener('click', handleMeaningfulAction, true);
      document.removeEventListener('submit', handleMeaningfulAction, true);
      document.removeEventListener('focusin', handleMeaningfulAction, true);
    };
  }, [showHelpBubble]);

  return (
    <>
      {/* Help Bubble - Appears to the left of chatbot icon when user is inactive */}
      {showHelpBubble && !isOpen && (
        <div className="fixed bottom-6 right-32 z-50 flex items-center animate-in fade-in-0 zoom-in-95 duration-300" style={{ height: '80px' }}>
          <button
            onClick={handleOpenChatbot}
            className="group relative flex items-center gap-3 rounded-lg bg-primary px-4 py-3 shadow-lg hover:bg-primary/90 transition-all animate-bubble-gentle"
            aria-label="Need help? Open chatbot"
          >
            <span className="text-sm font-bold text-white whitespace-nowrap animate-subtle-glow">
              Hey! Need Help?
            </span>
            {/* Speech bubble tail pointing right - centered vertically to align with icon center */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-primary group-hover:border-l-primary/90"></div>
            </div>
          </button>
        </div>
      )}

      {/* Chatbot Button - Fixed bottom right */}
      {!isOpen && (
        <button
          onClick={handleOpenChatbot}
          className="fixed bottom-6 right-6 z-50 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
          aria-label="Open chatbot"
        >
          <img
            src="/ask-t6-logo.png"
            alt="T6 Assistant"
            className="h-16 w-16 object-contain"
          />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-xl overflow-hidden bg-[#1F2937] shadow-[0_18px_60px_rgba(0,0,0,0.55)] border border-white/10 transition-all ${
            isMinimized ? "h-16 w-[420px]" : "h-[660px] w-[440px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111827]/40 rounded-t-xl">
            <div className="flex items-center gap-3">
              <img
                src="/ask-t6-logo.png"
                alt="T6 Assistant"
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-bold text-white">T6 Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="h-4 w-4 text-white/70" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Close chatbot"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "assistant" && (
                      <img
                        src="/ask-t6-bot-avatar.png"
                        alt="T6"
                        className="h-8 w-8 shrink-0 rounded-full object-contain"
                      />
                    )}
                    <div className="max-w-[80%] px-4 py-2 bg-[#F1F5F9] text-[#1F2937] rounded-lg">
                      {message.sender === "assistant" ? (
                        <>
                          <div className="chat-bot-markdown text-sm font-medium text-[#1F2937] prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-p:leading-snug prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold prose-headings:text-[#1F2937] prose-strong:text-[#1F2937] prose-strong:font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                          </div>
                          {/* Video player for detailed explanation */}
                          <div className="mt-4 pt-4 border-t border-[#1F2937]/20">
                            <p className="text-xs font-semibold text-[#1F2937]/70 mb-2">For detailed video explanation:</p>
                            <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                              <iframe
                                src="https://player.cliperact.com?player_id=e4aff00b-f20e-43d7-a025-74e1d3628ad8"
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Detailed Video Explanation"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-normal whitespace-pre-wrap">{message.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <img
                      src="/ask-t6-bot-avatar.png"
                      alt="T6"
                      className="h-8 w-8 shrink-0 rounded-full object-contain"
                    />
                    <div className="bg-[#F1F5F9] rounded-lg px-4 py-2 text-[#1F2937]">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#1F2937] rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#1F2937] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 bg-[#1F2937] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                {/* Suggested questions – always visible below the chat */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-amber-400/90 px-1">Suggested questions:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      className="w-full text-left rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/50 px-4 py-3 text-sm font-semibold text-amber-200 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-4 bg-[#111827]/40 rounded-b-xl">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-[#94A3B8] placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#2563EB] text-sm font-semibold"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotAssistant;
