import { useAuth } from "../context/AuthContext"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api"

export default function CreateLeague() {
    const { currentUser } = useAuth();
    const nav = useNavigate();
    const [formData, setFormData] = useState({ name: "", sport: "", location: { city: "", state: "" } });
    const [inviteCode, setInviteCode] = useState(null);
    const handleCreateLeague = async () => {
        try{
        const token = await currentUser.getIdToken();
        const result = await apiPost("/api/leagues", formData, token);
        console.log(result);
        setInviteCode(result.inviteCode);
        nav(`/league/${result.leagueId}`)
        }catch(error) {
        console.log(error);
    }
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        const group = e.target.dataset.group;

        if (group) {
            setFormData({
                ...formData,
                [group]: { ...formData[group], [name]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    }
    const allFilled = formData.name !== "" && formData.sport !== "" && formData.location.city !== "" && formData.location.state !== ""
    return (


        <div>
            <h1>Create Your New League</h1>
            <h3>Name Your League</h3>
            <input
                name="name"
                value={formData.name}
                onChange={handleChange} />
            <h3>What Sport are you playing?</h3>
            <label>
                Choose an option:
                <select name = "sport"
                        placeholder = "Choose one"
                        value={formData.sport} 
                        onChange={handleChange}>
                    <option value="" disabled hidden>Choose a Sport</option>
                    <option value="football">Football</option>
                    <option value="baseball">Baseball</option>
                    <option value="basketball">Basketball</option>
                    <option value="soccer">Soccer</option>
                    <option value="other">Other</option>
                </select>
            </label>
            <h3>Where is the league located?</h3>
            <input
                name="city"
                placeholder="City"
                data-group="location"
                value={formData.location.city}
                onChange={handleChange}
            />
            <input
                name="state"
                placeholder="State"
                data-group="location"
                value={formData.location.state}
                onChange={handleChange}
            />

            {allFilled && <button onClick={handleCreateLeague}>Create</button>}
            
        </div>
    )
}