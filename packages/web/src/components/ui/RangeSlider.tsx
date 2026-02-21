import { useRef, useCallback, useEffect, useState } from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  id,
  'aria-label': ariaLabel,
  className = '',
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onChange(clamped);
    },
    [min, max, step, onChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      updateValue(e.clientX);
    },
    [updateValue],
  );

  useEffect(() => {
    if (!dragging) return;

    function handleMouseMove(e: MouseEvent) {
      updateValue(e.clientX);
    }
    function handleMouseUp() {
      setDragging(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, updateValue]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = value;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(max, value + step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(min, value - step);
      else if (e.key === 'Home') next = min;
      else if (e.key === 'End') next = max;
      else return;
      e.preventDefault();
      onChange(next);
    },
    [value, min, max, step, onChange],
  );

  return (
    <div className={`relative ${className}`}>
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-2 rounded-full bg-slate-700 cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        {/* Filled track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-[width] duration-75"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <div
          role="slider"
          id={id}
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          onKeyDown={handleKeyDown}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-indigo-500 shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            dragging ? 'scale-110 shadow-lg shadow-indigo-500/30' : 'hover:shadow-lg hover:shadow-indigo-500/20'
          }`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
