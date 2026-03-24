import { doc, getDoc, onSnapshot, collection } from "firebase/firestore"
import { db } from "../firebase"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
export default function LeagueDashboard() {
    const { leagueId } = useParams();
    const { currentUser, loading } = useAuth();
    const [leagueData, setLeagueData] = useState(null);
    const [games, setGames] = useState([]);

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
        }
        fetchLeague();
    }, []);
    if (loading) return <h1>Loading...</h1>
    if (!leagueData) return <h1>Loading...</h1>
    const isCommissioner = currentUser?.uid === leagueData?.commissionerId;
    return (
        <div>
            <h1>Welcome to {leagueData.name || "Your League"}</h1>
            <h3>{leagueData.sport} in {leagueData.location.city},{leagueData.location.state}</h3>

            <h3>There are {leagueData.memberUids.length} members</h3>
            {isCommissioner && <p>Invite Code: {leagueData.inviteCode}</p>}

            <h2>Games</h2>
            {games.length === 0 && <p>No games scheduled yet</p>}
            {games.map((game) => (
                <Link key={game.id} to={`/league/${leagueId}/games/${game.id}`}>
                    <p>{game.date} — {game.location.name} — {game.status}</p>
                </Link>
            ))}
            {isCommissioner && (
                <Link to={`/league/${leagueId}/games/create`}>Create Game</Link>
            )}


        </div>
    )
}