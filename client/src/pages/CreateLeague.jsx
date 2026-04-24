import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiPost, apiPut } from "../api"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"

export default function CreateLeague() {
    const { currentUser } = useAuth();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const editLeagueId = searchParams.get('edit');
    const [formData, setFormData] = useState({ name: "", sport: "", location: { city: "", state: "" } });
    const [inviteCode, setInviteCode] = useState(null);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        if (editLeagueId) {
            const fetchLeague = async () => {
                const leagueDoc = await getDoc(doc(db, 'leagues', editLeagueId));
                if (leagueDoc.exists()) {
                    const data = leagueDoc.data();
                    setFormData({
                        name: data.name,
                        sport: data.sport,
                        location: data.location
                    });
                    setIsEdit(true);
                }
            };
            fetchLeague();
        }
    }, [editLeagueId]);

    const handleSubmit = async () => {
        try {
            const token = await currentUser.getIdToken();
            if (isEdit) {
                await apiPut(`/api/leagues/${editLeagueId}`, formData, token);
                nav(`/league/${editLeagueId}`);
            } else {
                const result = await apiPost("/api/leagues", formData, token);
                setInviteCode(result.inviteCode);
                nav(`/league/${result.leagueId}`);
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
    const allFilled = formData.name !== "" && formData.sport !== "" && formData.location.city !== "" && formData.location.state !== ""
    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{isEdit ? 'Edit League' : 'Create Your League'}</h1>

            <form className="space-y-8">
                {/* League Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">League Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                        placeholder="e.g., Downtown Dodgers"
                    />
                </div>

                {/* Sport */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Sport</label>
                    <select
                        name="sport"
                        value={formData.sport}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                    >
                        <option value="" disabled hidden>Choose a sport</option>
                        <option value="Football">Football</option>
                        <option value="Baseball">Baseball</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Soccer">Soccer</option>
                        <option value="Sports">Other</option>
                    </select>
                </div>

                {/* Location */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 pb-3 border-b border-gray-200">Location</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            data-group="location"
                            value={formData.location.city}
                            onChange={handleChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-gray-900"
                        />
                        <input
                            type="text"
                            name="state"
                            placeholder="State"
                            data-group="location"
                            value={formData.location.state}
                            onChange={handleChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-gray-900"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allFilled}
                    className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-all duration-150 ${
                        allFilled
                            ? 'bg-[#FF6B00] hover:bg-orange-700 cursor-pointer'
                            : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    {isEdit ? 'Update League' : 'Create League'}
                </button>
            </form>
        </div>
    )
}