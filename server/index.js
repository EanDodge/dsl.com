import dotenv from "dotenv"

dotenv.config();

import express from "express"
import cors from "cors"
import helmet from "helmet"
import "./firebase-admin.js"
import leagueRoutes from "./routes/leagueRoutes.js"
import gameRoutes from "./routes/gameRoutes.js"


const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use("/api/leagues", leagueRoutes);
app.use("/api/leagues", gameRoutes);
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

