export function calculateOverall(stats, attended, weights) {
    let contribution = 0;
    contribution += (stats.passingTDs || 0) * (weights.passingTDs ?? 3);
    contribution += (stats.receivingTDs || 0) * (weights.receivingTDs ?? 3);
    contribution += (stats.rushingTDs || 0) * (weights.rushingTDs ?? 3);
    contribution += (stats.defensiveTDs || 0) * (weights.defensiveTDs ?? 3);
    contribution += (stats.defensiveTurnovers || 0) * (weights.defensiveTurnovers ?? 2);
    contribution -= (stats.offensiveTurnovers || 0) * Math.abs(weights.offensiveTurnovers ?? 2);
    contribution += stats.mvp ? (weights.mvp ?? 5) : 0;
    contribution += attended ? (weights.gameActive ?? 1) : (weights.missedGame ?? -1) * -1;
    return contribution;
}
export function getCumulativeStats(uid, games) {
    let cumulative = {
        passingTDs: 0,
        receivingTDs: 0,
        rushingTDs: 0,
        defensiveTDs: 0,
        defensiveTurnovers: 0,
        offensiveTurnovers: 0,
        mvp: 0,  // count of MVPs
        gamesActive: 0,
        missedGames: 0
    };

    games.forEach(game => {
        // attendance
        const status = game.attendance?.[uid];
        if (status === "attending") cumulative.gamesActive++;
        else cumulative.missedGames++;

        // stats
        const stats = game.playerStats?.[uid];
        if (stats) {
            cumulative.passingTDs += stats.passingTDs || 0;
            cumulative.receivingTDs += stats.receivingTDs || 0;
            cumulative.rushingTDs += stats.rushingTDs || 0;
            cumulative.defensiveTDs += stats.defensiveTDs || 0;
            cumulative.defensiveTurnovers += stats.defensiveTurnovers || 0;
            cumulative.offensiveTurnovers += stats.offensiveTurnovers || 0;
            if (stats.mvp) cumulative.mvp++;
        }
    });

    return cumulative;
}
export function calculateOverallFromScratch(cumulativeStats, weights) {
    const w = weights || {};
    let overall = 60;
    overall += cumulativeStats.passingTDs * (w.passingTDs ?? 3);
    overall += cumulativeStats.receivingTDs * (w.receivingTDs ?? 3);
    overall += cumulativeStats.rushingTDs * (w.rushingTDs ?? 3);
    overall += cumulativeStats.defensiveTDs * (w.defensiveTDs ?? 3);
    overall += cumulativeStats.defensiveTurnovers * (w.defensiveTurnovers ?? 2);
    overall -= cumulativeStats.offensiveTurnovers * Math.abs(w.offensiveTurnovers ?? 2);
    overall += cumulativeStats.mvp * (w.mvp ?? 5);
    overall += cumulativeStats.gamesActive * (w.gamesActive ?? 1);
    overall -= cumulativeStats.missedGames * Math.abs(w.missedGame ?? 1);
    return Math.min(99, Math.max(40, overall));
}