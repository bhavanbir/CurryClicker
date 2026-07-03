import type { ElementType, HTMLAttributes, ReactNode } from "react";

const SHADOW = {
  sm: "shadow-arcade-sm",
  md: "shadow-arcade",
} as const;

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  shadow?: keyof typeof SHADOW;
  children?: ReactNode;
}

// Static bordered panel with the hard offset arcade shadow.
export function ArcadePanel({
  as: Tag = "div",
  shadow,
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <Tag
      {...rest}
      className={`arcade-box ${shadow ? SHADOW[shadow] : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
