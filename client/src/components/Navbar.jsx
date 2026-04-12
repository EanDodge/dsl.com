import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth } from "../firebase"

export default function Navbar() {
    const { currentUser, userProfile } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            nav("/login");
        } catch (error) {
            console.log(error);
        }
    }

    const isCurrentPath = (path) => {
        if (path === "/league/create" || path === "/league/join") {
            return location.pathname.startsWith("/league/") && !location.pathname.includes("create") && !location.pathname.includes("join");
        }
        return location.pathname === path;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-full">
                {/* Logo and app name */}
                <Link to="/" className="flex items-center gap-3 hover:bg-transparent">
                    <img src="/icons/icon-192.png" alt="DSL" className="w-8 h-8" />
                    <span className="hidden sm:inline font-semibold text-gray-900">Dodge Sports League</span>
                </Link>

                {/* Desktop navigation */}
                <div className="hidden md:flex items-center gap-1">
                    <Link to="/about" className={`px-3 py-1.5 rounded-md transition-colors ${isCurrentPath("/about") ? "hidden" : "hover:bg-gray-100"}`}>
                        About
                    </Link>
                    <Link to="/news" className={`px-3 py-1.5 rounded-md transition-colors ${isCurrentPath("/news") ? "hidden" : "hover:bg-gray-100"}`}>
                        News
                    </Link>
                    {currentUser && !isCurrentPath("/dashboard") && (
                        <Link to="/dashboard" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                            Dashboard
                        </Link>
                    )}
                    {currentUser && !isCurrentPath("/profile") && (
                        <Link to="/profile" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                            Profile
                        </Link>
                    )}
                    {currentUser && !location.pathname.startsWith("/league/") && (
                        <>
                            <Link to="/league/create" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                Create League
                            </Link>
                            <Link to="/league/join" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                Join League
                            </Link>
                        </>
                    )}
                    {userProfile?.role === "Manager" && !isCurrentPath("/news/create") && (
                        <Link to="/news/create" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                            Create Post
                        </Link>
                    )}
                    {currentUser ? (
                        <button onClick={handleSignOut} className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-700">
                            Sign Out
                        </button>
                    ) : !isCurrentPath("/login") && (
                        <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                            Sign In
                        </Link>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="flex flex-col gap-1 p-4">
                        <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-md ${isCurrentPath("/about") ? "hidden" : "hover:bg-gray-100"}`}>
                            About
                        </Link>
                        <Link to="/news" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-md ${isCurrentPath("/news") ? "hidden" : "hover:bg-gray-100"}`}>
                            News
                        </Link>
                        {currentUser && !isCurrentPath("/dashboard") && (
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                Dashboard
                            </Link>
                        )}
                        {currentUser && !isCurrentPath("/profile") && (
                            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                Profile
                            </Link>
                        )}
                        {currentUser && !location.pathname.startsWith("/league/") && (
                            <>
                                <Link to="/league/create" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                    Create League
                                </Link>
                                <Link to="/league/join" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                    Join League
                                </Link>
                            </>
                        )}
                        {userProfile?.role === "Manager" && !isCurrentPath("/news/create") && (
                            <Link to="/news/create" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                Create Post
                            </Link>
                        )}
                        {currentUser ? (
                            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="px-3 py-2 rounded-md hover:bg-gray-100 text-left text-gray-700">
                                Sign Out
                            </button>
                        ) : !isCurrentPath("/login") && (
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-gray-100">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}