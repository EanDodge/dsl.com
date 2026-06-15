import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore"
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

    // settings page only handles stat weights now; roster is its own page
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

    // roster actions moved to roster page; settings only edits stat weights

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
            </div>

            {activeTab === 'statWeights' && (
                <form className="space-y-8">
                    <div>
                        {/* removed the title here as requested; the button still shows the tab label */}
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

            {/* roster moved to its own page */}
            {/* no roster dialog on settings page */}
        </div>
    )

}