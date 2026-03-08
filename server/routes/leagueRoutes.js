import { Router } from "express"
import { verifyToken } from "../middleware/verifyToken.js"

const router = Router();

router.post("/", verifyToken, async (req, res) => {
    // create league — coming soon
    res.json({ message: "create league" });
});

router.post("/join", verifyToken, async (req, res) => {
    // join league — coming soon
    res.json({ message: "join league" });
});

export default router;