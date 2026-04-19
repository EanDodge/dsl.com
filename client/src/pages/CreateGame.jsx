import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiPost, apiPut } from "../api"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"



export default function CreateGame() {
    const { currentUser } = useAuth();
    const { leagueId } = useParams();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const editGameId = searchParams.get('edit');
    const [formData, setFormData] = useState({
        date: "",
        time: "",
        location: { name: "", embeddedMap: "" },
        numTeams: 2,
        positionSlots: { QB: 1, RB: 1, WR: 2, TE: 1, C: 1 }
    });
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const checkCommissioner = async () => {
            const snap = await getDoc(doc(db, "leagues", leagueId));
            if (snap.exists()) {
                setIsCommissioner(snap.data().commissionerId === currentUser.uid);
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        checkCommissioner();
    }, []);

    useEffect(() => {
        if (editGameId) {
            const fetchGame = async () => {
                const gameDoc = await getDoc(doc(db, 'leagues', leagueId, 'games', editGameId));
                if (gameDoc.exists()) {
                    const data = gameDoc.data();
                    setFormData({
                        date: data.date,
                        time: data.time,
                        location: data.location,
                        numTeams: data.numTeams,
                        positionSlots: data.positionSlots
                    });
                    setIsEdit(true);
                }
            };
            fetchGame();
        }
    }, [editGameId]);

    const handleSubmit = async () => {
        try {
            const token = await currentUser.getIdToken();
            if (isEdit) {
                await apiPut(`/api/leagues/${leagueId}/games/${editGameId}`, formData, token);
                nav(`/league/${leagueId}/games/${editGameId}`);
            } else {
                const result = await apiPost(`/api/leagues/${leagueId}/games`, formData, token);
                nav(`/league/${leagueId}/games/${result.gameId}`);
            }
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
    if (!isCommissioner) return <div className="flex items-center justify-center h-screen"><p className="text-red-600 font-semibold">Access Denied</p></div>
    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{isEdit ? 'Edit Game' : 'Create Game'}</h1>

            <form className="space-y-8">
                {/* Date and Time */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">When is your game?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
                            <input
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Time</label>
                            <input
                                name="time"
                                type="time"
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">Where are you playing?</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Location Name</label>
                            <input
                                name="name"
                                placeholder="e.g., Central Park Field"
                                data-group="location"
                                value={formData.location.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Google Maps Embed Code</label>
                            <textarea
                                name="embeddedMap"
                                data-group="location"
                                placeholder="Paste Google Maps embed iframe here"
                                value={formData.location.embeddedMap}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 resize-none font-mono text-xs" style={{ "--tw-ring-color": "#FF6B00" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Teams */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">Team Information</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Number of Teams</label>
                            <input
                                type="number"
                                name="numTeams"
                                value={formData.numTeams}
                                onChange={handleChange}
                                min="2"
                                max="10"
                                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">Position Slots per Team</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {["QB", "RB", "WR", "TE", "C"].map((pos) => (
                                    <div key={pos} className="flex flex-col">
                                        <label className="text-xs font-semibold text-gray-700 mb-1">{pos}</label>
                                        <input
                                            type="number"
                                            name={pos}
                                            data-group="positionSlots"
                                            value={formData.positionSlots[pos]}
                                            onChange={handleChange}
                                            min="0"
                                            max="5"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-center text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                {allFilled && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full btn-primary transition-opacity opacity-100 animate-fadeIn"
                    >
                        {isEdit ? 'Update Game' : 'Create Game'}
                    </button>
                )}
            </form>
        </div>
    )
}