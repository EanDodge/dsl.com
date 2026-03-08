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
        <div>
            <button onClick={handleLogin}>Sign in with Google</button>
        </div>
    )
}