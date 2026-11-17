// Autotiling — picks each cell's 32px art tile from the terrain at its four corners.
// Outdoor corners come from the cells around them. Buildings lay their kit's floor over their
// rectangle (maps/buildingkit.js draws their walls).
// Plain grass draws one of the grass variants and mirrors left-right on half the cells (both
// fixed by cellHash) to break up the repeat; dry lawn spreads under the trees and gravel over
// a vacant lot, each inside a margin of grass (spreadCorners).
// Collision is untouched: it still reads the cell grid.

// Cell tile index → outdoor terrain letter. Building cells read as grass underneath (their
// ring keeps the outdoor ground); so do tree cells, where a tree prop stands (entities/props.js),
// and gravel cells, whose own corners spread over them inside a grass margin (spreadCorners).
// Built ground (stairs, pavers, railway) reads as path to its neighbours, so grass meets it
// through the grass↔path edge.
const TERRAIN_LETTERS = ['g', 'p', 'g', 'g', 'g', 'w', 'g', 'p', 'p', 'p', 'g', 'w', 'w', 'p'];

// Built ground draws one flat tile per kind, no transitions of its own (tileset-meta/ground.json)
const GROUND_TILES = {
    image: 'sprites/tiles_ground.png', seasons: ['winter', 'snow'],
    tiles: {
        [params.TILES.STAIR]:  [0, 0],    // flights run north-south, treads across
        [params.TILES.PAVERS]: [32, 0],
        [params.TILES.RAIL]:   [64, 0],   // track runs east-west
    },
};

// The street's asphalt (Cascade Avenue, layout 3.2) draws from the curb sets (TILESETS curbN,
// against the north sidewalk, and curbS, against the Esplanade's pavers). Their boundary follows
// each corner's quadrant, so a curb falls mid-cell: a corner is asphalt where both cells above it
// are (a map-edge tree counts with them), so the drawn street is its six rows a half row south,
// from mid-row 89 to mid-row 95, as the approved mock has it. Walking still reads the cell grid
function asphaltRef(tiles, r, c) {
    const { ASPHALT, TREE } = params.TILES;
    const corner = (y, x) => {
        const above = [tiles[y - 1] && tiles[y - 1][x - 1], tiles[y - 1] && tiles[y - 1][x]];
        return above.includes(ASPHALT) && above.every(t => t === ASPHALT || t === TREE) ? 'a' : 'p';
    };
    const key = corner(r, c) + corner(r, c + 1) + corner(r + 1, c) + corner(r + 1, c + 1);
    if (key === 'pppp') return null;
    return tileRef(key.startsWith('aa') && key.endsWith('pp') ? 'curbS' : 'curbN', key);
}

// A level crossing: where a walkable cell of pavers or path lies on a row of track, between rails
// to its west and east, it draws the rails set flush in that ground (x 0 pavers, x 32 path), so
// the line runs on through the crossing (audit #12)
const CROSSING_TILES = { image: 'sprites/tiles_crossing.png', seasons: ['winter', 'snow'], ground: { [params.TILES.PAVERS]: 0, [params.TILES.PATH]: 32 } };

// Plain grass ('gggg') draws one of these, each the same grass with its own detail (plain, moss,
// clover, damp leaves) inside a border that matches every set's grass (tileset-meta/pnw_ground.json).
// `tenths` is the sheet index for each tenth of cells: plain half, moss and damp a fifth each,
// clover a tenth, so no detail repeats often enough to line up
const GRASS_VARIANTS = { image: 'sprites/tiles_grass_variants.png', seasons: ['winter', 'spring', 'summer', 'snow'], tenths: [0, 0, 0, 0, 0, 1, 1, 3, 3, 2] };

// Open water ('wwww') loops (audit #16). tiles_water_loop holds four variants' 4-frame loops side
// by side, 128 px each; frame 0 of each is that variant's still (tiles_water_variants), and
// variant 0's is the old water tile. A cell picks its variant by cellHash in fifths (variant 0
// twice as often as each other) and its own phase, so neighbours drift out of step; drawTilemap
// steps the frame on game.animTime. Shore and seawall pieces stay still
const WATER_LOOP = { image: 'sprites/tiles_water_loop.png', seasons: ['winter', 'snow'], fifths: [0, 0, 1, 2, 3], frames: 4, fps: 3 };

// Plain gravel ('rrrr') draws one of these (tileset-meta/grass_gravel.json): plain, weed tufts,
// puddle, by cellHash in twelfths (75/17/8). Tyre ruts (RUTS) run in a line from a vacant lot's
// gate (level.vacantLots), never at random
const GRAVEL_VARIANTS = { image: 'sprites/tiles_gravel_variants.png', seasons: ['winter', 'snow'], twelfths: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2], RUTS: 3 };

// The seawall's face (tileset-meta/pnw_ground.json): plain, ladder, storm outfall. `cells` is the
// sheet index by cellHash, so a ladder or an outfall turns up about one cell in fourteen each.
// `sides` draws a quay's sides and corners (seawall_sides_integration; seawallRef picks the piece)
const SEAWALL_TILES = {
    image: 'sprites/tiles_seawall.png', cells: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    sides: { image: 'sprites/tiles_seawall_sides.png', pieces: { W: 0, E: 1, SW: 2, SE: 3, NW: 4, NE: 5 } },
};

// Every outdoor sheet by its set name in a cell's { set } (game.tileSheets). Each may list the
// season variants it has (`seasons`, design/seasons.md §2); SeasonSystem draws it in its look.
// A building's kit and floors are indoors, and never change
const OUTDOOR_SHEETS = {
    ...TILESETS, ground: GROUND_TILES, variants: GRASS_VARIANTS, seawall: SEAWALL_TILES,
    seawallSides: SEAWALL_TILES.sides, crossing: CROSSING_TILES, gravel: GRAVEL_VARIANTS, waterLoop: WATER_LOOP,
};

// Water only where all four cells agree; path where any neighbour is path and none is
// water; grass otherwise. So every cell mixes grass with at most one other terrain, and a
// grass-based tileset always has a tile for it. A seawall cell is path along its top edge (the
// quay above meets its coping) and water along its bottom edge (the water below runs on); a
// quay's side is water all round
function outdoorCorner(tiles, row, col) {
    const around = [];
    for (const [r, c] of [[row - 1, col - 1], [row - 1, col], [row, col - 1], [row, col]]) {
        if (r >= 0 && c >= 0 && r < tiles.length && c < tiles[0].length) {
            const seawall = tiles[r][c] === params.TILES.SEAWALL;
            around.push(seawall ? (r < row ? 'w' : 'p') : TERRAIN_LETTERS[tiles[r][c]]);
        }
    }
    if (around.every(l => l === 'w')) return 'w';
    if (around.includes('p') && !around.includes('w')) return 'p';
    return 'g';
}

// A grass corner turns `letter` where `test` holds for it and every corner around it is grass or
// `letter` already, so a cell still mixes grass with one other terrain only: dry lawn ('d') under
// the trees, gravel ('r') where all four cells are gravel. There is no path, water or dry lawn
// set against either, so each keeps a margin of grass from them
function spreadCorners(corners, letter, test) {
    const clear = (r, c) => [-1, 0, 1].every(dr => [-1, 0, 1].every(dc => {
        const l = corners[r + dr] && corners[r + dr][c + dc];
        return l === undefined || l === 'g' || l === letter;
    }));
    return corners.map((row, r) => row.map((l, c) => (l === 'g' && test(r, c) && clear(r, c) ? letter : l)));
}

// The cells around corner (r, c): the four whose shared point it is
const cellsAround = (tiles, r, c) => [[r - 1, c - 1], [r - 1, c], [r, c - 1], [r, c]]
    .map(([y, x]) => tiles[y] && tiles[y][x]);

// A seawall cell's piece. A side faces the quay's pavers beside it, or is an outer corner beside
// the quay's south face; a seawall cell over a side is the inner corner where the quay meets the
// quayside wall; any other is the plain face (or a ladder or outfall)
function seawallRef(tiles, r, c) {
    const { SEAWALL, SEAWALL_SIDE, PAVERS } = params.TILES;
    const at = (y, x) => tiles[y] && tiles[y][x];
    const side = name => ({ set: 'seawallSides', sx: SEAWALL_TILES.sides.pieces[name] * params.ART_TILE, sy: 0 });
    if (tiles[r][c] === SEAWALL_SIDE) {
        if (at(r, c + 1) === PAVERS) return side('W');
        if (at(r, c - 1) === PAVERS) return side('E');
        return side(at(r, c + 1) === SEAWALL ? 'SW' : 'SE');
    }
    if (at(r + 1, c) === SEAWALL_SIDE) return side(at(r, c + 1) === PAVERS ? 'NW' : 'NE');
    const { cells } = SEAWALL_TILES;
    return { set: 'seawall', sx: cells[cellHash(c, r) % cells.length] * params.ART_TILE, sy: 0 };
}

const cornerKey = (grid, r, c) => grid[r][c] + grid[r][c + 1] + grid[r + 1][c] + grid[r + 1][c + 1];

function tileRef(set, key) {
    const [sx, sy] = TILESETS[set].tiles[key];
    return { set, sx, sy };
}

// One { set, sx, sy } per cell: a building's kit floor inside it, built ground's flat tile on
// its cells ('ground' set), the seawall's face ('seawall' set), a grass variant on plain grass
// ('variants' set), open water's loop ('waterLoop' set, with its loop and phase), terrain elsewhere
function layoutTiles(level) {
    const { tiles } = level;
    const rows = tiles.length, cols = tiles[0].length;
    const { TREE, GRAVEL } = params.TILES;
    const outdoor = Array.from({ length: rows + 1 }, (_, r) =>
        Array.from({ length: cols + 1 }, (_, c) => outdoorCorner(tiles, r, c)));
    const dry = spreadCorners(outdoor, 'd', (r, c) => cellsAround(tiles, r, c).includes(TREE));
    const corners = spreadCorners(dry, 'r', (r, c) => cellsAround(tiles, r, c).every(t => t === GRAVEL));
    const rut = (c, r) => level.vacantLots.some(lot => c === lot.gate && r >= lot.r && r < lot.r + lot.h);

    const layout = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
            const ground = GROUND_TILES.tiles[tiles[r][c]];
            const curb = [params.TILES.ASPHALT, params.TILES.PAVERS].includes(tiles[r][c]) && asphaltRef(tiles, r, c);
            if (curb) return curb;
            if (ground) return { set: 'ground', sx: ground[0], sy: ground[1] };
            if (tiles[r][c] === params.TILES.SEAWALL || tiles[r][c] === params.TILES.SEAWALL_SIDE) return seawallRef(tiles, r, c);
            const key = cornerKey(corners, r, c);
            if (key === 'gggg') {
                const h = cellHash(c, r);
                return { set: 'variants', sx: GRASS_VARIANTS.tenths[(h >>> 1) % 10] * params.ART_TILE, sy: 0, flip: (h & 1) === 1 };
            }
            if (key === 'wwww') {
                const h = cellHash(c, r), { fifths, frames } = WATER_LOOP;
                return { set: 'waterLoop', sx: fifths[(h >>> 1) % 5] * frames * params.ART_TILE, sy: 0,
                         loop: WATER_LOOP, phase: (h >>> 8) % frames };
            }
            if (key === 'rrrr') {
                const { twelfths, RUTS } = GRAVEL_VARIANTS;
                const v = rut(c, r) ? RUTS : twelfths[(cellHash(c, r) >>> 1) % 12];
                return { set: 'gravel', sx: v * params.ART_TILE, sy: 0 };
            }
            return tileRef([...key].find(l => l !== 'g'), key);
        }));

    // Level crossings: a pavers or path cell with track to its west and east in its row
    tiles.forEach((row, r) => row.forEach((t, c) => {
        if (!(t in CROSSING_TILES.ground)) return;
        if (row.slice(0, c).includes(params.TILES.RAIL) && row.slice(c + 1).includes(params.TILES.RAIL))
            layout[r][c] = { set: 'crossing', sx: CROSSING_TILES.ground[t], sy: 0 };
    }));

    // Buildings: kit floor inside, along the front ring row (which shows above the front sill) and
    // in doorways (kitFloorTile picks each cell's variant and mirroring); the rest of the ring
    // keeps the outdoor ground
    for (const b of level.buildings) {
        for (let r = b.row; r < b.row + b.height; r++)
            for (let c = b.col; c < b.col + b.width; c++)
                if (inRoom(b, c, r) || tiles[r][c] === params.TILES.DOOR) layout[r][c] = kitFloorTile(b.kit, c, r);
    }
    return layout;
}
