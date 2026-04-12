import { Link } from "react-router-dom";

export default function StyledLink({ to, children, className = "", ...props }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
