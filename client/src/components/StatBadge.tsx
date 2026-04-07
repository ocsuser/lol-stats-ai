interface StatBadgeProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'default';
}

const colorMap = {
  blue: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  purple: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  yellow: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  red: 'text-red-400 bg-red-400/10 border-red-400/20',
  default: 'text-slate-300 bg-slate-700/50 border-slate-600',
};

export default function StatBadge({ label, value, color = 'default' }: StatBadgeProps) {
  return (
    <div className={`inline-flex flex-col items-center px-4 py-2.5 rounded-lg border ${colorMap[color]}`}>
      <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-lg font-bold mt-0.5">{value}</span>
    </div>
  );
}
