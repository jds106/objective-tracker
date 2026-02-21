interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const btnClass = 'w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-700/80 transition-all duration-150';

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col overflow-hidden rounded-xl bg-surface-raised/80 backdrop-blur-sm border border-slate-700/80 shadow-lg">
      <button onClick={onZoomIn} className={btnClass} aria-label="Zoom in" title="Zoom in">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <div className="border-t border-slate-700/60" />
      <button onClick={onZoomOut} className={btnClass} aria-label="Zoom out" title="Zoom out">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </button>
      <div className="border-t border-slate-700/60" />
      <button onClick={onReset} className={btnClass} aria-label="Reset view" title="Reset view">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      </button>
    </div>
  );
}
