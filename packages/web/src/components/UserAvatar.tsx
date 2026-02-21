interface UserAvatarProps {
  user: { displayName: string; avatarUrl?: string | null; role?: string };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-xl',
};

const colourPalette = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600',
  'bg-cyan-600', 'bg-violet-600', 'bg-pink-600', 'bg-teal-600',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colourPalette[Math.abs(hash) % colourPalette.length];
}

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-10 w-10',
};

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = sizeMap[size];

  if (user.role === 'admin' && !user.avatarUrl) {
    return (
      <div
        className={`${sizeClass} bg-red-600 rounded-full flex items-center justify-center shrink-0 ${className}`}
        aria-label={`${user.displayName} (admin)`}
      >
        <svg className={`${iconSizeMap[size]} text-white`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
    );
  }

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        loading="lazy"
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${getColour(user.displayName)} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      aria-label={user.displayName}
    >
      {getInitials(user.displayName)}
    </div>
  );
}
