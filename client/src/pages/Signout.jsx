import { signOut } from "firebase/auth";
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom";

export default function Login(){
    const nav = useNavigate();
    
    const handleSignOut = async () => {
        try{
        await signOut(auth);
        nav("/");
        }catch(error){
            console.log(error);
        }
        
    }

    
    return(
        <div>
                <button onClick= {handleSignOut} >Sign Out</button>

        </div>
    )
}
