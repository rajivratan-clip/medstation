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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div
        className="lg:w-1/2 min-h-[40vh] lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border"
        style={{
          backgroundImage: `linear-gradient(to bottom, hsl(var(--background) / 0.7), hsl(var(--background) / 0.92)), url(${quickOverviewBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-14 max-w-xl mx-auto w-full">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Onboarding</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">Getting started</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Welcome to MedStation. This short tour introduces the main areas of the application — clinical hub, visits,
          and unit census.
        </p>
        <div className="mt-8 h-1 w-full max-w-xs bg-muted rounded overflow-hidden">
          <div className="h-full w-1/4 bg-primary/60 rounded" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Step 1 of 4 (demo)</p>
        <div className="mt-10 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50"
            aria-hidden
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50"
            aria-hidden
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleClose}
          className="mt-10 inline-flex items-center gap-2 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <X className="w-4 h-4" />
          Enter workspace
        </button>
      </div>
    </div>
  );
};

export default QuickOverview;
