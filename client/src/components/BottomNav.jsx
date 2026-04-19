import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function BottomNav() {
  const { leagueId } = useParams();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    if (!leagueId) return;

    const fetchLeague = async () => {
      try {
        const leagueDoc = await getDoc(doc(db, "leagues", leagueId));
        if (leagueDoc.exists()) {
          const leagueData = leagueDoc.data();
          setIsCommissioner(leagueData.commissionerId === currentUser?.uid);
        }
      } catch (error) {
        console.error("Error fetching league:", error);
      }
    };

    fetchLeague();
  }, [leagueId, currentUser]);

  const isActive = (path) => location.pathname.includes(path);

  const navItems = [
    { path: `/league/${leagueId}`, label: "Dashboard", icon: "🏠" },
    { path: `/league/${leagueId}/chat`, label: "Chat", icon: "💬" },
    { path: `/league/${leagueId}/profile`, label: "Profile", icon: "👤" },
  ];

  if (isCommissioner) {
    navItems.push({ path: `/league/${leagueId}/settings`, label: "Settings", icon: "⚙️" });
  }

  return (
    <nav className="fixed left-0 right-0 bg-white border-t border-gray-200 md:hidden flex items-center justify-around py-2" style={{ bottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
            isActive(item.path)
              ? "text-[#FF6B00]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
