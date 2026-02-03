import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Settings, Info } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
            {/* CDP Logo - Hexagon with asterisk */}
            <div className="relative">
              <svg width="60" height="65" viewBox="0 0 60 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hexagon background */}
                <path 
                  d="M30 2L55 17.5V48.5L30 64L5 48.5V17.5L30 2Z" 
                  fill="#3d4654" 
                  stroke="#5a6575" 
                  strokeWidth="2"
                />
                {/* Orange asterisk/star */}
                <text x="30" y="42" textAnchor="middle" fill="#e88a36" fontSize="32" fontWeight="bold">✱</text>
              </svg>
            </div>
            <span className="text-5xl font-bold text-foreground tracking-wide">CDP</span>
          </div>
          <div className="text-center tracking-[0.25em] text-sm">
            <div className="text-accent font-medium">OPERATIONAL MEDICINE</div>
            <div className="text-muted-foreground text-xs tracking-[0.2em]">CARE DELIVERY PLATFORM</div>
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
        <a href="#" className="mt-4 text-muted-foreground underline text-sm hover:text-foreground">
          Login with CAC PIN
        </a>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center pb-4 px-4">
        <p className="text-xs text-muted-foreground">
          FOR INFORMATIONAL PURPOSES ONLY AND NOT INTENDED FOR DIAGNOSTIC USE.
        </p>
        <p className="text-xs text-muted-foreground">
          (c) 2026, T6 Health Systems.
        </p>
      </div>
    </div>
  );
};

export default Login;
