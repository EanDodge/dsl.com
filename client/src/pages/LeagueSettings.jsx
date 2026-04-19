import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, arrayRemove, deleteDoc, deleteField } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";


export default function LeagueSettings() {
    const { leagueId } = useParams();
    const { loading, currentUser } = useAuth();
    const nav = useNavigate();
    const [leagueData, setLeagueData] = useState(null);
    const [statWeights, setStatWeights] = useState(
        {
            passingTDs: 3,
            receivingTDs: 3,
            rushingTDs: 3,
            defensiveTDs: 3,
            defensiveTurnovers: 2,
            offensiveTurnovers: -2,
            mvp: 5,
            gameActive: 1,
            missedGame: -1
        });
    const [compareStat, setCompare] = useState(
        {
            passingTDs: 3,
            receivingTDs: 3,
            rushingTDs: 3,
            defensiveTDs: 3,
            defensiveTurnovers: 2,
            offensiveTurnovers: -2,
            mvp: 5,
            gameActive: 1,
            missedGame: -1
        });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [activeTab, setActiveTab] = useState('statWeights');
    const [players, setPlayers] = useState([]);
    const [menuOpen, setMenuOpen] = useState(null);
    const [confirmKick, setConfirmKick] = useState({ open: false, playerId: null, playerName: "" });
    useEffect(() => {
        const getStats = async () => {
            const snapShot = await getDoc(doc(db, "leagues", leagueId));
            if ((snapShot).exists()) {
                const leagueState = snapShot.data();
                setLeagueData(leagueState);
                const leagueStats = leagueState.statWeights;
                if (leagueStats) {
                    setStatWeights(leagueStats);
                    setCompare(leagueStats);
                }
                else
                    await updateDoc(doc(db, "leagues", leagueId), { statWeights });
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        getStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'roster') {
            const fetchPlayers = async () => {
                const playersSnap = await getDocs(collection(db, 'leagues', leagueId, 'players'));
                setPlayers(playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            };
            fetchPlayers();
        }
    }, [activeTab]);
    const handleChange = (e) => {
        setStatWeights({ ...statWeights, [e.target.name]: parseFloat(e.target.value) })
    }

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "leagues", leagueId), { statWeights });
            setCompare(statWeights);
            setSaveStatus("Settings saved.");
        } catch (error) {
            console.error(error);
            setSaveStatus("Save failed. Try again.");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(""), 3000);
        }
    }

    const handleChangeStatus = async (playerId, status) => {
        try {
            await updateDoc(doc(db, 'leagues', leagueId, 'players', playerId), { status });
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status } : p));
        } catch (error) {
            console.error(error);
        }
    };

    const handleKick = async () => {
        const playerId = confirmKick.playerId;
        if (!playerId) return;
        try {
            const player = players.find(p => p.id === playerId);
            const gamesSnap = await getDocs(collection(db, 'leagues', leagueId, 'games'));
            await Promise.all(gamesSnap.docs.map(gameDoc =>
                updateDoc(doc(db, 'leagues', leagueId, 'games', gameDoc.id), {
                    [`attendance.${playerId}`]: deleteField()
                })
            ));
            await updateDoc(doc(db, 'leagues', leagueId), {
                memberUids: arrayRemove(playerId)
            });
            await updateDoc(doc(db, 'users', playerId), {
                leagueIds: arrayRemove(leagueId)
            });
            await deleteDoc(doc(db, 'leagues', leagueId, 'players', playerId));
            setPlayers(prev => prev.filter(p => p.id !== playerId));
        } catch (error) {
            console.error(error);
        } finally {
            setConfirmKick({ open: false, playerId: null, playerName: "" });
        }
    };

    if (loading || !leagueData) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    const isComissioner = currentUser?.uid === leagueData?.commissionerId;
    if (!isComissioner) return <div className="flex items-center justify-center h-screen"><p className="text-red-600 font-semibold">Commissioners only</p></div>
    const isDirty = JSON.stringify(statWeights) !== JSON.stringify(compareStat);
    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">League Settings</h1>
            <p className="text-gray-500 mb-8">Configure your league settings</p>

            <div className="flex gap-4 mb-8">
                <button onClick={() => setActiveTab('statWeights')} className={activeTab === 'statWeights' ? 'btn-primary' : 'btn-secondary'}>Stat Weights</button>
                <button onClick={() => setActiveTab('roster')} className={activeTab === 'roster' ? 'btn-primary' : 'btn-secondary'}>League Roster</button>
            </div>

            {activeTab === 'statWeights' && (
                <form className="space-y-8">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">Stat Weights</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Touchdowns</label>
                                    <input
                                        name="passingTDs"
                                        type="number"
                                        value={statWeights.passingTDs}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Touchdowns</label>
                                    <input
                                        name="receivingTDs"
                                        type="number"
                                        value={statWeights.receivingTDs}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rushing Touchdowns</label>
                                    <input
                                        name="rushingTDs"
                                        type="number"
                                        value={statWeights.rushingTDs}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Defensive Touchdowns</label>
                                    <input
                                        name="defensiveTDs"
                                        type="number"
                                        value={statWeights.defensiveTDs}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Defensive Turnovers</label>
                                    <input
                                        name="defensiveTurnovers"
                                        type="number"
                                        value={statWeights.defensiveTurnovers}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offensive Turnovers</label>
                                    <input
                                        name="offensiveTurnovers"
                                        type="number"
                                        value={statWeights.offensiveTurnovers}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">MVP Game</label>
                                    <input
                                        name="mvp"
                                        type="number"
                                        value={statWeights.mvp}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Active Game</label>
                                    <input
                                        name="gameActive"
                                        type="number"
                                        value={statWeights.gameActive}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Missed Game</label>
                                    <input
                                        name="missedGame"
                                        type="number"
                                        value={statWeights.missedGame}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {saveStatus && (
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                            {saveStatus}
                        </p>
                    )}
                    {isDirty && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full btn-primary transition-opacity opacity-100 animate-fadeIn ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    )}
                </form>
            )}

            {activeTab === 'roster' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">League Roster</h3>
                    {players.map(player => (
                        <div key={player.id} className="flex justify-between items-center p-4 border rounded">
                            <Link to={`/profile?user=${player.id}`} className="text-blue-600 hover:underline">{player.displayName}</Link>
                            {isComissioner && (
                                <div className="relative">
                                    <button onClick={() => setMenuOpen(menuOpen === player.id ? null : player.id)} className="p-1 hover:bg-gray-100 rounded">⋮</button>
                                    {menuOpen === player.id && (
                                        <div className="absolute right-0 mt-1 min-w-[150px] bg-white border rounded shadow z-10">
                                            <button onClick={() => handleChangeStatus(player.id, 'inactive')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">Change Status to Inactive</button>
                                            <button
                                                onClick={() => {
                                                    setConfirmKick({ open: true, playerId: player.id, playerName: player.displayName });
                                                    setMenuOpen(null);
                                                }}
                                                className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                                            >
                                                Kick Player
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <ConfirmDialog
                open={confirmKick.open}
                title="Kick Player"
                message={`Are you sure you want to kick ${confirmKick.playerName} from the league?`}
                confirmLabel="Kick Player"
                cancelLabel="Cancel"
                danger
                onConfirm={handleKick}
                onCancel={() => setConfirmKick({ open: false, playerId: null, playerName: "" })}
            />
        </div>
    )

}