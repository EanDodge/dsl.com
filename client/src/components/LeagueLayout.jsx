import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function LeagueLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto md:ml-60 mb-16 md:mb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
