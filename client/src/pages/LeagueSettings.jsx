import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


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
    const handleChange = (e) => {
        setStatWeights({ ...statWeights, [e.target.name]: parseFloat(e.target.value) })
    }

    const handleSave = async () => {
        await updateDoc(doc(db, "leagues", leagueId), { statWeights });
        setCompare(statWeights);  // ← reset compare so isDirty becomes false
    }

    if (loading || !leagueData) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    const isComissioner = currentUser?.uid === leagueData?.commissionerId;
    if (!isComissioner) return <div className="flex items-center justify-center h-screen"><p className="text-red-600 font-semibold">Commissioners only</p></div>
    const isDirty = JSON.stringify(statWeights) !== JSON.stringify(compareStat);
    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">League Settings</h1>
            <p className="text-gray-500 mb-8">Configure how stats are weighted to calculate player ratings</p>

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

                {isDirty && (
                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full btn-primary transition-opacity opacity-100 animate-fadeIn"
                    >
                        Save Settings
                    </button>
                )}
            </form>
        </div>
    )

}