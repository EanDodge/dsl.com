import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"


export default function LeagueProfile() {
    const { leagueId } = useParams();
    const { currentUser, loading } = useAuth();
    const nav = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
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

    const handlePositionChange = async (e) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };
        setFormData(newData);
        try {
            await updateDoc(doc(db, "leagues", leagueId, "players", currentUser.uid), { [name]: value });
            setProfileData(newData);
        } catch (error) {
            console.error(error);
        }
    }
    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "leagues", leagueId, "players", currentUser.uid), {
                displayName: formData.displayName,
                position1: formData.position1,
                position2: formData.position2,
                position3: formData.position3
            });
            setProfileData(formData);
            setSaveStatus("Profile saved.");
        } catch (err) {
            console.error(err);
            setSaveStatus("Save failed. Please try again.");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(""), 3000);
        }
    }
    if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    if (!profileData) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Your League Profile</h1>

            <form className="space-y-8">
                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Display Name</label>
                    <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                </div>

                {/* Overall Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Overall Rating</label>
                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{formData.overall || 60}</p>
                    </div>
                </div>

                {/* Positions */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">Position Preferences</h3>
                    <p className="text-xs text-gray-500 mb-4">Select your preferred positions in order of priority</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Position</label>
                            <select
                                name="position1"
                                value={formData.position1}
                                onChange={handlePositionChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            >
                                <option value="">-- Select --</option>
                                {["QB", "RB", "WR", "TE", "C"].map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Position</label>
                            <select
                                name="position2"
                                value={formData.position2}
                                onChange={handlePositionChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            >
                                <option value="">-- Select --</option>
                                {["QB", "RB", "WR", "TE", "C"].map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tertiary Position</label>
                            <select
                                name="position3"
                                value={formData.position3}
                                onChange={handlePositionChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                            >
                                <option value="">-- Select --</option>
                                {["QB", "RB", "WR", "TE", "C"].map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-700 font-medium">{formData.status || "Unknown"}</p>
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
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                )}
            </form>
        </div>
    )
}