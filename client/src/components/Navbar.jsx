import { Link } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"

export default function Navbar() {
    const { currentUser,userProfile } = useAuth();
    const nav = useNavigate();
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            nav("/login");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <nav>
            <Link to="/about">About</Link>
            <Link to="/news">News</Link>
            {currentUser && <Link to="/dashboard">Dashboard</Link>}
            {currentUser && <Link to="/profile">Profile</Link>}
            {currentUser && <Link to="/league/create">CreateLeague</Link>}
            {currentUser ? <button onClick={handleSignOut}>Sign Out</button> : <Link to="/login">Sign In</Link>}
            {userProfile?.role === "Manager" && <Link to="/news/create">Create Post</Link>}
        </nav>
    )
}