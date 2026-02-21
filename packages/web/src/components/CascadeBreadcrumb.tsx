import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Objective } from '@objective-tracker/shared';

interface CascadeBreadcrumbProps {
  path: Objective[];
  className?: string;
}

export function CascadeBreadcrumb({ path, className = '' }: CascadeBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav className={`flex items-center gap-1 text-sm ${className}`} aria-label="Cascade breadcrumb">
      {path.map((obj, i) => (
        <span key={obj.id} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRightIcon className="h-4 w-4 text-slate-500" />
          )}
          {i < path.length - 1 ? (
            <Link
              to={`/objectives/${obj.id}`}
              className="text-slate-400 hover:text-indigo-400 transition-colors truncate max-w-[200px]"
            >
              {obj.title}
            </Link>
          ) : (
            <span className="text-slate-200 font-medium truncate max-w-[200px]">
              {obj.title}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
