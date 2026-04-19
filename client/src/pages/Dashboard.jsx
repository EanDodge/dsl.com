import { collection, query, where, getDocs, getDoc } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react";
import { db } from "../firebase"
import { Link } from "react-router-dom"
import PageCard from "../components/PageCard"
import EmptyState from "../components/EmptyState"
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc, updateDoc, arrayRemove } from "firebase/firestore";
import ConfirmDialog from "../components/ConfirmDialog";


export default function Dashboard() {
    const { userProfile, loading, currentUser } = useAuth();
    const leagueIds = userProfile?.leagueIds || [];
    const [leagueList, setLeagueList] = useState([]);
    const [menuOpen, setMenuOpen] = useState(null);
    const [confirmDeleteLeague, setConfirmDeleteLeague] = useState({ open: false, leagueId: null, leagueName: "" });
    const [confirmLeaveLeague, setConfirmLeaveLeague] = useState({ open: false, leagueId: null, leagueName: "" });
    const nav = useNavigate();

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

    const handleEditLeague = (leagueId) => {
        nav(`/league/create?edit=${leagueId}`);
    };

    const handleLeaveLeague = async () => {
        const leagueId = confirmLeaveLeague.leagueId;
        if (!leagueId) return;
        try {
            await updateDoc(doc(db, 'leagues', leagueId), {
                memberUids: arrayRemove(currentUser.uid)
            });
            await updateDoc(doc(db, 'users', currentUser.uid), {
                leagueIds: arrayRemove(leagueId)
            });
            setLeagueList(prev => prev.filter(l => l.id !== leagueId));
        } catch (error) {
            console.error('Error leaving league:', error);
        } finally {
            setConfirmLeaveLeague({ open: false, leagueId: null, leagueName: "" });
        }
    };

    const handleDeleteLeague = async () => {
        const leagueId = confirmDeleteLeague.leagueId;
        if (!leagueId) return;

        try {
            const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
            if (!leagueDoc.exists()) return;
            const leagueData = leagueDoc.data();
            for (const uid of leagueData.memberUids || []) {
                await updateDoc(doc(db, 'users', uid), {
                    leagueIds: arrayRemove(leagueId)
                });
            }
            await deleteDoc(doc(db, 'leagues', leagueId));
            setLeagueList(prev => prev.filter(l => l.id !== leagueId));
        } catch (error) {
            console.error('Error deleting league:', error);
        } finally {
            setConfirmDeleteLeague({ open: false, leagueId: null, leagueName: "" });
        }
    };

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
                                <div key={league.id} className="relative">
                                    <Link to={`/league/${league.id}`} className="group">
                                        <PageCard accentColor="orange" className="h-full cursor-pointer hover:shadow-lg">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 transition-colors duration-150 group-hover:text-[#FF6B00]">
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
                                    <div className="absolute top-2 right-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpen(menuOpen === league.id ? null : league.id);
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            ⋮
                                        </button>
                                        {menuOpen === league.id && (
                                            <div className="absolute right-0 mt-1 min-w-[150px] bg-white border border-gray-200 rounded shadow-lg z-10">
                                                {currentUser?.uid === league.commissionerId ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditLeague(league.id);
                                                                setMenuOpen(null);
                                                            }}
                                                            className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                                                        >
                                                            Edit League
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDeleteLeague({ open: true, leagueId: league.id, leagueName: league.name });
                                                                setMenuOpen(null);
                                                            }}
                                                            className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                                                        >
                                                            Delete League
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmLeaveLeague({ open: true, leagueId: league.id, leagueName: league.name });
                                                            setMenuOpen(null);
                                                        }}
                                                        className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                                                    >
                                                        Leave League
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
            <ConfirmDialog
                open={confirmDeleteLeague.open}
                title="Delete League"
                message={`Are you sure you want to delete ${confirmDeleteLeague.leagueName}? This action cannot be undone.`}
                confirmLabel="Delete League"
                cancelLabel="Cancel"
                danger
                onConfirm={handleDeleteLeague}
                onCancel={() => setConfirmDeleteLeague({ open: false, leagueId: null, leagueName: "" })}
            />
            <ConfirmDialog
                open={confirmLeaveLeague.open}
                title="Leave League"
                message={`Are you sure you want to leave ${confirmLeaveLeague.leagueName}?`}
                confirmLabel="Leave League"
                cancelLabel="Cancel"
                danger
                onConfirm={handleLeaveLeague}
                onCancel={() => setConfirmLeaveLeague({ open: false, leagueId: null, leagueName: "" })}
            />
        </div>
    )
}
