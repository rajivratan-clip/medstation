import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import quickOverviewBg from "@/assets/quick-overview-bg.png";
import { eventTracker } from "@/analytics/eventTracker";

const QuickOverview = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    eventTracker.track("modal_closed", { modal: "quick_overview" });
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Heading above the image box */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6 w-full max-w-4xl">
        Quick Start Guide
      </h1>

      {/* Modal container (image box) */}
      <div 
        className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
        style={{
          backgroundImage: `url(${quickOverviewBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <X className="w-4 h-4" />
          Close
        </button>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed max-w-2xl">
            Welcome to CDP. Follow this quick start guide to learn key features and functions within the application.
          </h2>
        </div>

        {/* Navigation arrows */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4">
          <ChevronLeft className="w-6 h-6 text-foreground/70 cursor-pointer hover:text-foreground" />
          <ChevronRight className="w-6 h-6 text-foreground cursor-pointer hover:text-foreground/70" />
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickOverview;
