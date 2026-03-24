import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiPost } from "../api"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"



export default function CreateGame() {
    const { currentUser } = useAuth();
    const { leagueId } = useParams();
    const nav = useNavigate();
    const [formData, setFormData] = useState({
        date: "",
        time: "",
        location: { name: "", embeddedMap: "" },
        numTeams: 2,
        positionSlots: { QB: 1, RB: 1, WR: 2, TE: 1, C: 1 }
    });
    const [isCommissioner, setIsCommissioner] = useState(false);

    useEffect(() => {
        const checkCommissioner = async () => {
            const snap = await getDoc(doc(db, "leagues", leagueId));
            if (snap.exists()) {
                setIsCommissioner(snap.data().commissionerId === currentUser.uid);
            }
        }
        checkCommissioner();
    }, []);

    const handleCreateGame = async () => {
        try {
            const token = await currentUser.getIdToken();
            const result = await apiPost(`/api/leagues/${leagueId}/games`, formData, token);
            console.log(result);
            nav(`/league/${leagueId}/games/${result.gameId}`)
        } catch (error) {
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
    const allFilled = formData.date !== "" && formData.time !== "" && formData.location.name !== "" && formData.numTeams !== "" && formData.numTeams > 1
    if (!isCommissioner) return <h1>Access Denied</h1>
    return (


        <div>
            <h1>Create Your Game</h1>
            <h3>When is your game?</h3>
            <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange} />
            <input
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange} />
            <h3>Where are you playing?</h3>
            <input
                name="name"
                placeholder="FieldName"
                data-group="location"
                value={formData.location.name}
                onChange={handleChange}
            />
            <textarea
                name="embeddedMap"
                data-group="location"
                placeholder="Paste Google Maps embed code here"
                value={formData.location.embeddedMap}
                onChange={handleChange}
                rows="4"
            />

            <h3>Team Information</h3>
            <h4>Number of Teams</h4>
            <input
                type="number"
                name="numTeams"
                value={formData.numTeams}
                onChange={handleChange}
            />
            <h4>Position Slots</h4>
            <div>
                <h3>Position Slots Per Team</h3>
                {["QB", "RB", "WR", "TE", "C"].map((pos) => (
                    <div key={pos}>
                        <label>{pos}</label>
                        <input
                            type="number"
                            name={pos}
                            data-group="positionSlots"
                            value={formData.positionSlots[pos]}
                            onChange={handleChange}
                            min="0"
                            max="5"
                        />
                    </div>
                ))}
            </div>
            {allFilled && <button onClick={handleCreateGame}>Create</button>}

        </div>
    )
}