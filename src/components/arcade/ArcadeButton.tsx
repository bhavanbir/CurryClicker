import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "neutral" | "buy" | "tertiary";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-white",
  neutral: "bg-white text-ink",
  buy: "bg-buy text-ink",
  tertiary: "bg-tertiary text-ink",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  iconFill?: boolean;
  children?: ReactNode;
}

export function ArcadeButton({
  variant = "neutral",
  icon,
  iconFill,
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`arcade-btn inline-flex items-center justify-center gap-2 px-4 py-2 uppercase tracking-wide ${VARIANT[variant]} ${className}`}
    >
      {icon && <Icon name={icon} fill={iconFill} />}
      {children}
    </button>
  );
}
