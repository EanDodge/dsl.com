import { collection, query, where,getDocs } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react";
import { db } from "../firebase"
import { Link } from "react-router-dom"
import PageCard from "../components/PageCard"
import EmptyState from "../components/EmptyState"


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

    if (loading || !userProfile) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>

    return (
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome, {userProfile?.displayName}!</h1>
                <p className="text-gray-500">Manage your leagues and find new ones to join.</p>
            </div>

            {leagueList.length === 0 ? (
                <div className="mb-12">
                    <EmptyState
                        icon="⚽"
                        heading="No leagues yet"
                        description="Create a new league or join an existing one to get started."
                        actionBar={
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <Link to="/league/create" className="btn-primary text-center">
                                    Create League
                                </Link>
                                <Link to="/league/join" className="btn-secondary text-center">
                                    Join League
                                </Link>
                            </div>
                        }
                    />
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Leagues</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {leagueList.map((league) => (
                                <Link key={league.id} to={`/league/${league.id}`} className="group">
                                    <PageCard accentColor="orange" className="h-full cursor-pointer hover:shadow-lg">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1 transition-colors" style={{ "--tw-text-opacity": "1" }} onMouseEnter={(e) => e.target.style.color = "#FF6B00"} onMouseLeave={(e) => e.target.style.color = "inherit"}>
                                            {league.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {league.sport} • {league.location.city}, {league.location.state}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {league.memberUids?.length || 0} member{league.memberUids?.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </PageCard>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 flex-col sm:flex-row">
                        <Link to="/league/create" className="btn-primary text-center">
                            Create New League
                        </Link>
                        <Link to="/league/join" className="btn-secondary text-center">
                            Join Another League
                        </Link>
                    </div>
                </>
            )}
        </div>
    )



}