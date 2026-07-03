import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "neutral" | "buy" | "tertiary" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-white",
  neutral: "bg-white text-ink",
  buy: "bg-buy text-ink",
  tertiary: "bg-tertiary text-ink",
  danger: "bg-tier-terrible text-white",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2",
  lg: "px-4 py-3",
  xl: "px-8 py-4 text-2xl",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconFill?: boolean;
  children?: ReactNode;
}

export function ArcadeButton({
  variant = "neutral",
  size = "md",
  icon,
  iconFill,
  children,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      type={type}
      className={`arcade-btn inline-flex items-center justify-center gap-2 uppercase tracking-wide ${SIZE[size]} ${VARIANT[variant]} ${className}`}
    >
      {icon && <Icon name={icon} fill={iconFill} />}
      {children}
    </button>
  );
}
