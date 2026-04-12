import { Link } from "react-router-dom";

export default function EmptyState({ icon, heading, description, actionBar, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{heading}</h2>
      {description && <p className="text-gray-500 mb-6 text-center max-w-md">{description}</p>}
      {actionBar && <div className="flex gap-4">{actionBar}</div>}
    </div>
  );
}
