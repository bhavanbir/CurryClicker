import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function PageHeader({ title, subtitle, leading, trailing }: Props) {
  return (
    <header className="flex items-start gap-3">
      <div className="flex flex-1 justify-start">{leading}</div>
      <div className="min-w-0 text-center">
        <h1 className="font-display text-3xl font-black uppercase text-ink text-stroke-ink md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-ink/55">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-1 justify-end">{trailing}</div>
    </header>
  );
}
