export function getAdjustedOverall(player, position) {
    if (player.position1 === position) return player.overall;
    if (player.position2 === position) return player.overall - 5;
    if (player.position3 === position) return player.overall - 8;
    return player.overall - 10;
}

export function getBestForPosition(players, position) {
    let highestOvr = 0;
    let returnPlayer = null;
    players.forEach((player) => {
        const playerOvr = getAdjustedOverall(player, position);
        if (playerOvr === highestOvr) {
            if (Math.random() > 0.5) {
                returnPlayer = player;
                highestOvr = playerOvr;
            }
        } else if (playerOvr > highestOvr) {
            returnPlayer = player;
            highestOvr = playerOvr;
        }
    });
    return returnPlayer; 
}

export function getBestPrimaryPosition(players, position) {
    let highestOvr = 0;
    let returnPlayer = null;
    players.forEach((player) => {
        if (player.position1 === position) {
            const playerOvr = player.overall;
            if (playerOvr === highestOvr) {
                if (Math.random() > 0.5) {
                    returnPlayer = player;
                    highestOvr = playerOvr;
                }
            } else if (playerOvr > highestOvr) {
                returnPlayer = player;
                highestOvr = playerOvr;
            }
        }
    });
    return returnPlayer; 
}

export function getBestPick(players, positions) {
    let highestOvr = 0;
    let returnPlayer = null;
    let forPosition = null;  

    positions.forEach((position) => {
        let currentPlayer = getBestPrimaryPosition(players, position);
        let currentOvr = currentPlayer ? currentPlayer.overall : 0;

        if (!currentPlayer) {
            currentPlayer = getBestForPosition(players, position);
            currentOvr = currentPlayer 
                ? getAdjustedOverall(currentPlayer, position) 
                : 0;
        }

        if (!currentPlayer) return; 

        if (currentOvr === highestOvr && Math.random() > 0.5) {
            returnPlayer = currentPlayer; 
            highestOvr = currentOvr;      
            forPosition = position;
        } else if (currentOvr > highestOvr) {
            returnPlayer = currentPlayer;  
            highestOvr = currentOvr;      
            forPosition = position;
        }
    });

    return { returnPlayer, forPosition };  
}

export function buildTeams(players, numTeams, positionSlots) {
    const teams = Array.from({ length: numTeams }, (_, i) => ({
        name: `Team ${i + 1}`,
        players: []
    }));

    const teamSlots = Array.from({ length: numTeams }, () => []);  // fixed
    for (let i = 0; i < numTeams; i++) {
        Object.entries(positionSlots).forEach(([position, count]) => {
            for (let j = 0; j < count; j++) {  
                teamSlots[i].push(position);
            }
        });
    }

    let available = [...players];


    const numOfPicks = teamSlots[0].length * numTeams; 

    for (let i = 0; i < numOfPicks; i++) {
        const round = Math.floor(i / numTeams);  
        const positionInRound = i % numTeams;    
        const teamIndex = round % 2 === 0
            ? positionInRound
            : (numTeams - 1) - positionInRound;

        if (teamSlots[teamIndex].length === 0) continue;  

        const { returnPlayer, forPosition } = getBestPick(available, teamSlots[teamIndex]);

        if (!returnPlayer) continue;

        teams[teamIndex].players.push({ 
            ...returnPlayer, 
            assignedPosition: forPosition ,
            assignedOvr: getAdjustedOverall(returnPlayer, forPosition)
        });
        available = available.filter(p => p.uid !== returnPlayer.uid);

        const slotIndex = teamSlots[teamIndex].indexOf(forPosition);
        if (slotIndex !== -1) teamSlots[teamIndex].splice(slotIndex, 1);
    }

    return teams;
}