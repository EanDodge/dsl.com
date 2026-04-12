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
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => nav(`/league/${leagueId}/games/${gameId}`)} className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-900 font-bold transition-colors" title="Go back to game">
                    &lt;
                </button>
                <h1 className="text-4xl font-bold text-gray-900">Enter Game Stats</h1>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left px-4 py-3 font-semibold text-gray-900">Player</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Pass TD</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Rush TD</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Rec TD</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Def TD</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Def TO</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">Off TO</th>
                            <th className="text-center px-2 py-3 font-semibold text-gray-600 text-sm">MVP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={player.uid} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{player.displayName}</td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.passingTDs || 0}
                                        onChange={(e) => handleChange(player.uid, "passingTDs", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.rushingTDs || 0}
                                        onChange={(e) => handleChange(player.uid, "rushingTDs", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.receivingTDs || 0}
                                        onChange={(e) => handleChange(player.uid, "receivingTDs", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.defensiveTDs || 0}
                                        onChange={(e) => handleChange(player.uid, "defensiveTDs", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.defensiveTurnovers || 0}
                                        onChange={(e) => handleChange(player.uid, "defensiveTurnovers", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[player.uid]?.offensiveTurnovers || 0}
                                        onChange={(e) => handleChange(player.uid, "offensiveTurnovers", parseInt(e.target.value))}
                                        className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </td>
                                <td className="text-center px-2 py-3">
                                    <input
                                        type="checkbox"
                                        checked={formData[player.uid]?.mvp || false}
                                        onChange={(e) => handleChange(player.uid, "mvp", e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={handleSubmit} className="btn-primary">Save Stats</button>
                <button onClick={handleClear} className="btn-secondary">Clear Stats</button>
            </div>
        </div>
    )
}