interface IconProps {
  name: string; // Material Symbols ligature name, e.g. "local_fire_department"
  className?: string;
  fill?: boolean;
  size?: number; // px
}

// Material Symbols wrapper with fixed metrics (prevents layout jitter).
export function Icon({ name, className = "", fill = false, size }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${fill ? "fill" : ""} ${className}`}
      style={size ? { fontSize: size, width: size, height: size } : undefined}
    >
      {name}
    </span>
  );
}
