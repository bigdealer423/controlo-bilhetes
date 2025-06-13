export function Button({ children, onClick, variant = "default", size = "md", className = "" }) {
  const base = "rounded px-3 py-1 font-semibold border";
  const variants = {
    default: "bg-blue-500 text-white border-blue-500 hover:bg-blue-600",
    outline: "bg-transparent text-blue-500 border-blue-500 hover:bg-blue-50",
  };
  const sizes = {
    sm: "text-sm",
    md: "text-base",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}