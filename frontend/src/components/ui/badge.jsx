export function Badge({ children, variant = "default", className = "" }) {
  const base = "inline-block px-2 py-1 rounded text-sm font-medium";
  const style = variant === "default"
    ? "bg-green-100 text-green-800"
    : "bg-gray-200 text-gray-800";

  return <span className={`${base} ${style} ${className}`}>{children}</span>;
}