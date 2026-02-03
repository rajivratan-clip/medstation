import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type PageContextType = {
  currentPage: string;
  currentModal: string | null;
  setCurrentModal: (modal: string | null) => void;
  additionalContext?: string;
  setAdditionalContext: (context: string | undefined) => void;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageContextProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [currentModal, setCurrentModal] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState<string | undefined>();

  // Map routes to readable page names
  const getPageName = (pathname: string): string => {
    if (pathname === "/") return "Login Page";
    if (pathname === "/home") return "Home Dashboard";
    if (pathname === "/new-encounter") return "Encounter Workspace";
    if (pathname === "/patient-tracker") return "Patient Tracker (Census)";
    if (pathname === "/quick-overview") return "Quick Overview";
    return pathname;
  };

  const currentPage = getPageName(location.pathname);

  return (
    <PageContext.Provider
      value={{
        currentPage,
        currentModal,
        setCurrentModal,
        additionalContext,
        setAdditionalContext,
      }}
    >
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within PageContextProvider");
  }
  return context;
};
