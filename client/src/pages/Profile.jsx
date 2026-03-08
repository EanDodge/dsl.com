import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../Context/AuthContext"
import { useEffect, useState } from "react"


export default function Profile(){
    const {currentUser} = useAuth();
    const [profileData,setProfileData] = useState(null);
    const [formData,setFormData] = useState({});
    useEffect(() =>{
        const fetchProfile = async () =>{
            const userSnap = await getDoc(doc(db, "users",currentUser.uid));    
            if(userSnap.exists()){
                
                setProfileData(userSnap.data());
                setFormData(userSnap.data());
            }    
        }
        fetchProfile();
    }, []);
    const isDirty = JSON.stringify(formData) !== JSON.stringify(profileData);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})  
    }
    const handleSave = async() => {
        const {displayName,bio} = formData;
        await updateDoc(doc(db, "users", currentUser.uid),{displayName,bio} );   
        
    }
    if (!profileData) return <h1>Loading...</h1>
    
    return(
        <div>
            <div>
            <h1>Display Name</h1>
            <input 
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
            /></div>
            <div>
            <h2>Email: {formData.email}</h2>
            </div>
            <div>
            <h2>Bio</h2>
            <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
            />
            </div>
            <div>
            <h2>Role: {formData.role}</h2>
            </div>
            {isDirty && <button onClick={handleSave}>Save</button>}
        </div>
    )
}