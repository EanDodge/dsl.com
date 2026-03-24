import { collection, query, where,getDocs } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react";
import { db } from "../firebase"
import { Link } from "react-router-dom"


export default function Dashboard() {
    const { userProfile, loading } = useAuth();
    const leagueIds = userProfile?.leagueIds || [];
    const [leagueList, setLeagueList] = useState([]);

    useEffect(() => {
    if (!userProfile?.leagueIds?.length) return;
    const getLeagues = async () => {
        const q = query(
            collection(db, "leagues"),
            where("__name__", "in", userProfile.leagueIds)
        );
        const snapshot = await getDocs(q);
        setLeagueList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    getLeagues();
}, [userProfile?.leagueIds]);

    if (loading || !userProfile) return <h1>Loading...</h1>
    return (
        <div>
            <h1>Welcome To DodgeSportsLeagues, {userProfile?.displayName}!</h1>
            {leagueList.length === 0 && <p>You have not joined any leagues yet</p>}
            {leagueList.length > 0 && leagueList.map((league) => (
                <Link key={league.id} to={`/league/${league.id}`}>
                    <h2>{league.name}</h2>
                    <h3>{league.sport} — {league.location.city}, {league.location.state}</h3>
                </Link>))}
            <Link to="/league/create">Create Your Own League</Link>
            <Link to="/league/join">Join a League</Link>

        </div>
    )



}