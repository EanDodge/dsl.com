import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"


export default function LeagueProfile() {
    const { leagueId } = useParams();
    const { currentUser, loading } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    useEffect(() => {
        const fetchProfile = async () => {
            const userSnap = await getDoc(doc(db, "leagues", leagueId, "players", currentUser.uid));
            if (userSnap.exists()) {

                setProfileData(userSnap.data());
                setFormData(userSnap.data());
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        fetchProfile();
    }, []);
    const isDirty = JSON.stringify(formData) !== JSON.stringify(profileData);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    const handleSave = async () => {
        await updateDoc(doc(db, "leagues", leagueId, "players", currentUser.uid), {
            displayName: formData.displayName,
            position1: formData.position1,
            position2: formData.position2,
            position3: formData.position3
        });
        setProfileData(formData);
    }
    if (loading) return <h1>Loading...</h1>
    if (!profileData) return <h1>Loading...</h1>

    return (
        <div>
            <div>
                <h1>Display Name:
                    <input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                    /></h1>

            </div>
            <div>
                <h2>Overall: {formData.overall}</h2>
            </div>
            <div>
                <h2>Positions:
                    <select name="position1" value={formData.position1} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {["QB", "RB", "WR", "TE", "C"].map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select> /
                    <select name="position2" value={formData.position2} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {["QB", "RB", "WR", "TE", "C"].map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select> /
                    <select name="position3" value={formData.position3} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {["QB", "RB", "WR", "TE", "C"].map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select></h2>
            </div>
            <div>
                <h2>Status: {formData.status}</h2>
            </div>
            {isDirty && <button onClick={handleSave}>Save</button>}
        </div>
    )
}