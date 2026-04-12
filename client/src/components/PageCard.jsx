export default function PageCard({
  children,
  accentColor = "orange",
  className = "",
  ...props
}) {
  const borderColorClass = accentColor === "orange"
    ? "border-l-[#FF6B00]"
    : "border-l-[#008E97]";

  return (
    <div
      className={`border-l-4 ${borderColorClass} bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

