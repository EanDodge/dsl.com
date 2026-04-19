import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function LeagueLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row safe-vh overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto md:ml-60"
        style={{
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
