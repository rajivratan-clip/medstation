import { createContext, useContext, useState, type ReactNode } from "react";

type UserContextType = {
  currentUser: { id: string; name: string };
  setCurrentUser: (user: { id: string; name: string }) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  // Default demo user - in real app, this would come from auth
  const [currentUser] = useState({ id: "user1", name: "Demo User" });

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: () => {} }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserContextProvider");
  }
  return context;
};
