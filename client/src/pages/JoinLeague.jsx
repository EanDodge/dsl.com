import { useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { apiPost } from "../api"
export default function JoinLeague() {
    const [formData, setFormData] = useState({ inviteCode: "" });
    const [joinError, setJoinError] = useState("");
    const [joining, setJoining] = useState(false);
    const { currentUser, loading } = useAuth();
    const [searchParams] = useSearchParams();
    const nav = useNavigate();
    useEffect(() => {
        if (loading) return;
        const getCode = async () => {
            try {
                const code = searchParams.get("code");
                if (!currentUser) {
                    if (code) sessionStorage.setItem("pendingInviteCode", code);
                    nav("/login");
                    return;
                }
                if (code) {
                    setJoining(true);
                    const token = await currentUser.getIdToken();
                    const result = await apiPost("/api/leagues/join",
                        { inviteCode: code }, token);
                    if (result.leagueId) {
                        nav(`/league/${result.leagueId}`);
                    } else {
                        setJoinError(result.error || "Failed to join league. Please try the code manually.");
                        setJoining(false);
                    }
                }
            } catch (error) {
                console.log(error);
                setJoinError("Something went wrong. Please enter the code manually.");
                setJoining(false);
            }
        }
        getCode();
    }, [loading]);
    const codeFull = formData.inviteCode !== "";
    const handleJoin = async () => {
        if (joining) return;
        try {
            setJoining(true);
            const token = await currentUser.getIdToken();
            const result = await apiPost("/api/leagues/join", formData, token);
            if (result.leagueId) {
                nav(`/league/${result.leagueId}`);
            } else {
                setJoinError(result.error || "Invalid invite code.");
                setJoining(false);
            }
        } catch (error) {
            console.log(error);
            setJoinError("Something went wrong. Please try again.");
            setJoining(false);
        }
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (joinError) setJoinError("");
    }

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Join a League</h1>

            {joining ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">Joining league...</p>
                </div>
            ) : (
                <form className="space-y-6">
                    {joinError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {joinError}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Invite Code
                        </label>
                        <input
                            type="text"
                            name="inviteCode"
                            placeholder="ex. ABC123"
                            value={formData.inviteCode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 text-center text-lg tracking-widest"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            You'll receive this code from your league commissioner.
                        </p>
                    </div>
                    {codeFull && (
                        <button
                            type="button"
                            onClick={handleJoin}
                            disabled={joining}
                            className={`w-full btn-primary ${joining ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {joining ? 'Joining...' : 'Join League'}
                        </button>
                    )}
                </form>
            )}
        </div>
    )
}