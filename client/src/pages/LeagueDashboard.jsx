import { doc, getDoc, onSnapshot, collection } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import PageCard from "../components/PageCard"

export default function LeagueDashboard() {
    const { leagueId } = useParams();
    const { currentUser, loading } = useAuth();
    const [leagueData, setLeagueData] = useState(null);
    const [games, setGames] = useState([]);
    const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "leagues", leagueId, "games"),
            (snap) => {
                setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        );
        return unsubscribe;
    }, []);
    useEffect(() => {
        const fetchLeague = async () => {
            const userSnap = await getDoc(doc(db, "leagues", leagueId));
            if (userSnap.exists()) {
                setLeagueData(userSnap.data());
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        fetchLeague();
    }, []);

    const handleCopyInviteCode = async () => {
        if (leagueData?.inviteCode) {
            const inviteLink = `${window.location.origin}/league/join?code=${leagueData.inviteCode}`;
            await navigator.clipboard.writeText(inviteLink);
            setInviteCodeCopied(true);
            setTimeout(() => setInviteCodeCopied(false), 2000);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    if (!leagueData) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>
    const isCommissioner = currentUser?.uid === leagueData?.commissionerId;

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{leagueData.name}</h1>
                <p className="text-gray-600">
                    {leagueData.sport} • {leagueData.location.city}, {leagueData.location.state} • {leagueData.memberUids?.length || 0} member{leagueData.memberUids?.length !== 1 ? 's' : ''}
                </p>
            </div>

            {isCommissioner && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Invite Code</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded font-mono text-sm text-gray-700">
                            {leagueData.inviteCode}
                        </code>
                        <button
                            onClick={handleCopyInviteCode}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            {inviteCodeCopied ? "Copied!" : "Copy Link"}
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Games</h2>
                {games.length === 0 ? (
                    <p className="text-gray-500">No games scheduled yet.</p>
                ) : (
                    <div className="space-y-3">
                        {games.map((game) => (
                            <Link key={game.id} to={`games/${game.id}`} className="block">
                                <PageCard accentColor="teal" className="cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {new Date(game.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </h3>
                                            <p className="text-sm text-gray-600">{game.time || 'TBD'} • {game.location?.name}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            game.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                            game.status === 'active' ? 'bg-green-100 text-green-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {game.status || 'upcoming'}
                                        </span>
                                    </div>
                                    {game.attendance && (
                                        <p className="text-xs text-gray-500 mt-3">
                                            {Object.values(game.attendance).filter(s => s === 'attending').length} attending •{' '}
                                            {Object.values(game.attendance).filter(s => s === 'pending').length} pending
                                        </p>
                                    )}
                                </PageCard>
                            </Link>
                        ))}
                    </div>
                )}
                {isCommissioner && (
                    <div className="mt-4">
                        <Link to={`games/create`} className="btn-primary inline-block">
                            Create Game
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}