import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Sidebar() {
  const { leagueId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const [league, setLeague] = useState(null);
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    if (!leagueId) return;

    const fetchLeague = async () => {
      try {
        const leagueDoc = await getDoc(doc(db, "leagues", leagueId));
        if (leagueDoc.exists()) {
          const leagueData = leagueDoc.data();
          setLeague(leagueData);
          setIsCommissioner(leagueData.commissionerId === currentUser?.uid);
        }
      } catch (error) {
        console.error("Error fetching league:", error);
      }
    };

    fetchLeague();
  }, [leagueId, currentUser]);

  const isActive = (path) => {
    if (path === `/league/${leagueId}`) {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  const navItems = [
    { path: `/league/${leagueId}`, label: "Dashboard", icon: "🏠" },
    { path: `/league/${leagueId}/chat`, label: "Chat", icon: "💬" },
    { path: `/league/${leagueId}/profile`, label: "My Profile", icon: "👤" },
    { path: `/league/${leagueId}/roster`, label: "Roster", icon: "👥" },
  ];

  if (isCommissioner) {
    navItems.push({ path: `/league/${leagueId}/settings`, label: "Settings", icon: "⚙️" });
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-gray-200 overflow-y-auto hidden md:flex flex-col p-4">
      {league && (
        <>
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 truncate">{league.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{league.sport}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive(item.path)
                    ? "text-white border-l-4 border-[#FF6B00]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                style={isActive(item.path) ? { backgroundColor: "rgba(255, 107, 0, 0.1)" } : {}}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {userProfile && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#FF6B00" }}>
                {userProfile.displayName?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">{userProfile.displayName}</span>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

