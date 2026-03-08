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
        <div>
            <h1>Join a League</h1>
            <h3>Invite Code</h3>
            <input name="inviteCode" placeholder="ex. ABC123"
                value={formData.inviteCode} onChange={handleChange} />
            {codeFull && <button onClick={handleJoin}>Join League</button>}
        </div>
    )

}