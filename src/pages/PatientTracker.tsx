import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientTracker = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground px-10 pt-8 pb-10 flex flex-col">
      {/* Top header row */}
      <div className="flex items-start justify-between gap-8">
        {/* Left: icon + title + back */}
        <div>
          <div className="flex items-center gap-4">
            {/* Home Logo - Clickable */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-transparent hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src="/homelogo.png" alt="Home" className="w-full h-full object-contain p-2" />
            </button>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">Census</span>
              <span className="mt-1 text-sm uppercase tracking-[0.25em] text-white/60">
                TOTAL PTS = 3
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-full border border-white/25 px-5 py-2 text-sm font-bold text-white/80 hover:bg-white/10"
          >
            Back to Patient
          </button>
        </div>

        {/* Right: search + actions */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="relative w-[520px] max-w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-full bg-white/10 py-3 pl-12 pr-4 text-base text-white placeholder:text-white/50 outline-none ring-0"
            />
          </div>

          <button
            type="button"
            className="h-11 rounded-full border border-white/30 px-5 text-sm font-bold text-white/85 hover:bg-white/10"
          >
            Refresh
          </button>
          <button
            type="button"
            className="h-11 rounded-full border border-[#1f6fff] px-5 text-sm font-bold text-[#5ea2ff] hover:bg-[#1f6fff1a]"
          >
            Show My Patients
          </button>
          <button
            type="button"
            className="h-11 rounded-full border border-white/30 px-5 text-sm font-bold text-white/85 hover:bg-white/10"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Table area */}
      <div className="mt-7 flex-1 rounded-md bg-black/5 overflow-hidden flex flex-col">
        {/* Header row */}
        <div className="grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center rounded-t-md bg-[#272b3a] px-6 py-4 text-sm font-bold text-white/70">
          {[
            "Location",
            "Name",
            "Age",
            "Time",
            "Presenting problem",
            "NEWS-2",
            "Indicators",
            "Follow",
            "Disposition",
          ].map((label) => (
            <div key={label} className="flex items-center gap-1">
              <span>{label}</span>
              <span className="text-[#4ea2ff]">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 4h8L6 9 2 4Z" fill="currentColor" />
                </svg>
              </span>
            </div>
          ))}
        </div>

        {/* Location: not specified */}
        <div className="bg-[#3a3f4f] px-6 py-3 text-sm font-bold text-white/80 whitespace-nowrap">
          Location not specified
        </div>

        {/* Patient rows - group 1 */}
        <div className="divide-y divide-white/10 bg-[#2f3443] flex-1 overflow-y-auto">
          {/* Row 1 */}
          <div className="grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center px-6 py-4 hover:bg-white/5">
            <div className="text-sm font-semibold text-white/70 whitespace-nowrap">Location not specified</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">
                LASTNAME
              </span>
              <span className="text-sm font-semibold text-white/70">firstname</span>
            </div>
            <div className="text-sm font-semibold text-white/80">28 F</div>
            <div className="text-sm font-semibold text-white/80">14h:11m</div>
            <div className="text-sm font-semibold text-white/85">Chest pain</div>
            <div className="text-sm font-semibold text-white/85">2</div>
            <div className="text-sm font-semibold text-white/60">—</div>
            <div className="flex justify-center">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 text-base text-white/85 hover:bg-white/15"
              >
                +
              </button>
            </div>
            <div className="text-sm font-semibold text-white/85">***</div>
          </div>

          {/* Row 2 - secure */}
          <div className="grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center px-6 py-4 hover:bg-white/5">
            <div className="text-sm text-white/70 whitespace-nowrap">Location not specified</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">
                SECURE
              </span>
              <span className="text-sm text-white/70">Chart</span>
            </div>
            <div className="text-sm text-white/80">**</div>
            <div className="text-sm text-white/80">*****</div>
            <div className="text-sm text-white/85">****** ******</div>
            <div className="text-sm text-white/85">—</div>
            <div className="text-sm text-white/60">—</div>
            <div className="flex justify-center">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 text-base text-white/85 hover:bg-white/15"
              >
                +
              </button>
            </div>
            <div className="text-sm font-semibold text-white/85">***</div>
          </div>
        </div>

        {/* Location: Clinic */}
        <div className="mt-px bg-[#3a3f4f] px-6 py-3 text-sm font-medium text-white/80 whitespace-nowrap">
          Clinic
        </div>

        {/* Patient rows - group 2 */}
        <div className="bg-[#2f3443]">
          <div className="grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center px-6 py-4 hover:bg-white/5">
            <div className="text-sm font-semibold text-white/70 whitespace-nowrap">Clinic</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">
                ZZZZZZ
              </span>
              <span className="text-sm font-semibold text-white/70">zzzz</span>
            </div>
            <div className="text-sm font-semibold text-white/80">26 M</div>
            <div className="text-sm font-semibold text-white/80">00h:39m</div>
            <div className="text-sm font-semibold text-white/85">Medical screening</div>
            <div className="text-sm font-semibold text-white/85">0</div>
            <div className="text-sm font-semibold text-white/60">—</div>
            <div className="flex justify-center">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 text-base text-white/85 hover:bg-white/15"
              >
                +
              </button>
            </div>
            <div className="text-sm font-semibold text-white/85">***</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTracker;
