import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { eventTracker } from "./eventTracker";

const pathToPage: Record<string, string> = {
  "/": "Login Page",
  "/home": "Home Dashboard",
  "/new-encounter": "Encounter Workspace",
  "/patient-tracker": "Patient Tracker (Census)",
  "/quick-overview": "Quick Overview",
};

const PAGE_VIEW_DEBOUNCE_MS = 800;

export function AnalyticsSync() {
  const { currentUser } = useUser();
  const location = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    const page = pathToPage[location.pathname] ?? location.pathname;
    eventTracker.setContext(currentUser.id, page);

    if (location.pathname === lastPathRef.current) return;
    lastPathRef.current = location.pathname;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      eventTracker.track("page_viewed", { pathname: location.pathname, page });
      debounceRef.current = null;
    }, PAGE_VIEW_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentUser.id, location.pathname]);

  useEffect(() => {
    const onUnload = () => {
      eventTracker.track("session_ended", {});
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return null;
}
