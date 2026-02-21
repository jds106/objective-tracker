import { PlusIcon } from '@heroicons/react/24/outline';

interface CreateObjectiveButtonProps {
  onClick: () => void;
}

export function CreateObjectiveButton({ onClick }: CreateObjectiveButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 p-6 hover:border-indigo-500 hover:bg-indigo-500/5 transition-colors min-h-[140px]"
    >
      <PlusIcon className="h-8 w-8 text-slate-500" />
      <span className="mt-2 text-sm font-medium text-slate-400">
        Create Objective
      </span>
    </button>
  );
}
