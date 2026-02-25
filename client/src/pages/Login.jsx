import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase"
import { useNavigate,useLocation } from "react-router-dom";

export default function Login(){
    const nav = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/dashboard";
    const handleLogin = async () => {
        try{
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        nav(from);
        }catch(error){
            console.log(error);
        }
        
    }

    
    return(
        <div>
                <button onClick= {handleLogin} >Sign in with Google</button>

        </div>
    )
}
