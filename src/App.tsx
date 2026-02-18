import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageContextProvider } from "./contexts/PageContext";
import { UserContextProvider } from "./contexts/UserContext";
import { PatientStoreProvider } from "./store/patientStore";
import Login from "./pages/Login";
import QuickOverview from "./pages/QuickOverview";
import Home from "./pages/Home";
import NewEncounter from "./pages/NewEncounter";
import PatientTracker from "./pages/PatientTracker";
import NotFound from "./pages/NotFound";
import ChatbotAssistant from "./components/ChatbotAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageContextProvider>
          <UserContextProvider>
            <PatientStoreProvider>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/quick-overview" element={<QuickOverview />} />
                <Route path="/home" element={<Home />} />
                <Route path="/new-encounter" element={<NewEncounter />} />
                <Route path="/patient-tracker" element={<PatientTracker />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Persistent Chatbot Assistant */}
              <ChatbotAssistant />
            </PatientStoreProvider>
          </UserContextProvider>
        </PageContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
