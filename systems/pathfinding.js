// Pathfinding — BFS on the tile grid
// findPath(walkable, tileSize, startPx, startPy, goalPx, goalPy)
//   Returns array of { x, y } pixel waypoints (tile centers) from start to goal,
//   or null if no path exists. Inputs are pixel positions.

// Cells a path may cross: passable tiles that no solid prop's footprint touches.
// Coarser than movement (a prop closes every cell it touches) so a path never leads into one.
function walkableGrid(level, solidProps) {
    const grid = level.tiles.map(row => row.map(tile => level.passableTiles.includes(tile)));
    for (const p of solidProps) {
        const { c0, c1, r0, r1 } = boxCells(colliderBox(p), level.tileSize);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r][c] = false;
    }
    return grid;
}

function findPath(walkable, ts, startPx, startPy, goalPx, goalPy) {
    const cols = walkable[0].length;
    const rows = walkable.length;

    const sc = Math.floor(startPx / ts);
    const sr = Math.floor(startPy / ts);
    const gc = Math.floor(goalPx  / ts);
    const gr = Math.floor(goalPy  / ts);

    if (sc === gc && sr === gr) return [];

    // BFS — visited maps 'col,row' → parent 'col,row' (null for start)
    const visited  = new Map();
    const startKey = `${sc},${sr}`;
    visited.set(startKey, null);

    const queue = [[sc, sr]];
    const dirs  = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let found = false;

    outer:
    while (queue.length > 0) {
        const [c, r] = queue.shift();
        for (const [dc, dr] of dirs) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
            if (!walkable[nr][nc]) continue;
            const key = `${nc},${nr}`;
            if (visited.has(key)) continue;
            visited.set(key, `${c},${r}`);
            if (nc === gc && nr === gr) { found = true; break outer; }
            queue.push([nc, nr]);
        }
    }

    if (!found) return null;

    // Reconstruct path from goal back to start
    const path = [];
    let key = `${gc},${gr}`;
    while (key !== startKey) {
        const [c, r] = key.split(',').map(Number);
        path.unshift({ x: c * ts + ts / 2, y: r * ts + ts / 2 });
        key = visited.get(key);
    }
    return path;
}
