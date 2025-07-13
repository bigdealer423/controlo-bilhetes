export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl shadow p-4 bg-white dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return (
    <div className={`p-2 ${className}`}>
      {children}
    </div>
  );
}
