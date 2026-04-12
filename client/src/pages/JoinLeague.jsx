import { useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { apiPost } from "../api"
export default function JoinLeague() {
    const [formData, setFormData] = useState({ inviteCode: "" });
    const { currentUser,loading } = useAuth();
    const [searchParams] = useSearchParams();
    const nav = useNavigate();
    useEffect(() => {
        if(loading) return;
        const getCode = async () => {
            try {
                const code = searchParams.get("code");
                if (!currentUser) {
                    if (code) sessionStorage.setItem("pendingInviteCode", code);
                    nav("/login");
                    return;
                }
                if (code) {
                    const token = await currentUser.getIdToken();
                    const form = { inviteCode: code };
                    const result = await apiPost("/api/leagues/join", form, token);
                    console.log(result);
                    nav(`/league/${result.leagueId}`)
                }
            } catch (error) {
                console.log(error);
            }
        }
        getCode();
    }, [loading]);
    const codeFull = formData.inviteCode !== "";
    const handleJoin = async () => {
        try {
            const token = await currentUser.getIdToken();
            const result = await apiPost("/api/leagues/join", formData, token);
            console.log(result);
            nav(`/league/${result.leagueId}`)
        } catch (error) {
            console.log(error);
        }
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Join a League</h1>

            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Invite Code</label>
                    <input
                        type="text"
                        name="inviteCode"
                        placeholder="ex. ABC123"
                        value={formData.inviteCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 text-center text-lg tracking-widest" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                    <p className="text-xs text-gray-500 mt-2">You'll receive this code from your league commissioner.</p>
                </div>

                {codeFull && (
                    <button
                        type="button"
                        onClick={handleJoin}
                        className="w-full btn-primary transition-opacity opacity-100 animate-fadeIn"
                    >
                        Join League
                    </button>
                )}
            </form>
        </div>
    )

}