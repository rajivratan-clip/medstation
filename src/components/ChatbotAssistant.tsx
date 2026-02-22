import { useState, useRef, useEffect, useMemo } from "react";
import { X, Send, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { usePatientStore } from "@/store/patientStore";
import { useUser } from "@/contexts/UserContext";
import { useInactivityMonitor } from "@/hooks/useInactivityMonitor";
import { eventTracker } from "@/analytics/eventTracker";

type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isInitialMessage?: boolean; // Flag to identify the hardcoded hello message
};

const ChatbotAssistant = () => {
  const location = useLocation();
  const { currentPage, currentModal, additionalContext } = usePageContext();
  const { patients, encounters } = usePatientStore();
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelpBubble, setShowHelpBubble] = useState(false);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [criticalAlertShownAt, setCriticalAlertShownAt] = useState<number | null>(null);
  const [criticalPatientsDetected, setCriticalPatientsDetected] = useState<Array<{ encounterId: string; patientName: string; news2: number }>>([]);
  const [isCriticalAlertDelayElapsed, setIsCriticalAlertDelayElapsed] = useState(false);
  const criticalDelayElapsedRef = useRef(false); // Ref so critical effect sees delay state in same render
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const lastCriticalCheckRef = useRef<Set<string>>(new Set()); // Track which critical patients we've already alerted about
  // Hardcoded initial hello message (not from AI)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your T6 assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
      isInitialMessage: true, // Flag to identify the hello message
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect active encounter and patient from route state
  const activeContext = useMemo(() => {
    if (location.pathname === "/new-encounter" && location.state) {
      const state = location.state as { encounterId?: string; encounterType?: string; patientData?: { patientId?: string; dodId?: string } };
      const encounter = state.encounterId ? encounters.find((e) => e.id === state.encounterId) : null;
      const patient = encounter 
        ? patients.find((p) => p.id === encounter.patientId)
        : state.patientData?.patientId 
        ? patients.find((p) => p.id === state.patientData.patientId)
        : null;
      
      return { encounter, patient, encounterType: state.encounterType };
    }
    return { encounter: null, patient: null, encounterType: null };
  }, [location, encounters, patients]);

  // Get active encounters summary for Patient Tracker context
  const activeEncountersSummary = useMemo(() => {
    if (currentPage === "Patient Tracker (Census)") {
      const active = encounters.filter((e) => e.status !== "discharged");
      const critical = active.filter((e) => e.news2 >= 5).length;
      const mediumRisk = active.filter((e) => e.news2 >= 3 && e.news2 < 5).length;
      const followed = active.filter((e) => e.careTeam.includes(currentUser.id)).length;
      
      return {
        total: active.length,
        critical,
        mediumRisk,
        followed,
      };
    }
    return null;
  }, [currentPage, encounters, currentUser.id]);

  // Delay critical popup briefly when entering Patient Tracker (e.g. 5s so it doesn't flash on load).
  const CRITICAL_ALERT_DELAY_MS = 2000;
  useEffect(() => {
    if (currentPage !== "Patient Tracker (Census)") {
      criticalDelayElapsedRef.current = true;
      setIsCriticalAlertDelayElapsed(true);
      return;
    }

    criticalDelayElapsedRef.current = false;
    setIsCriticalAlertDelayElapsed(false);
    const timer = window.setTimeout(() => {
      criticalDelayElapsedRef.current = true;
      setIsCriticalAlertDelayElapsed(true);
    }, CRITICAL_ALERT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentPage]);

  // Monitor for critical patients (NEWS-2 >= 5) - Initial detection when page loads or new critical patients appear
  useEffect(() => {
    if (currentPage === "Patient Tracker (Census)") {
      const active = encounters.filter((e) => e.status !== "discharged");
      const critical = active.filter((e) => e.news2 >= 5);
      
      if (critical.length > 0) {
        // Find newly critical patients (ones we haven't alerted about yet on initial load)
        const newCritical = critical.filter((encounter) => {
          const key = encounter.id;
          return !lastCriticalCheckRef.current.has(key);
        });

        // If there are new critical patients, show alert only after page-entry delay has elapsed
        if (newCritical.length > 0) {
          const criticalList = critical.map((encounter) => {
            const patient = patients.find((p) => p.id === encounter.patientId);
            return {
              encounterId: encounter.id,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
              news2: encounter.news2,
            };
          });

          if (!criticalDelayElapsedRef.current || !isCriticalAlertDelayElapsed) {
            setCriticalPatientsDetected(criticalList);
            return;
          }

          // Mark all critical as checked for initial detection
          critical.forEach((encounter) => {
            lastCriticalCheckRef.current.add(encounter.id);
          });

          newCritical.forEach((encounter) => {
            eventTracker.track(
              "alert_triggered",
              { alert_type: "critical", severity_score: encounter.news2 },
              { encounterId: encounter.id, patientId: encounter.patientId }
            );
          });
          setCriticalPatientsDetected(criticalList);
          setCriticalAlertShownAt(Date.now());
          setShowCriticalAlert(true);
        } else {
          // No new critical patients, but update the list if critical patients still exist
          // (This allows inactivity monitor to show alert again)
          const criticalList = critical.map((encounter) => {
            const patient = patients.find((p) => p.id === encounter.patientId);
            return {
              encounterId: encounter.id,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
              news2: encounter.news2,
            };
          });
          setCriticalPatientsDetected(criticalList);
        }
      } else {
        // No critical patients - reset alert and tracking
        lastCriticalCheckRef.current.clear();
        setShowCriticalAlert(false);
        setCriticalAlertShownAt(null);
        setCriticalPatientsDetected([]);
      }
    } else {
      // Reset tracking when not on Patient Tracker
      lastCriticalCheckRef.current.clear();
      setShowCriticalAlert(false);
      setCriticalAlertShownAt(null);
      setCriticalPatientsDetected([]);
    }
  }, [currentPage, encounters, patients, isCriticalAlertDelayElapsed]);

  // Get contextual suggested questions based on current page
  const suggestedQuestions = useMemo(() => {
    // If on Patient Tracker and there are critical patients, show critical-specific questions
    if (currentPage === "Patient Tracker (Census)") {
      const active = encounters.filter((e) => e.status !== "discharged");
      const critical = active.filter((e) => e.news2 >= 5);
      
      if (critical.length > 0) {
        return [
          "Why is this patient critical?",
          "What factors are increasing the NEWS-2 score?",
          "What actions should I consider next?"
        ];
      }
    }
    
    if (currentPage === "Home Dashboard") {
      return [
        "Help me in understanding whats on the Screen",
        "What is New Encounter?",
        "What is Patient Tracker?"
      ];
    } else if (currentPage === "Encounter Workspace") {
      return [
        "What should I document first in this encounter?",
        "How do I record vitals?",
        "What does the NEWS-2 score mean?"
      ];
    }
    // Default questions for other pages
    return [
      "Help me in understanding whats on the Screen"
    ];
  }, [currentPage, encounters]);

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    // Focus the input after a brief delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Get contextual popup message based on current page
  const contextualPopupMessage = useMemo(() => {
    if (currentPage === "Home Dashboard") {
      return "Need help getting started?";
    } else if (currentPage === "Encounter Workspace") {
      return "Need help in documenting Encounter?";
    }
    return null; // No popup for other pages
  }, [currentPage]);

  // Monitor user inactivity - show help bubble or critical alert after 5 seconds of no activity
  useInactivityMonitor({
    timeout: 5000, // 5 seconds
    onInactive: () => {
      console.log("User inactive - checking for alerts");
      
      if (isOpen) return; // Don't show if chatbot is already open
      
      // Priority 1: Check for critical patients on Patient Tracker
      if (currentPage === "Patient Tracker (Census)") {
        const active = encounters.filter((e) => e.status !== "discharged");
        const critical = active.filter((e) => e.news2 >= 5);
        
        if (critical.length > 0) {
          // Update critical patients list and show alert
          const criticalList = critical.map((encounter) => {
            const patient = patients.find((p) => p.id === encounter.patientId);
            return {
              encounterId: encounter.id,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
              news2: encounter.news2,
            };
          });
          
setCriticalPatientsDetected(criticalList);
          if (criticalAlertShownAt == null) setCriticalAlertShownAt(Date.now());
          setShowCriticalAlert(true);
          return; // Don't show help bubble if critical alert is shown
        }
      }

      // Priority 2: Show contextual help bubble for other pages
      if (contextualPopupMessage && !showCriticalAlert) {
        setShowHelpBubble(true);
      }
    },
    // Monitor when chatbot is closed
    enabled: !isOpen,
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
    // Build current state context
    let stateContext = `CURRENT USER CONTEXT:
- Current Page: ${currentPage}
${currentModal ? `- Current Modal/View: ${currentModal}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}`;

    // Add active encounter/patient context if in Encounter Workspace
    if (activeContext.encounter && activeContext.patient) {
      const encounter = activeContext.encounter;
      const patient = activeContext.patient;
      const minutesWaiting = Math.floor(
        (Date.now() - new Date(encounter.arrivalTime).getTime()) / 60000
      );
      const latestVitals = encounter.vitals.length > 0 
        ? encounter.vitals[encounter.vitals.length - 1] 
        : null;

      stateContext += `

ACTIVE ENCOUNTER STATE:
- Patient: ${patient.firstName} ${patient.lastName} (${patient.dodId})
- Age: ${patient.age}, Sex: ${patient.sex}
- Encounter Type: ${encounter.encounterType}
- Status: ${encounter.status}
- Location: ${encounter.location}
- Presenting Problem: ${encounter.presentingProblem || "Not specified"}
- NEWS-2 Score: ${encounter.news2} ${encounter.news2 >= 5 ? "(CRITICAL)" : encounter.news2 >= 3 ? "(Medium Risk)" : "(Low Risk)"}
- Arrival Time: ${new Date(encounter.arrivalTime).toLocaleString()} (${minutesWaiting} minutes ago)
- Wait Time: ${minutesWaiting} minutes
- Vitals Recorded: ${encounter.vitals.length} time(s)
${latestVitals ? `- Latest Vitals: HR: ${latestVitals.hr || "N/A"}, BP: ${latestVitals.bpSystolic || "N/A"}/${latestVitals.bpDiastolic || "N/A"}, SpO₂: ${latestVitals.spo2 || "N/A"}, Temp: ${latestVitals.temperature || "N/A"}°C, Pain: ${latestVitals.painScore || "N/A"}` : "- No vitals recorded yet"}
- Allergies: ${patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(", ") : "No known allergies"}
- Conditions: ${patient.conditions && patient.conditions.length > 0 ? patient.conditions.join(", ") : "None"}
- Medications: ${patient.medications && patient.medications.length > 0 ? patient.medications.join(", ") : "None"}
- Blood Type: ${patient.bloodType || "Not specified"}
- Care Team: ${encounter.careTeam.length} member(s) ${encounter.careTeam.includes(currentUser.id) ? "(User is following)" : ""}
- Disposition: ${encounter.disposition || "Pending"}`;
    }

    // Add Patient Tracker summary if on that page
    if (activeEncountersSummary) {
      stateContext += `

PATIENT TRACKER STATE:
- Total Active Patients: ${activeEncountersSummary.total}
- Critical Patients (NEWS-2 >= 5): ${activeEncountersSummary.critical}
- Medium Risk Patients (NEWS-2 3-4): ${activeEncountersSummary.mediumRisk}
- Patients User is Following: ${activeEncountersSummary.followed}`;
    }

    let prompt = `You are a helpful medical assistant for the CDP (Care Delivery Platform) system. Your role is to guide users through the platform and help them understand how to use it effectively.

KNOWLEDGE BASE:
${knowledgeBase || "Knowledge base is loading..."}

${stateContext}

INSTRUCTIONS:
1. Use the knowledge base above to answer questions about the CDP platform.
2. Consider the user's current location (page and modal) when providing help.
3. If there is ACTIVE ENCOUNTER STATE, you can reference specific patient details, vitals, NEWS-2 scores, and encounter information to provide contextual help.
4. If there is PATIENT TRACKER STATE, you can reference the census summary and help users understand what they're seeing.
5. If the user asks about what they're seeing or what to do next, reference their current context and state.
6. Be clear, concise, and professional.
7. ⚠️ CRITICAL GUARDRAIL: Do NOT provide medical advice, clinical decisions, or direct medical orders. You are explaining how to use the platform, NOT providing clinical guidance.
8. When discussing patient data, vitals, or NEWS-2 scores:
   - You can EXPLAIN what they mean (e.g., "A NEWS-2 score of 6 indicates critical status")
   - You can DESCRIBE what the platform shows (e.g., "The system displays this patient as critical")
   - You CANNOT make clinical recommendations or orders
   - Use instructional, non-prescriptive language:
     * ✅ CORRECT: "Recommended reassessment may be needed"
     * ✅ CORRECT: "This score typically indicates that reassessment might be considered"
     * ✅ CORRECT: "The platform shows this patient has a critical NEWS-2 score"
     * ❌ WRONG: "You should reassess this patient immediately"
     * ❌ WRONG: "This patient needs urgent care"
     * ❌ WRONG: "Order labs for this patient"
9. If the user is stuck in a modal or on a page, provide specific guidance based on their current location.
10. When describing Home or dashboard options, present all options as equal choices. Do NOT split them into "main" vs "limited" or "read-only" or "demo" — treat every option as a normal, primary option.
11. Always remember: You are a platform guide, not a clinical advisor. Keep responses instructional and focused on how to use the website.

FORMATTING (use Markdown so the UI can display it clearly):
- Use **bold** for important terms, button names, and section names.
- For lists of options or items, use bullet points with a dash and space: "- Item one"
- For step-by-step instructions, use numbered lists: "1. First step" then "2. Second step" on new lines.
- Keep paragraphs short (2–3 sentences). Add a blank line between paragraphs.
- Use headings only when splitting a long answer: "### Section title" for a new section.

When answering, always consider where the user currently is in the application, what data they're viewing, and tailor your response accordingly.`;

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
            // Include last 10 messages for context (excluding the new user message and initial hello message)
            ...messages
              .filter((msg) => !msg.isInitialMessage) // Exclude the hardcoded hello message
              .slice(-10)
              .map((msg) => ({
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
        isInitialMessage: false, // AI-generated messages are not initial
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
        isInitialMessage: false, // Error messages are not initial
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

  const handleOpenChatbot = (source: "button" | "help_bubble" = "button") => {
    console.log("Opening chatbot");
    eventTracker.track("chatbot_opened", { source });
    setIsOpen(true);
    setIsMinimized(false);
    setShowHelpBubble(false); // Hide bubble when chatbot opens
  };

  // Handle critical alert click - open chatbot and auto-query AI
  const handleCriticalAlertClick = async () => {
    const responseTimeMs = criticalAlertShownAt != null ? Date.now() - criticalAlertShownAt : undefined;
    setShowCriticalAlert(false);
    setCriticalAlertShownAt(null);
    eventTracker.track("alert_viewed", {});
    eventTracker.track("alert_action_taken", {
      action: "open_chatbot",
      ...(responseTimeMs != null && { response_time_ms: responseTimeMs }),
    });
    eventTracker.track("chatbot_opened", { source: "critical_alert" });
    setIsOpen(true);
    setIsMinimized(false);
    
    // Simple query without patient data - AI will get it from context
    const autoQuery = "List the critical patients and provide a brief summary of actions to consider.";
    
    // Set the query and trigger send
    setInputValue(autoQuery);
    
    // Wait a moment for UI to update, then send
    setTimeout(() => {
      // Use the existing handleSendMessage logic
      const userMessage: Message = {
        id: Date.now().toString(),
        text: autoQuery.trim(),
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      if (!apiKey) {
        setIsLoading(false);
        return;
      }

      const systemPrompt = buildSystemPrompt();

      fetch("https://api.deepseek.com/v1/chat/completions", {
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
            ...messages
              .filter((msg) => !msg.isInitialMessage)
              .slice(-10)
              .map((msg) => ({
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
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          const rawContent = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: rawContent.trim(),
            sender: "assistant",
            timestamp: new Date(),
            isInitialMessage: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        })
        .catch((error) => {
          console.error("Chatbot error:", error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
            sender: "assistant",
            timestamp: new Date(),
            isInitialMessage: false,
          };
          setMessages((prev) => [...prev, errorMessage]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300);
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
      {/* Critical Alert Popup - Priority interrupt, shows immediately when critical patients detected */}
      {/* Positioned on left side, centered, pointing to AskAI icon */}
      {showCriticalAlert && !isOpen && criticalPatientsDetected.length > 0 && (
        <div className="fixed bottom-6 right-32 z-[100] flex items-center animate-in fade-in-0 zoom-in-95 duration-300" style={{ height: '80px' }}>
          <button
            onClick={handleCriticalAlertClick}
            className="group relative flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 shadow-lg hover:bg-red-700 transition-all animate-bubble-gentle"
            aria-label="Critical patient alert"
          >
            <span className="text-sm font-bold text-white whitespace-nowrap animate-subtle-glow">
              🚨 Critical Patient Detected
            </span>
            {/* Speech bubble tail pointing right - centered vertically to align with icon center */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-red-600 group-hover:border-l-red-700"></div>
            </div>
          </button>
        </div>
      )}

      {/* Help Bubble - Appears to the left of chatbot icon when user is inactive */}
      {showHelpBubble && !isOpen && contextualPopupMessage && !showCriticalAlert && (
        <div className="fixed bottom-6 right-32 z-50 flex items-center animate-in fade-in-0 zoom-in-95 duration-300" style={{ height: '80px' }}>
          <button
            onClick={() => handleOpenChatbot("help_bubble")}
            className="group relative flex items-center gap-3 rounded-lg bg-primary px-4 py-3 shadow-lg hover:bg-primary/90 transition-all animate-bubble-gentle"
            aria-label="Need help? Open chatbot"
          >
            <span className="text-sm font-bold text-white whitespace-nowrap animate-subtle-glow">
              {contextualPopupMessage}
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
          onClick={() => handleOpenChatbot("button")}
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
                onClick={() => {
                  eventTracker.track(isMinimized ? "chatbot_expanded" : "chatbot_minimized", {});
                  setIsMinimized(!isMinimized);
                }}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="h-4 w-4 text-white/70" />
              </button>
              <button
                onClick={() => {
                  eventTracker.track("chatbot_closed", {});
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
                          {/* Video player for detailed explanation - only show for AI-generated messages, not the initial hello */}
                          {!message.isInitialMessage && (
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
                          )}
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
                {/* Suggested questions – hidden when AI is answering */}
                {!isLoading && (
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
                )}
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
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#2563EB] text-sm font-semibold"
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
