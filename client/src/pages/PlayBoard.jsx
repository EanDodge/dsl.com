//This Code was written by claude AI. I approved the code after reviewing
//Ean Dodge

import { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Image, Group, Circle, Text, Arrow, Line, Rect } from "react-konva";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ─── Canvas Dimensions ───────────────────────────────────────────────────────
let CANVAS_WIDTH = 900;
let CANVAS_HEIGHT = 520;

// ─── Team Colors ─────────────────────────────────────────────────────────────
const TEAM_COLORS = {
    0: "#e74c3c", // Team 1 — red
    1: "#3498db", // Team 2 — blue
    unassigned: "#27ae60", // No team — green
};

// ─── Starting Formation Positions ────────────────────────────────────────────
// Returns a list of {x, y} starting positions spread across the field.
// Team 1 starts on the bottom half, Team 2 on the top half.
function getStartingPositions(teamIndex, playerIndex, totalOnTeam) {
    const margin = 60;
    const usableWidth = CANVAS_WIDTH - margin * 2;
    const spacing = totalOnTeam > 1 ? usableWidth / (totalOnTeam - 1) : usableWidth / 2;
    const x = totalOnTeam > 1 ? margin + playerIndex * spacing : CANVAS_WIDTH / 2;
    const y = teamIndex === 0
        ? CANVAS_HEIGHT * 0.75  // Team 1 bottom
        : CANVAS_HEIGHT * 0.25; // Team 2 top
    return { x, y };
}

// ─── Get player initials from display name ───────────────────────────────────
function getInitials(name) {
    if (!name) return "?";
    return name.substring(0, 2)
    // const parts = name.trim().split(" ");
    // if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    // return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlayBoard() {
    const { leagueId, gameId } = useParams();
    const { currentUser, userProfile } = useAuth();

    // ── Canvas State ──
    const [fieldImage, setFieldImage] = useState(null);
    const [players, setPlayers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedPlayerUid, setSelectedPlayerUid] = useState(null);
    const [isDrawingRoute, setIsDrawingRoute] = useState(false);
    const [currentRoutePoints, setCurrentRoutePoints] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [canvasWidth, setCanvasWidth] = useState(900);
    const [canvasHeight, setCanvasHeight] = useState(520);
    const clickTimer = useRef(null);
    // ── Team visibility ──
    // showBothTeams: true = show all players, false = only show your team
    const [showBothTeams, setShowBothTeams] = useState(true);
    // Which team index belongs to the current user (0 or 1, null if unassigned)
    const [myTeamIndex, setMyTeamIndex] = useState(null);

    // ── Save/Load State ──
    const [savedPlays, setSavedPlays] = useState([]);
    const [playName, setPlayName] = useState("");
    const [saveStatus, setSaveStatus] = useState(""); // feedback message

    // ── Initial positions for reset ──
    const [initialPositions, setInitialPositions] = useState({});

    // ── Refs ──
    const stageRef = useRef(null);
    const containerRef = useRef(null);

    // ─── Load field image ──────────────────────────────────────────────────────
    useEffect(() => {
        const img = new window.Image();
        img.src = "/field.png";
        img.onload = () => setFieldImage(img);
        // If field.png doesn't exist, fieldImage stays null and we render
        // a green rectangle fallback instead.
    }, []);

    // ─── Responsive canvas sizing ──────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const handleResize = () => {
            const container = containerRef.current;
            if (!container) return;

            const maxWidth = Math.min(container.clientWidth - 4, window.innerWidth - 40);
            const aspectRatio = 900 / 520; // 16:9-ish
            const newWidth = Math.max(300, maxWidth);
            const newHeight = Math.round(newWidth / aspectRatio);

            // Scale player positions if width changed significantly
            const oldWidth = canvasWidth;
            const scaleFactor = newWidth / oldWidth;

            if (Math.abs(scaleFactor - 1) > 0.05) {
                // Only rescale if change is more than 5%
                setPlayers((prev) =>
                    prev.map((p) => ({
                        ...p,
                        x: Math.round(p.x * scaleFactor),
                        y: Math.round(p.y * (newHeight / canvasHeight)),
                    }))
                );
            }

            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        handleResize(); // Initial call

        return () => resizeObserver.disconnect();
    }, [canvasWidth, canvasHeight]);

    useEffect(() => {
        return () => {
            if (clickTimer.current) clearTimeout(clickTimer.current);
        };
    }, []);

    // ─── Load attending players from the game ────────────────────────────────
    useEffect(() => {
        if (!leagueId || !gameId) return;

        const loadPlayers = async () => {
            try {
                // 1. Fetch the game document
                const gameSnap = await getDoc(doc(db, "leagues", leagueId, "games", gameId));
                if (!gameSnap.exists()) return;
                const game = gameSnap.data();

                // 2. Get attending UIDs
                const attendingUids = Object.entries(game.attendance || {})
                    .filter(([, status]) => status === "attending")
                    .map(([uid]) => uid);

                if (attendingUids.length === 0) return;

                // 3. Fetch player documents from the league sub-collection
                const playerDocs = await Promise.all(
                    attendingUids.map((uid) =>
                        getDoc(doc(db, "leagues", leagueId, "players", uid))
                    )
                );

                // 4. Figure out team assignments from game.teams
                // game.teams = [{ name, players: [{uid, ...}] }, ...]
                const teamMap = {}; // uid -> teamIndex
                if (game.teams && game.teams.length > 0) {
                    game.teams.forEach((team, teamIndex) => {
                        (team.players || []).forEach((p) => {
                            teamMap[p.uid] = teamIndex;
                        });
                    });
                }

                // 5. Group players by team so we can calculate positions
                const teamGroups = {}; // teamIndex -> [uid, uid, ...]
                attendingUids.forEach((uid) => {
                    const tIdx = teamMap[uid] ?? "unassigned";
                    if (!teamGroups[tIdx]) teamGroups[tIdx] = [];
                    teamGroups[tIdx].push(uid);
                });

                // 6. Build player objects with starting positions
                const builtPlayers = [];
                const positions = {};

                Object.entries(teamGroups).forEach(([teamIndexStr, uids]) => {
                    const teamIndex = teamIndexStr === "unassigned" ? "unassigned" : parseInt(teamIndexStr);
                    uids.forEach((uid, playerIndex) => {
                        const playerSnap = playerDocs.find((d) => d.id === uid);
                        if (!playerSnap || !playerSnap.exists()) return;
                        const data = playerSnap.data();

                        // Starting position
                        const pos =
                            teamIndex === "unassigned"
                                ? { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
                                : getStartingPositions(teamIndex, playerIndex, uids.length);

                        const player = {
                            uid,
                            displayName: data.displayName || "Player",
                            initials: getInitials(data.displayName),
                            assignedPosition: data.assignedPosition || "",
                            teamIndex,
                            color:
                                teamIndex === "unassigned"
                                    ? TEAM_COLORS.unassigned
                                    : TEAM_COLORS[teamIndex] || TEAM_COLORS.unassigned,
                            x: pos.x,
                            y: pos.y,
                            visible: true,
                        };

                        builtPlayers.push(player);
                        positions[uid] = { x: pos.x, y: pos.y };
                    });
                });

                setPlayers(builtPlayers);
                setInitialPositions(positions);

                // 7. Determine which team the current user is on
                const myTeam = teamMap[currentUser?.uid];
                setMyTeamIndex(myTeam !== undefined ? myTeam : null);
            } catch (err) {
                console.error("Failed to load players:", err);
            }
        };

        loadPlayers();
    }, [leagueId, gameId, currentUser]);

    // ─── Load saved plays ─────────────────────────────────────────────────────
    const loadSavedPlays = useCallback(async () => {
        if (!leagueId) return;
        try {
            const snap = await getDocs(collection(db, "leagues", leagueId, "plays"));
            setSavedPlays(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("Failed to load plays:", err);
        }
    }, [leagueId]);

    useEffect(() => {
        loadSavedPlays();
    }, [loadSavedPlays]);

    // ─── Team Visibility Toggle ───────────────────────────────────────────────
    // When showBothTeams changes, update each player's visible flag.
    useEffect(() => {
        setPlayers((prev) =>
            prev.map((p) => ({
                ...p,
                visible: showBothTeams
                    ? true
                    : p.teamIndex === myTeamIndex || p.teamIndex === "unassigned",
            }))
        );
    }, [showBothTeams, myTeamIndex]);

    // ─── Handle player drag end ───────────────────────────────────────────────
    const handleDragEnd = (uid, x, y) => {
        setPlayers((prev) =>
            prev.map((p) => (p.uid === uid ? { ...p, x, y } : p))
        );
    };

    // ─── Handle canvas click (route drawing) ─────────────────────────────────
    const handleStageClick = (e) => {
        if (e.target !== e.target.getStage() && e.target.getParent()?.className === "Group") {
            return;
        }
        if (!isDrawingRoute || !selectedPlayerUid) return;

        // Clear any existing timer
        if (clickTimer.current) {
            // Second click came in fast enough — treat as double-click
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
            handleFinishRoute();
            return;
        }

        // First click — wait to see if a second comes
        clickTimer.current = setTimeout(() => {
            clickTimer.current = null;
            // Single click — add point
            const stage = stageRef.current;
            const pos = stage.getPointerPosition();
            if (pos) setCurrentRoutePoints((prev) => [...prev, pos.x, pos.y]);
        }, 250);  // 250ms window
    };

    // ─── Handle double-click to finish route ─────────────────────────────────
    const handleFinishRoute = () => {
        if (currentRoutePoints.length >= 4) {
            const selectedPlayer = players.find((p) => p.uid === selectedPlayerUid);
            if (selectedPlayer) {
                const fullPoints = [
                    selectedPlayer.x,
                    selectedPlayer.y,
                    ...currentRoutePoints,
                ];
                setRoutes((prev) => [
                    ...prev,
                    {
                        id: `route_${Date.now()}`,
                        playerUid: selectedPlayerUid,
                        points: fullPoints,
                        color: selectedPlayer.color,
                    },
                ]);
            }
        }
        setCurrentRoutePoints([]);
        setIsDrawingRoute(false);
    };

    // ─── Track mouse position for live route preview ──────────────────────────
    const handleMouseMove = (e) => {
        if (!isDrawingRoute) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (pos) setMousePos({ x: pos.x, y: pos.y });
    };

    // ─── Save play to Firestore ───────────────────────────────────────────────
    const handleSavePlay = async () => {
        if (!playName.trim()) {
            setSaveStatus("Please enter a play name.");
            return;
        }
        try {
            await addDoc(collection(db, "leagues", leagueId, "plays"), {
                name: playName.trim(),
                players: players.map(({ uid, x, y, teamIndex }) => ({ uid, x, y, teamIndex })),
                routes,
                createdBy: currentUser.uid,
                createdByName: userProfile?.displayName || "Unknown",
                createdAt: serverTimestamp(),
            });
            setPlayName("");
            setSaveStatus(`"${playName.trim()}" saved!`);
            await loadSavedPlays();
            setTimeout(() => setSaveStatus(""), 3000);
        } catch (err) {
            console.error("Save failed:", err);
            setSaveStatus("Save failed. Try again.");
        }
    };

    // ─── Load a saved play ────────────────────────────────────────────────────
    const handleLoadPlay = (play) => {
        // Restore positions from the saved play, keep other player data intact
        setPlayers((prev) =>
            prev.map((p) => {
                const saved = play.players.find((sp) => sp.uid === p.uid);
                return saved ? { ...p, x: saved.x, y: saved.y } : p;
            })
        );
        setRoutes(play.routes || []);
        setCurrentRoutePoints([]);
        setIsDrawingRoute(false);
    };

    // ─── Clear routes ─────────────────────────────────────────────────────────
    const handleClearRoutes = () => {
        setRoutes([]);
        setCurrentRoutePoints([]);
        setIsDrawingRoute(false);
    };

    // ─── Reset player positions ───────────────────────────────────────────────
    const handleReset = () => {
        setPlayers((prev) =>
            prev.map((p) => {
                const pos = initialPositions[p.uid];
                return pos ? { ...p, x: pos.x, y: pos.y } : p;
            })
        );
        setRoutes([]);
        setCurrentRoutePoints([]);
        setIsDrawingRoute(false);
        setSelectedPlayerUid(null);
    };

    // ─── Toggle route drawing mode ────────────────────────────────────────────
    const toggleDrawRoute = () => {
        if (!selectedPlayerUid && !isDrawingRoute) {
            setSaveStatus("Select a player first before drawing a route.");
            setTimeout(() => setSaveStatus(""), 3000);
            return;
        }
        setIsDrawingRoute((prev) => !prev);
        setCurrentRoutePoints([]);
    };

    // ─── Live route preview points ────────────────────────────────────────────
    // Shows a dashed line from the last placed point to the current mouse
    const getPreviewPoints = () => {
        if (currentRoutePoints.length < 2) return null;
        const lastX = currentRoutePoints[currentRoutePoints.length - 2];
        const lastY = currentRoutePoints[currentRoutePoints.length - 1];
        return [lastX, lastY, mousePos.x, mousePos.y];
    };

    const previewPoints = getPreviewPoints();
    const selectedPlayer = players.find((p) => p.uid === selectedPlayerUid);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: "sans-serif", padding: "12px", backgroundColor: "#1a1a2e", minHeight: "100vh", color: "#eee" }}>
            <h2 style={{ marginBottom: "10px", color: "#f0c040" }}>Play Board</h2>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
                {/* Draw Route */}
                <button
                    onClick={toggleDrawRoute}
                    style={{
                        padding: "6px 14px",
                        background: isDrawingRoute ? "#27ae60" : "#555",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    {isDrawingRoute ? "⏹ Stop Drawing" : "✏️ Draw Route"}
                </button>

                {/* Clear Routes */}
                <button
                    onClick={handleClearRoutes}
                    style={{ padding: "6px 14px", background: "#c0392b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    🗑 Clear Routes
                </button>

                {/* Reset */}
                <button
                    onClick={handleReset}
                    style={{ padding: "6px 14px", background: "#2980b9", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    ↺ Reset
                </button>

                {/* Save Play */}
                <input
                    placeholder="Play name..."
                    value={playName}
                    onChange={(e) => setPlayName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSavePlay()}
                    style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #555", background: "#2a2a3e", color: "#eee", width: "160px" }}
                />
                <button
                    onClick={handleSavePlay}
                    style={{ padding: "6px 14px", background: "#8e44ad", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    💾 Save Play
                </button>

                {/* Show Both Teams Toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
                    <input
                        type="checkbox"
                        checked={showBothTeams}
                        onChange={(e) => setShowBothTeams(e.target.checked)}
                        style={{ width: "16px", height: "16px" }}
                    />
                    Show Both Teams
                </label>
            </div>

            {/* ── Status / Hint ── */}
            {saveStatus && (
                <div style={{ marginBottom: "8px", color: "#f0c040", fontSize: "13px" }}>
                    {saveStatus}
                </div>
            )}
            {isDrawingRoute && (
                <div style={{ marginBottom: "8px", color: "#2ecc71", fontSize: "13px" }}>
                    Click on the field to place route points. Double-click to finish.
                </div>
            )}
            {!isDrawingRoute && selectedPlayerUid && (
                <div style={{ marginBottom: "8px", color: "#aaa", fontSize: "13px" }}>
                    Selected: <strong style={{ color: "#fff" }}>{selectedPlayer?.displayName}</strong> — click "Draw Route" to draw their route, or drag them on the field.
                </div>
            )}

            {/* ── Saved Plays List ── */}
            {savedPlays.length > 0 && (
                <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ color: "#aaa", fontSize: "13px", alignSelf: "center" }}>Load:</span>
                    {savedPlays.map((play) => (
                        <button
                            key={play.id}
                            onClick={() => handleLoadPlay(play)}
                            style={{
                                padding: "4px 10px",
                                background: "#2a2a3e",
                                color: "#f0c040",
                                border: "1px solid #444",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "13px",
                            }}
                        >
                            {play.name}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Canvas ── */}
            <div ref={containerRef} style={{ border: "2px solid #444", borderRadius: "6px", overflow: "hidden", maxWidth: "100%" }}>
                <Stage
                    width={canvasWidth}
                    height={canvasHeight}
                    ref={stageRef}
                    onClick={handleStageClick}
                    onMouseMove={handleMouseMove}
                    style={{ cursor: isDrawingRoute ? "crosshair" : "default" }}
                >
                    <Layer>
                        {/* ── Field Background ── */}
                        {fieldImage ? (
                            <Image image={fieldImage} width={canvasWidth} height={canvasHeight} />
                        ) : (
                            // Fallback: draw a simple green field with yard lines
                            <>
                                <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#2d6a2d" />
                                {/* Yard lines */}
                                {[...Array(9)].map((_, i) => {
                                    const x = (canvasWidth / 10) * (i + 1);
                                    return (
                                        <Line
                                            key={`yard_${i}`}
                                            points={[x, 0, x, canvasHeight]}
                                            stroke="rgba(255,255,255,0.15)"
                                            strokeWidth={1}
                                        />
                                    );
                                })}
                                {/* Line of scrimmage */}
                                <Line
                                    points={[0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2]}
                                    stroke="rgba(255,255,0,0.4)"
                                    strokeWidth={2}
                                    dash={[10, 6]}
                                />
                            </>
                        )}

                        {/* ── Saved Routes ── */}
                        {routes.map((route) => {
                            const routePlayer = players.find((p) => p.uid === route.playerUid);
                            if (routePlayer && !routePlayer.visible) return null;
                            return (
                                <Arrow
                                    key={route.id}
                                    points={route.points}
                                    stroke={route.color}
                                    strokeWidth={2.5}
                                    fill={route.color}
                                    pointerLength={10}
                                    pointerWidth={8}
                                    lineCap="round"
                                    lineJoin="round"
                                    opacity={0.85}
                                />
                            );
                        })}

                        {/* ── Route currently being drawn (placed points) ── */}
                        {isDrawingRoute && currentRoutePoints.length >= 2 && (
                            <Line
                                points={currentRoutePoints}
                                stroke={selectedPlayer?.color || "#fff"}
                                strokeWidth={2}
                                dash={[6, 4]}
                                lineCap="round"
                                opacity={0.7}
                            />
                        )}

                        {/* ── Live preview: last point to mouse cursor ── */}
                        {isDrawingRoute && previewPoints && (
                            <Line
                                points={previewPoints}
                                stroke={selectedPlayer?.color || "#fff"}
                                strokeWidth={1.5}
                                dash={[4, 6]}
                                opacity={0.4}
                            />
                        )}

                        {/* ── Player Tokens ── */}
                        {players.map((player) => {
                            if (!player.visible) return null;
                            const isSelected = player.uid === selectedPlayerUid;
                            return (
                                <Group
                                    key={player.uid}
                                    x={player.x}
                                    y={player.y}
                                    draggable={!isDrawingRoute}
                                    onClick={() => {
                                        setSelectedPlayerUid(player.uid);
                                        if (isDrawingRoute) {
                                            // Clicking a player while drawing finishes the route at their position
                                            setCurrentRoutePoints((prev) => [
                                                ...prev,
                                                player.x,
                                                player.y,
                                            ]);
                                        }
                                    }}
                                    onDragEnd={(e) =>
                                        handleDragEnd(player.uid, e.target.x(), e.target.y())
                                    }
                                >
                                    {/* Selection ring */}
                                    {isSelected && (
                                        <Circle
                                            radius={26}
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            fill="transparent"
                                            dash={[4, 3]}
                                        />
                                    )}
                                    {/* Token circle */}
                                    <Circle
                                        radius={20}
                                        fill={player.color}
                                        shadowColor="rgba(0,0,0,0.5)"
                                        shadowBlur={6}
                                        shadowOffsetY={2}
                                    />
                                    {/* Initials */}
                                    <Text
                                        text={player.initials}
                                        fill="#ffffff"
                                        fontSize={11}
                                        fontStyle="bold"
                                        offsetX={player.initials.length > 1 ? 8 : 4}
                                        offsetY={6}
                                    />
                                    {/* Position label below token */}
                                    {player.assignedPosition && (
                                        <Text
                                            text={player.assignedPosition}
                                            fill="rgba(255,255,255,0.8)"
                                            fontSize={9}
                                            offsetX={8}
                                            offsetY={-16}
                                        />
                                    )}
                                </Group>
                            );
                        })}
                    </Layer>
                </Stage>
            </div>

            {/* ── Legend ── */}
            <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: "13px", color: "#aaa" }}>
                {Object.entries(TEAM_COLORS).map(([key, color]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color }} />
                        {key === "unassigned" ? "No Team" : `Team ${parseInt(key) + 1}`}
                    </div>
                ))}
                <div style={{ marginLeft: "auto", color: "#666", fontSize: "12px" }}>
                    Drag tokens to move • Click to select • Draw Route to add arrows • Double-click to finish route
                </div>
            </div>
        </div>
    );
}