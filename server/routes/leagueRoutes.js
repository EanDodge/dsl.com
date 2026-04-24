import { Router } from "express"
import { verifyToken } from "../middleware/verifyToken.js"
import crypto from "crypto"
import admin from "firebase-admin"
import { db } from "../firebase-admin.js"

const router = Router();

router.post("/", verifyToken, async (req, res) => {
    try {
        const { name, sport, location } = req.body;
        const uid = req.user.uid;
        let inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        let snapshot = await db.collection("leagues")
            .where("inviteCode", "==", inviteCode)
            .limit(1)
            .get();

        while (!snapshot.empty) { //If it is already in the database somewhere, get a new one
            inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
            snapshot = await db.collection("leagues")
                .where("inviteCode", "==", inviteCode)
                .limit(1)
                .get();
        }
        const data = {
            name,
            sport,
            location: {
                city: location.city,
                state: location.state
            },
            commissionerId: uid,
            inviteCode,
            memberUids: [uid],
            captainUids: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
        const ref = await db.collection("leagues").add(data);
        const leagueId = ref.id; 
        await db.collection("users").doc(uid).update({
            leagueIds: admin.firestore.FieldValue.arrayUnion(leagueId)
        });
        res.json({ leagueId: ref.id, inviteCode });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create league" });
    }

});
router.post("/join", verifyToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const uid = req.user.uid;
        const snapshot = await db.collection("leagues")
            .where("inviteCode", "==", inviteCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "Invalid invite code" });
        }
        const leagueDoc = snapshot.docs[0];
        const leagueId = leagueDoc.id;

        await db.collection("leagues").doc(leagueId).update({
            memberUids: admin.firestore.FieldValue.arrayUnion(uid)
        });
        await db.collection("leagues").doc(leagueId)
            .collection("players").doc(uid).set({
                uid,
                displayName: req.user.name || "",
                position1: "",
                position2: "",
                position3: "",
                overall: 60,
                teamId: null,
                status: "active"
            });
        await db.collection("users").doc(uid).update({
            leagueIds: admin.firestore.FieldValue.arrayUnion(leagueId)
        });
        res.json({ leagueId: leagueId });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to Join league" });
    }
});


router.put("/:leagueId", verifyToken, async (req, res) => {
    try {
        const { leagueId } = req.params;
        const { name, sport, location } = req.body;
        const uid = req.user.uid;
        const leagueDoc = await db.collection("leagues").doc(leagueId).get();
        if (!leagueDoc.exists) return res.status(404).json({ error: "League not found" });
        if (leagueDoc.data().commissionerId !== uid) return res.status(403).json({ error: "Only commissioner can edit" });
        await db.collection("leagues").doc(leagueId).update({
            name,
            sport,
            location
        });
        res.json({ message: "League updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to update league" });
    }
});


router.put("/:leagueId/games/:gameId", verifyToken, async (req, res) => {
    try {
        const { leagueId, gameId } = req.params;
        const uid = req.user.uid;
        const leagueDoc = await db.collection("leagues").doc(leagueId).get();
        if (!leagueDoc.exists) return res.status(404).json({ error: "League not found" });
        if (leagueDoc.data().commissionerId !== uid) return res.status(403).json({ error: "Only commissioner can edit" });
        
        const gameDoc = await db.collection("leagues").doc(leagueId).collection("games").doc(gameId).get();
        if (!gameDoc.exists) return res.status(404).json({ error: "Game not found" });
        
        await db.collection("leagues").doc(leagueId).collection("games").doc(gameId).update(req.body);
        res.json({ message: "Game updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to update game" });
    }
});

export default router;