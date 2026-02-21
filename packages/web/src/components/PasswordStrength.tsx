import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

type Strength = 'weak' | 'fair' | 'strong' | 'very_strong';

interface StrengthResult {
  level: Strength;
  label: string;
  score: number; // 0-4
  hints: string[];
}

function calculateStrength(password: string): StrengthResult {
  const hints: string[] = [];
  let score = 0;

  if (password.length === 0) {
    return { level: 'weak', label: 'Too short', score: 0, hints: ['Enter at least 8 characters'] };
  }

  if (password.length < 8) {
    return { level: 'weak', label: 'Too short', score: 0, hints: [`${8 - password.length} more character${8 - password.length !== 1 ? 's' : ''} needed`] };
  }

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower && hasUpper) score += 1;
  if (hasDigit) score += 0.5;
  if (hasSpecial) score += 0.5;

  // Generate hints for improvement
  if (!hasUpper && !hasLower) hints.push('Add some letters');
  else if (!hasUpper) hints.push('Add an uppercase letter');
  else if (!hasLower) hints.push('Add a lowercase letter');

  if (!hasDigit) hints.push('Add a number');
  if (!hasSpecial) hints.push('Add a special character');
  if (password.length < 12) hints.push('Use 12+ characters for better security');

  const roundedScore = Math.min(4, Math.round(score));

  if (roundedScore <= 1) return { level: 'weak', label: 'Weak', score: roundedScore, hints };
  if (roundedScore === 2) return { level: 'fair', label: 'Fair', score: roundedScore, hints };
  if (roundedScore === 3) return { level: 'strong', label: 'Strong', score: roundedScore, hints };
  return { level: 'very_strong', label: 'Very strong', score: roundedScore, hints: [] };
}

const strengthColours: Record<Strength, { bar: string; text: string }> = {
  weak: { bar: 'bg-red-500', text: 'text-red-400' },
  fair: { bar: 'bg-amber-500', text: 'text-amber-400' },
  strong: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
  very_strong: { bar: 'bg-emerald-400', text: 'text-emerald-300' },
};

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const result = useMemo(() => calculateStrength(password), [password]);

  if (password.length === 0) return null;

  const { bar, text } = strengthColours[result.level];
  const widthPercent = (result.score / 4) * 100;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className={`text-[10px] font-medium ${text} min-w-[60px] text-right`}>
          {result.label}
        </span>
      </div>

      {/* Hints */}
      {result.hints.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {result.hints.slice(0, 2).map(hint => (
            <span key={hint} className="text-[10px] text-slate-500">
              {hint}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
