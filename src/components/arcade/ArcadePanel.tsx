import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

// Static bordered panel with the hard offset arcade shadow.
export function ArcadePanel({ children, className = "", ...rest }: Props) {
  return (
    <div {...rest} className={`arcade-box ${className}`}>
      {children}
    </div>
  );
}
