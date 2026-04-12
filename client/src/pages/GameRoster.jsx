import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { apiDelete, apiPost } from "../api"

export default function GameRoster() {
    const { leagueId, gameId } = useParams();
    const { currentUser, loading } = useAuth();
    const nav = useNavigate();
    const [players, setPlayers] = useState([]);
    const [formData, setFormData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const defaultStats = {
        passingTDs: 0,
        receivingTDs: 0,
        rushingTDs: 0,
        defensiveTurnovers: 0,
        defensiveTDs: 0,
        offensiveTurnovers: 0,
        mvp: false
    };

    useEffect(() => {
        const fetchData = async () => {
            const getPlayers = async () => {
                const snap = await getDoc(doc(db, "leagues", leagueId, "games", gameId));
                if ((snap).exists()) {
                    const attendingUids = Object.entries(snap.data().attendance)
                        .filter(([uid, status]) => status === "attending")
                        .map(([uid]) => uid);
                    const playerDocs = await Promise.all(
                        attendingUids.map(uid =>
                            getDoc(doc(db, "leagues", leagueId, "players", uid))
                        )
                    );
                    const playerList = playerDocs.map(d => d.data()).filter(Boolean);
                    setPlayers(playerList);
                    const initialStats = {};
                    attendingUids.forEach(uid => {
                        initialStats[uid] = snap.data().playerStats?.[uid] || { ...defaultStats };
                    });
                    setFormData(initialStats);
                }
                else{
                    nav("/not-found");
                    return;
                }

            };
            getPlayers();

        }
        fetchData();
    }, [refresh]);

    const handleChange = (uid, field, value) => {
        setFormData({
            ...formData,
            [uid]: { ...formData[uid], [field]: value }
        });
    }

    const handleSubmit = async () => {
        const token = await currentUser.getIdToken();
        const result = await apiPost(`/api/leagues/${leagueId}/games/${gameId}/stats`, { playerStats: formData }, token);
        console.log(result);
        nav(`/league/${leagueId}/games/${gameId}`)

    }
    const handleClear = async () => {
        const token = await currentUser.getIdToken();
        const result = await apiDelete(`/api/leagues/${leagueId}/games/${gameId}/stats`, token);
        console.log(result);
        setRefresh(refresh + 1);
    }

    if (loading || players.length === 0) return <h1>Loading...</h1>

    return (
        <div>
            <h1>Enter Game Stats</h1>
            <div>
                <span> Pass TDs </span>
                <span> Rush TDs </span>
                <span> Rec TDs </span>
                <span> Def TDs </span>
                <span> Def TO </span>
                <span> Off TO </span>
                <span> MVP </span>
            </div>
            {players.map((player) => (
                <div key={player.uid}>
                    <h3>{player.displayName}</h3>

                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.passingTDs || 0}
                        onChange={(e) => handleChange(player.uid, "passingTDs", parseInt(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.rushingTDs || 0}
                        onChange={(e) => handleChange(player.uid, "rushingTDs", parseInt(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.receivingTDs || 0}
                        onChange={(e) => handleChange(player.uid, "receivingTDs", parseInt(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.defensiveTurnovers || 0}
                        onChange={(e) => handleChange(player.uid, "defensiveTurnovers", parseInt(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.defensiveTDs || 0}
                        onChange={(e) => handleChange(player.uid, "defensiveTDs", parseInt(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0"
                        value={formData[player.uid]?.offensiveTurnovers || 0}
                        onChange={(e) => handleChange(player.uid, "offensiveTurnovers", parseInt(e.target.value))}
                    />
                    <input
                        type="checkbox"
                        checked={formData[player.uid]?.mvp || false}
                        onChange={(e) => handleChange(player.uid, "mvp", e.target.checked)}
                    />
                </div>
            ))}
            <button onClick={handleSubmit}>Save Stats</button>
            <button onClick={handleClear}>Clear Stats</button>
        </div>
    )
}