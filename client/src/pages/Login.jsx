import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase"
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
    const nav = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/dashboard";

    const handleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            const pendingCode = sessionStorage.getItem("pendingInviteCode");
            if (pendingCode) {
                sessionStorage.removeItem("pendingInviteCode");
                nav(`/league/join?code=${pendingCode}`);
            } else {
                nav(from);
            }
        } catch (error) {
            console.log(error.code, error.message);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen pt-safe bg-white px-4">
            <div className="text-center">
                <img src="/icons/icon-512.png" alt="DSL Shield" className="w-20 h-20 mx-auto mb-8" />
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dodge Sports League</h1>
                <p className="text-gray-600 mb-8">Manage your league, track stats, build teams</p>

                <button
                    onClick={handleLogin}
                    className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mx-auto shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#1f2937">🔵</text>
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    )
}