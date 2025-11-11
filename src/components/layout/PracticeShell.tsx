import { ReactNode } from 'react';

interface PracticeShellProps {
  globalBar: ReactNode;
  utilityRail: ReactNode;
  primaryCanvas: ReactNode;
  transportDock?: ReactNode;
}

/**
 * Responsive layout shell that keeps Tone Path's controls discoverable
 * across desktop, tablet, and mobile breakpoints.
 */
export function PracticeShell({
  globalBar,
  utilityRail,
  primaryCanvas,
  transportDock,
}: PracticeShellProps) {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {globalBar}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 gap-6 py-6">
        <div className="flex-1 flex flex-col gap-4">{primaryCanvas}</div>
      </div>

      <footer className="border-t border-white/10 bg-slate-900/90 backdrop-blur sticky bottom-0 z-30 pb-safe-area">
        {transportDock && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">{transportDock}</div>
        )}
      </footer>
    </div>
  );
}
