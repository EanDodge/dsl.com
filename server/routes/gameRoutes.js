import { Router } from "express"
import { verifyToken } from "../middleware/verifyToken.js"
import admin from "firebase-admin"
import { db } from "../firebase-admin.js"
import { buildTeams } from "../services/teamBuilder.js"
import { calculateOverall, getCumulativeStats, calculateOverallFromScratch } from "../services/overallCalculator.js"
const router = Router();

router.post("/:leagueId/games", verifyToken, async (req, res) => {
    try {
        const { date, time, location, numTeams, positionSlots } = req.body;
        const uid = req.user.uid;
        const { leagueId } = req.params;
        const leagueSnap = await db.collection("leagues").doc(leagueId).get();
        if (!leagueSnap.exists) return res.status(404).json({ error: "Bad LeagueID" });

        const isCommissioner = uid === leagueSnap.data().commissionerId;
        if (!isCommissioner) return res.status(403).json({ error: "Not authorized" });

        const memberUids = leagueSnap.data().memberUids;
        const attendance = {};
        memberUids.forEach(memberId => {
            attendance[memberId] = "pending";
        });
        const data = {
            date,
            time,
            location: {
                name: location.name,
                embeddedMap: location.embeddedMap
            },
            numTeams,
            positionSlots,
            status: "Upcoming",
            attendance: attendance,
            teams: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            commissionerId: uid
        }
        const ref = await db.collection("leagues").doc(leagueId).collection("games").add(data);

        res.json({ gameId: ref.id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create Game" });
    }

});

router.put("/:leagueId/games/:gameId/attendance", verifyToken, async (req, res) => {
    try {
        const { uid, status } = req.body;
        const { leagueId, gameId } = req.params;
        const snapShot = await db.collection("leagues").doc(leagueId).get();
        if (!snapShot.exists) return res.status(403).json({ error: "Bad LeagueID" });
        const isCommissioner = req.user.uid === snapShot.data().commissionerId;

        if (uid !== req.user.uid && !isCommissioner) {
            return res.status(403).json({ error: "Not authorized" });
        }
        await db.collection("leagues").doc(leagueId)
            .collection("games").doc(gameId)
            .update({
                [`attendance.${uid}`]: status
            });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to Join Game" });
    }

});

router.post("/:leagueId/games/:gameId/build-teams", verifyToken, async (req, res) => {
    try {
        const { leagueId, gameId } = req.params;
        const uid = req.user.uid;
        const leagueSnap = await db.collection("leagues").doc(leagueId).get();
        if (!leagueSnap.exists) return res.status(404).json({ error: "Bad LeagueID" });
        const isCommissioner = req.user.uid === leagueSnap.data().commissionerId;
        if (!isCommissioner) return res.status(403).json({ error: "Not authorized" });
        const snapShot = await db.collection("leagues").doc(leagueId).collection("games").doc(gameId).get();
        if (!snapShot.exists) return res.status(403).json({ error: "Bad gameId" });
        const game = snapShot.data();
        const attendance = game.attendance;

        const attendingUids = Object.entries(attendance)
            .filter(([uid, status]) => status === "attending")
            .map(([uid]) => uid);

        const playerDocs = await Promise.all(
            attendingUids.map(uid =>
                db.collection("leagues").doc(leagueId).collection("players").doc(uid).get()
            )
        );
        const players = playerDocs.map(doc => doc.data()).filter(Boolean);
        const newTeams = buildTeams(players, game.numTeams, game.positionSlots);
        await db.collection("leagues").doc(leagueId)
            .collection("games").doc(gameId)
            .update({
                teams: newTeams
            });


        res.json({ newTeams });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to build teams" });
    }
});
router.post("/:leagueId/games/:gameId/stats", verifyToken, async (req, res) => {
    try {

        const { leagueId, gameId } = req.params;
        const playerStats = req.body.playerStats;
        const leagueSnap = await db.collection("leagues").doc(leagueId).get();
        if (!leagueSnap.exists) return res.status(404).json({ error: "Bad LeagueID" });
        const isCommissioner = req.user.uid === leagueSnap.data().commissionerId;
        if (!isCommissioner) return res.status(403).json({ error: "Not authorized" });
        const snapShot = await db.collection("leagues").doc(leagueId).collection("games").doc(gameId).get();
        if (!snapShot.exists) return res.status(403).json({ error: "Bad gameId" });
        const game = snapShot.data();

        await db.collection("leagues").doc(leagueId)
            .collection("games").doc(gameId)
            .update({ playerStats });

        const allUids = [...new Set([
            ...Object.keys(playerStats),
            ...Object.keys(game.attendance)
        ])];

        // 4. for each player, fetch current overall, calculate contribution, update
        await Promise.all(allUids.map(async (uid) => {
            const playerSnap = await db.collection("leagues").doc(leagueId)
                .collection("players").doc(uid).get();

            if (!playerSnap.exists) return;  // skip if player not found

            const currentOverall = playerSnap.data().overall || 60;
            const stats = playerStats[uid] || {};  // empty stats if none submitted
            const attended =  game.attendance[uid] === "attending";
            const statWeights = leagueSnap.data().statWeights || {};
            const contribution = calculateOverall(stats, attended, statWeights);
            const newOverall = Math.min(99, Math.max(40, currentOverall + contribution));

            await db.collection("leagues").doc(leagueId)
                .collection("players").doc(uid)
                .update({ overall: newOverall });
        }));




        res.json({ status: "Success" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to Save stats" });
    }
});

router.delete("/:leagueId/games/:gameId/stats", verifyToken, async (req, res) => {
    try {
        const { leagueId, gameId } = req.params;
        const leagueSnap = await db.collection("leagues").doc(leagueId).get();
        if (!leagueSnap.exists) return res.status(404).json({ error: "Bad LeagueID" });
        const isCommissioner = req.user.uid === leagueSnap.data().commissionerId;
        if (!isCommissioner) return res.status(403).json({ error: "Not authorized" });
        const snapShot = await db.collection("leagues").doc(leagueId).collection("games").doc(gameId).get();
        if (!snapShot.exists) return res.status(403).json({ error: "Bad gameId" });
        const game = snapShot.data();
        const memberUids = leagueSnap.data().memberUids;
        const statWeights = leagueSnap.data().statWeights || {};
        await db.collection("leagues").doc(leagueId)
            .collection("games").doc(gameId)
            .update({ playerStats: {} });
        const games = await db.collection("leagues").doc(leagueId)
            .collection("games").get();
        const otherGames = games.docs
            .filter(d => d.id !== gameId)
            .map(d => ({ id: d.id, ...d.data() }));
        // console.log("Clearing game:", gameId);
        // console.log("All game IDs:", games.docs.map(d => d.id));
        await Promise.all(memberUids.map(async (uid) => {
            const playerSnap = await db.collection("leagues").doc(leagueId)
                .collection("players").doc(uid).get();
            if (!playerSnap.exists) return;

            const cumulative = getCumulativeStats(uid, otherGames);
            const newOverall = calculateOverallFromScratch(cumulative, statWeights);

            await db.collection("leagues").doc(leagueId)
                .collection("players").doc(uid)
                .update({ overall: newOverall });
        }));

        res.json({ status: "Success" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to Clear Stats" });
    }
});



export default router;