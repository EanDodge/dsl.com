import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
import { db } from "../firebase"
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function LeagueSettings() {
    const { leagueId } = useParams();
    const { loading, currentUser } = useAuth();
    const [leagueData, setLeagueData] = useState(null);
    const [statWeights, setStatWeights] = useState(
        {
            passingTDs: 3,
            receivingTDs: 3,
            rushingTDs: 3,
            defensiveTDs: 3,
            defensiveTurnovers: 2,
            offensiveTurnovers: -2,
            mvp: 5,
            gameActive: 1,
            missedGame: -1
        });
    const [compareStat, setCompare] = useState(
        {
            passingTDs: 3,
            receivingTDs: 3,
            rushingTDs: 3,
            defensiveTDs: 3,
            defensiveTurnovers: 2,
            offensiveTurnovers: -2,
            mvp: 5,
            gameActive: 1,
            missedGame: -1
        });
    useEffect(() => {
        const getStats = async () => {
            const snapShot = await getDoc(doc(db, "leagues", leagueId));
            if ((snapShot).exists()) {
                const leagueState = snapShot.data();
                setLeagueData(leagueState);
                const leagueStats = leagueState.statWeights;
                if (leagueStats) {
                    setStatWeights(leagueStats);
                    setCompare(leagueStats);
                }
                else
                    await updateDoc(doc(db, "leagues", leagueId), { statWeights });
            }
            else{
                    nav("/not-found");
                    return;
                }
        }
        getStats();
    }, []);
    const handleChange = (e) => {
        setStatWeights({ ...statWeights, [e.target.name]: parseFloat(e.target.value) })
    }

    const handleSave = async () => {
        await updateDoc(doc(db, "leagues", leagueId), { statWeights });
        setCompare(statWeights);  // ← reset compare so isDirty becomes false
    }

    if (loading || !leagueData) return <h1>Loading...</h1>
    const isComissioner = currentUser?.uid === leagueData?.commissionerId;
    if (!isComissioner) return <h1>This is for Comissioner's eyes only</h1>
    const isDirty = JSON.stringify(statWeights) !== JSON.stringify(compareStat);
    return (
        <div>
            <h1>Game Settings</h1>
            <div>
                <h2>Stat Weights</h2>
                <span>Passing Touchdowns:
                    <input name="passingTDs" type="number" value={statWeights.passingTDs} onChange={handleChange} /></span>
                <span>Recieving Touchdowns:
                    <input name="receivingTDs" type="number" value={statWeights.receivingTDs} onChange={handleChange} /></span>
                <span>Rushing Touchdowns:
                    <input name="rushingTDs" type="number" value={statWeights.rushingTDs} onChange={handleChange} /></span>
                <span>Defensive Touchdowns:
                    <input name="defensiveTDs" type="number" value={statWeights.defensiveTDs} onChange={handleChange} /></span>
                <span>Defensive Turnover:
                    <input name="defensiveTurnovers" type="number" value={statWeights.defensiveTurnovers} onChange={handleChange} /></span>
                <span>Offensive Turnover:
                    <input name="offensiveTurnovers" type="number" value={statWeights.offensiveTurnovers} onChange={handleChange} /></span>
                <span>MVP Game:
                    <input name="mvp" type="number" value={statWeights.mvp} onChange={handleChange} /></span>
                <span>Active Game:
                    <input name="gameActive" type="number" value={statWeights.gameActive} onChange={handleChange} /></span>
                <span>Missed Game:
                    <input name="missedGame" type="number" value={statWeights.missedGame} onChange={handleChange} /></span>
            </div>
            {isDirty && <button onClick={handleSave}>Save</button>}
        </div>
    )

}