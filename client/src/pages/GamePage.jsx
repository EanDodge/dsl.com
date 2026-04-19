import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { apiPut, apiPost } from "../api"
import { GameMap } from "../components/GoogleMap"
import PageCard from "../components/PageCard"

export default function GamePage() {
    const { leagueId, gameId } = useParams();
    const { currentUser, loading } = useAuth();
    const [gameData, setGameStatic] = useState(null);
    const [gameAttendance, setGameAttendance] = useState({});
    const [gameTeams, setGameTeams] = useState([]);
    const [members, setMembers] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const nav = useNavigate();
    useEffect(() => {
        const fetchMembers = async () => {
            const userSnap = await getDoc(doc(db, "leagues", leagueId));
            if (userSnap.exists()) {
                const memberDocs = await Promise.all(
                    userSnap.data().memberUids.map(uid =>
                        getDoc(doc(db, "leagues", leagueId, "players", uid))
                    )
                ); setMembers(memberDocs.map(d => d.data()));
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        fetchMembers();
    }, []);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const updateMobile = () => setIsMobile(mq.matches);
        updateMobile();
        if (mq.addEventListener) {
            mq.addEventListener("change", updateMobile);
        } else {
            mq.addListener(updateMobile);
        }
        return () => {
            if (mq.removeEventListener) {
                mq.removeEventListener("change", updateMobile);
            } else {
                mq.removeListener(updateMobile);
            }
        };
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
                            commissionerId: data.commissionerId,
                            teams: data.teams
                        });
                    }
                    setGameAttendance(data.attendance || {});
                    setGameTeams(data.teams || []);
                }
                else{
                    nav("/not-found");
                    return;
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

    if (loading || !gameData || !members) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    const isCommissioner = currentUser?.uid === gameData?.commissionerId;
    const attendingCount = Object.values(gameAttendance).filter(s => s === "attending").length;
    const pendingCount = Object.values(gameAttendance).filter(s => s === "pending").length;

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {new Date(gameData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h1>
                <p className="text-gray-600">{gameData.time || 'TBD'} • {gameData.location?.name}</p>
            </div>

            {/* Attendance section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance ({attendingCount}/{members.length})</h2>
                <PageCard accentColor="teal" className="mb-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {members.map((member) => {
                            const status = gameAttendance[member.uid] || "pending";
                            const canEdit = member.uid === currentUser.uid || isCommissioner;

                            return (
                                <div key={member.uid} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                                    <span className="font-medium text-gray-900">{member.displayName}</span>
                                    {canEdit ? (
                                        <select
                                            value={status}
                                            onChange={(e) => handleStatusChange(member.uid, e.target.value)}
                                            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="attending">Attending</option>
                                            <option value="not attending">Not Attending</option>
                                        </select>
                                    ) : (
                                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                            status === "attending" ? "bg-green-100 text-green-700" :
                                            status === "pending" ? "bg-gray-100 text-gray-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {status === "not attending" ? "Not Attending" : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </PageCard>
            </div>

            {/* Location and Map */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="mb-4">
                    <p className="text-gray-700 font-medium">{gameData.location.name}</p>
                </div>
                <div className="w-full overflow-hidden rounded-lg" style={{ maxWidth: '100%' }}>
                    <GameMap embeddedMap={gameData.location.embeddedMap} />
                </div>
            </div>

            {/* Position slots */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Position Slots ({gameData.numTeams} teams)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {["QB", "RB", "WR", "TE", "C"].map((pos) => (
                        <div key={pos} className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-xs font-semibold text-gray-600">{pos}</p>
                            <p className="text-lg font-bold text-gray-900">{gameData.positionSlots?.[pos] || 0}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action buttons */}
            {isCommissioner && (
                <div className="mb-8 flex gap-4 flex-col sm:flex-row">
                    {!gameTeams?.length && (
                        <button onClick={handleBuildTeams} className="btn-primary">
                            Build Teams
                        </button>
                    )}
                    {
                        gameTeams?.length && (
                        <button onClick={handleBuildTeams} className="btn-primary">
                            Re-Build Teams
                        </button>
                    )}
                    <Link to={`roster`} className="btn-primary text-center">
                        Enter Stats
                    </Link>
                    <Link to={`playboard`} className="btn-secondary text-center">
                        {isMobile ? "Playbook" : "Make a Play"}
                    </Link>
                </div>
            )}

            {!isCommissioner && (
                <div className="mb-8">
                    <Link to={`playboard`} className="btn-primary inline-block">
                        {isMobile ? "Playbook" : "Make a Play"}
                    </Link>
                </div>
            )}

            {/* Teams section */}
            {gameData.teams?.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Teams</h2>
                    <div className="space-y-6">
                        {gameData.teams.map((team, index) => (
                            <PageCard key={index} accentColor="teal">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    {team.name || `Team ${index + 1}`}
                                </h3>
                                <div className="space-y-2">
                                    {team.players.map((player) => (
                                        <div key={player.uid} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                            <div>
                                                <p className="font-medium text-gray-900">{player.displayName}</p>
                                                <p className="text-xs text-gray-500">{player.assignedPosition}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">
                                                {player.assignedOvr}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </PageCard>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}