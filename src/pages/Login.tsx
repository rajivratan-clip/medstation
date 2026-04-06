import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Stethoscope } from "lucide-react";
import { eventTracker } from "@/analytics/eventTracker";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    eventTracker.setContext(username, "Sign in");
    eventTracker.track("session_started", {
      loginMethod: "manual",
      deviceType: "desktop",
    });
    navigate("/quick-overview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="lg:w-[42%] border-b lg:border-b-0 lg:border-r border-border bg-muted/30 px-8 py-12 lg:py-16 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.35)]"
              aria-hidden
            >
              <Stethoscope className="h-9 w-9 text-primary" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="font-brand text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[0.95]">
                CDP
              </p>
            </div>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Clinical workspace</p>
          <h1 className="mt-2 text-xl font-semibold text-foreground tracking-tight leading-snug max-w-sm">
            Electronic health record — demo
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
            Sign in to open the training environment. This build uses a distinct layout for evaluation only.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-8 lg:mt-0">
          For informational purposes only. Not for diagnostic use.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 max-w-md w-full mx-auto">
        <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">Use your demo credentials</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cdp-input mt-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative mt-1.5">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cdp-input pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <button type="submit" className="cdp-btn-primary">
            Continue
          </button>
        </form>

        <a href="#" className="mt-6 text-xs font-medium text-muted-foreground underline hover:text-foreground">
          Login with CAC PIN
        </a>

        <p className="mt-10 text-[10px] text-muted-foreground">(c) 2026 — Demo UI for training and evaluation only.</p>
      </div>
    </div>
  );
};

export default Login;
