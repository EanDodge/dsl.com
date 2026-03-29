import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { apiPut, apiPost } from "../api"
import { GameMap } from "../components/GoogleMap"

export default function GamePage() {
    const { leagueId, gameId } = useParams();
    const { currentUser, loading } = useAuth();
    const [gameData, setGameStatic] = useState(null);
    const [gameAttendance, setGameAttendance] = useState({});
    const [gameTeams, setGameTeams] = useState([]);
    const [members, setMembers] = useState(null);
    useEffect(() => {
        const fetchMembers = async () => {
            const userSnap = await getDoc(doc(db, "leagues", leagueId));
            if (userSnap.exists()) {
                const memberDocs = await Promise.all(
                    userSnap.data().memberUids.map(uid =>
                        getDoc(doc(db, "leagues", leagueId, "players", uid ))
                    )
                ); setMembers(memberDocs.map(d => d.data()));
            }
        }
        fetchMembers();
    }, []);
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, "leagues", leagueId, "games", gameId),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    // only set static data once
                    if (!gameData) {
                        setGameStatic({
                            location: data.location,
                            date: data.date,
                            time: data.time,
                            numTeams: data.numTeams,
                            positionSlots: data.positionSlots,
                            commissionerId: data.commissionerId
                        });
                    }
                    setGameAttendance(data.attendance || {});
                    setGameTeams(data.teams || []);
                }
            }
        );
        return unsubscribe;
    }, []);
    const handleStatusChange = async (uid, status) => {
        try {
            const token = await currentUser.getIdToken();
            const result = await apiPut(`/api/leagues/${leagueId}/games/${gameId}/attendance`, { uid, status }, token);
        } catch (error) {
            console.log(error);
        }
    }
    const handleBuildTeams = async () => {
        try {
            const token = await currentUser.getIdToken();
            await apiPost(`/api/leagues/${leagueId}/games/${gameId}/build-teams`, {}, token);
        } catch (error) {
            console.log(error);
        }
    }

    if (loading || !gameData || !members) return <h1>Loading...</h1>
    const isCommissioner = currentUser?.uid === gameData?.commissionerId;
    return (
        <div>
            <h1>Attendance List</h1>
            {members.map((member) => {
                const status = gameAttendance[member.uid] || "pending";
                const canEdit = member.uid === currentUser.uid || isCommissioner;

                return (
                    <div key={member.uid}>
                        <span>{member.displayName}</span>
                        {canEdit ? (
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(member.uid, e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="attending">Attending</option>
                                <option value="not attending">Not Attending</option>
                            </select>
                        ) : (
                            <span>{status}</span>
                        )}
                    </div>
                );
            })}
            <h3>The Game will be played at: {gameData.location.name}</h3>
            {/* <div dangerouslySetInnerHTML={{ __html: gameData.location.embeddedMap }} /> */}
            {/* iframe from google */}
            <GameMap embeddedMap = {gameData.location.embeddedMap} />
            <h3>There are {gameData.numTeams} Teams</h3>
            <h3>Each Team will Have</h3>
            {["QB", "RB", "WR", "TE", "C"].map((pos) => (
                <div key={pos}>
                    <span>{pos}: {gameData.positionSlots[pos]}</span>
                </div>
            ))}
            {isCommissioner && (
                <button onClick={handleBuildTeams}>Build Teams</button>
            )}
            {gameData.teams?.length > 0 && (
                <div>
                    <h2>Teams</h2>
                    {gameData.teams.map((team, index) => (
                        <div key={index}>
                            <h3>{team.name}</h3>
                            {team.players.map((player) => (
                                <p key={player.uid}>
                                    {player.displayName} — {player.assignedPosition} ({player.assignedOvr})
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}