import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function LeagueLayout({ children }) {
  const mainRef = useRef(null);
  const location = useLocation();

  // Scroll the league main area to top on route change to avoid landing mid-page
  useEffect(() => {
    const el = mainRef.current || document.scrollingElement || document.documentElement;
    try {
      if (el) el.scrollTo ? el.scrollTo({ top: 0, left: 0, behavior: 'auto' }) : (el.scrollTop = 0);
    } catch (e) {
      // ignore
    }
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main
        id="league-main"
        ref={mainRef}
        className="flex-1 overflow-y-auto md:ml-60 min-h-0"
        style={{
          height: 'calc(var(--vh, 1vh) * 100 - 5rem)',
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "calc(4rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
