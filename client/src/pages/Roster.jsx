import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, arrayRemove, deleteDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";

import { getDoc } from "firebase/firestore";

export default function Roster() {
  const { leagueId } = useParams();
  const { loading, currentUser } = useAuth();
  const [players, setPlayers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [confirmKick, setConfirmKick] = useState({ open: false, playerId: null, playerName: '' });
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const snap = await getDocs(collection(db, "leagues", leagueId, "players"));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.overall || 0) - (a.overall || 0));
      setPlayers(docs);
    };
    fetchPlayers();
  }, [leagueId]);

  useEffect(() => {
    const fetchLeague = async () => {
      const s = await getDoc(doc(db, 'leagues', leagueId));
      if (s.exists()) setIsCommissioner(s.data().commissionerId === currentUser?.uid);
    };
    fetchLeague();
  }, [leagueId, currentUser]);

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>

  const handleRemove = async () => {
    const playerId = confirmKick.playerId;
    if (!playerId) return;
    try {
      // remove attendance from all games
      const gamesSnap = await getDocs(collection(db, 'leagues', leagueId, 'games'));
      await Promise.all(gamesSnap.docs.map(gameDoc =>
        updateDoc(doc(db, 'leagues', leagueId, 'games', gameDoc.id), {
          [`attendance.${playerId}`]: deleteField()
        }).catch(() => {})
      ));
    } catch (err) {
      // ignore for now
    }
    try {
      // remove from league member list
      await updateDoc(doc(db, 'leagues', leagueId), { memberUids: arrayRemove(playerId) });
      // remove player's league doc
      await deleteDoc(doc(db, 'leagues', leagueId, 'players', playerId));
      // remove league from user doc if exists
      await updateDoc(doc(db, 'users', playerId), { leagueIds: arrayRemove(leagueId) }).catch(() => {});
      // update local list
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmKick({ open: false, playerId: null, playerName: '' });
    }
  };

    return (
    <div className="pt-20 pb-8 px-4 md:px-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">League Roster</h1>
      <div className="space-y-3">
        {players.map(player => (
          <Link
            key={player.id}
            to={`/profile?user=${player.id}`}
            className="block"
          >
            <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{player.displayName}</div>
                <div className="text-xs text-gray-500">Overall: {player.overall ?? '—'}</div>
              </div>

              <div
                className="relative"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === player.id ? null : player.id); }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="p-2 hover:bg-gray-100 rounded text-lg"
                  aria-label={`Open menu for ${player.displayName}`}
                >
                  ⋮
                </button>
                {menuOpen === player.id && (
                  <div className="absolute right-0 mt-1 min-w-[200px] bg-white border rounded shadow z-10">
                    {isCommissioner ? (
                      <button onClick={async () => { setConfirmKick({ open: true, playerId: player.id, playerName: player.displayName }); setMenuOpen(null); }} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600">Remove from League</button>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">Only the commissioner can remove players</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <ConfirmDialog
        open={confirmKick.open}
        title="Remove Player"
        message={`Are you sure you want to remove ${confirmKick.playerName} from the league?`}
        confirmLabel="Remove Player"
        cancelLabel="Cancel"
        danger
        onConfirm={handleRemove}
        onCancel={() => setConfirmKick({ open: false, playerId: null, playerName: '' })}
      />
    </div>
  );
}
