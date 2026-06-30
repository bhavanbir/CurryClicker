import { Icon } from "./Icon";

interface Props {
  icon?: string;
  label: string;
  value: string;
  className?: string;
}

// Small bordered stat/value chip (e.g. curry balance, day counter).
export function StatChip({ icon, label, value, className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 border-2 border-ink bg-white px-3 py-1.5 rounded-lg shadow-arcade-sm ${className}`}
    >
      {icon && <Icon name={icon} className="text-primary" fill size={20} />}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
          {label}
        </span>
        <span className="font-display text-base font-extrabold tabular-nums text-ink">
          {value}
        </span>
      </div>
    </div>
  );
}
