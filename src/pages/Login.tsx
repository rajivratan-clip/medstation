import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Settings, Info } from "lucide-react";
import { eventTracker } from "@/analytics/eventTracker";
import logoFrontPage from "../../logofrontpage.png";
import frontText from "../../fronttext.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    eventTracker.setContext(username, "Login Page");
    eventTracker.track("session_started", {
      loginMethod: "manual",
      deviceType: "desktop",
    });
    navigate("/quick-overview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header icons */}
      <div className="flex justify-between p-4">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <Info className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={logoFrontPage}
              alt="CDP"
              className="w-[60px] h-[65px] object-contain"
                />
            <img
              src={frontText}
              alt="CDP"
              className="h-[52px] w-auto object-contain"
            />
          </div>
          <div className="text-center tracking-[0.25em] text-sm">
            <div className="text-accent font-bold">OPERATIONAL MEDICINE</div>
            <div className="text-muted-foreground text-xs font-semibold tracking-[0.2em]">CARE DELIVERY PLATFORM</div>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="cdp-input"
          />
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cdp-input pr-10"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button type="submit" className="cdp-btn-primary">
            Login
          </button>
        </form>

        {/* CAC PIN link */}
        <a href="#" className="mt-4 text-muted-foreground underline text-sm font-semibold hover:text-foreground">
          Login with CAC PIN
        </a>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center pb-4 px-4">
        <p className="text-xs font-semibold text-muted-foreground">
          FOR INFORMATIONAL PURPOSES ONLY AND NOT INTENDED FOR DIAGNOSTIC USE.
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          (c) 2026, T6 Health Systems.
        </p>
      </div>
    </div>
  );
};

export default Login;
