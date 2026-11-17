// Building kits: every building is drawn from a PixelLab building kit, named by `kit:` in
// level.buildings (styles: design/campus-layout.md §3; piece maps: tools/tileset-meta).
//
// Kit walls are 12 art px thick, stand on a cell edge and rise 42 art px, so they are
// depth-sorted pieces, not tiles; only the floor is a tile. Our buildings have a one-cell wall
// ring. The kit's walls go on the ring's inner edges (north, east, west), so the whole interior
// is walkable, and on its outer edge at the south (the street front). Back and side walls stand
// full height; the front wall is cut down to a sill (its cap on its bottom course) so the room
// and anyone in it stay in view, except at the corners, where the side walls' ends show full
// height. The ring cells beside the side walls keep the outdoor ground.
//
// Collision follows the walls, not the ring: a kit building's ring cells are opened (floor), and
// thin solid boxes stand where the walls are (kitWallBoxes), blocking like solid props. The
// whole back ring row blocks, so nobody vanishes behind the back wall. walkableGrid closes every
// cell a box touches, so the path grid is the same as with a solid ring.
//
// Every kit shares create_building_kit's sheet layout (KIT_SHEET): 52 art px wide cells, as tall as
// the wall's face allows (52 + params.KIT_WALL_FACE: 136), piece i
// at column i % 10, its floor cell at (10, 52); windows sheets use the same cells, one window per
// column. A building picks its window with `window:` (else the kit's first) and its back-wall
// window columns with `windows:` (else every other column from the second, clear of doors).
// Each kit's one-cell door is cell 0 of its own `doors` sheet (its image's `_door` file;
// tileset-meta `door_single`), at the kit's cell height and laid out like the S piece: a front door
// draws as a sill cell from it, a back-wall door as its full face. A ruin has no doors.
const BUILDING_KITS = {
    uwtBrick: { image: 'sprites/kit_uwt_brick.png',                       // A: warehouse brick
                windows: { image: 'sprites/kit_uwt_brick_windows.png', pieces: { arch: 0, sash: 2 } } },
    library:  { image: 'sprites/kit_library.png',                         // B: Snoqualmie neoclassical
                windows: { image: 'sprites/kit_library_windows.png', pieces: { arch: 0 } } },
    ballast:  { image: 'sprites/kit_ballast.png',                         // D: The Ballast
                windows: { image: 'sprites/kit_ballast_windows.png', pieces: { pane: 0 } } },
    dorm:     { image: 'sprites/kit_dorm.png',                            // E: brick residence hall
                windows: { image: 'sprites/kit_dorm_windows.png', pieces: { sash: 0 } } },
    lecture:  { image: 'sprites/kit_lecture.png',                         // C: new brick, built to match
                windows: { image: 'sprites/kit_lecture_windows.png', pieces: { band: 0 } } },
    condo:    { image: 'sprites/kit_condo.png',                           // H: hillside condos (a pedestrian door, audit #7)
                windows: { image: 'sprites/kit_condo_windows.png', pieces: { factory: 0 } } },
    shop:     { image: 'sprites/kit_shop.png',                            // J: small storefront
                windows: { image: 'sprites/kit_shop_windows.png', pieces: { shop: 0 } } },
    apartments: { image: 'sprites/kit_apartments.png', floors: 'floorsApartments',  // F: '80s walk-up apartments
                  windows: { image: 'sprites/kit_apartments_windows.png', pieces: { slider: 0 } } },
};
// A ruin (design/campus-layout.md §6.4): style A run down (tileset-meta/kit_uwt_brick_ruin.json).
// Its back wall breaks differently along its length (chipped, broken twice as often, collapsed),
// every window with a broken top; the storefront's FOR LEASE card is on its first window only.
// A ruin has no doors, so no door sheet
BUILDING_KITS.uwtBrickRuin = {
    image: 'sprites/kit_uwt_brick_ruin.png', northFaces: [80, 81, 81, 82], doors: null,
    windows: { image: 'sprites/kit_uwt_brick_ruin_windows.png', pieces: { sash: [0, 4], storefront: [8, 10] },
               first: { storefront: [2, 6] } },
};
// G: Larch Hill houses, one kit per colourway (houseSage, houseTeal, ...)
for (const colour of ['sage', 'teal', 'butter', 'red', 'slate', 'cream']) {
    BUILDING_KITS['house' + colour[0].toUpperCase() + colour.slice(1)] = {
        image: `sprites/kit_house_${colour}.png`, floors: 'floorsHouse',
        windows: { image: `sprites/kit_house_${colour}_windows.png`, pieces: { sash: 0 } },
    };
}
// Every kit with doors (all but one that says `doors: null`) draws them from its image's `_door`
// sheet, cell 0
for (const kit of Object.values(BUILDING_KITS))
    if (!('doors' in kit)) kit.doors = { image: kit.image.replace(/\.png$/, '_door.png') };
// Every kit's back-wall glass has a night variant (design/day-night.md §5): seen from inside, the
// windows go dark at night. SeasonSystem dresses the window pieces by the look, like the props
for (const kit of Object.values(BUILDING_KITS)) kit.windows.seasons = ['night'];
// Floor variants (audit #15): a kit with `floors:` lays its floor from that sheet, four 32 px
// tiles with its live floor in cell 0 (the houses' planks with their end-joints moved, the
// apartments' vinyl with speckle, wear and a seam), so the floor stops reading as a grid. Each
// cell picks one by cellHash in sixths: the live floor half the cells, each other a sixth
const FLOOR_VARIANTS = {
    sheets: { floorsHouse: 'sprites/floor_variants_house.png', floorsApartments: 'sprites/floor_variants_apartments.png' },
    sixths: [0, 0, 0, 1, 2, 3],
};
const KIT_SHEET = { w: 52, h: 52 + params.KIT_WALL_FACE, columns: 10, floorAt: { x: 10, y: 10 + params.KIT_WALL_FACE },
                    pieces: { floor: 0, N: 1, E: 2, S: 3, W: 4 } };

// Wall geometry inside a piece cell, art px (design/doors.md §1): a face (a 12 px top cap over a
// KIT_WALL_FACE face) whose bottom row is the wall's base, the back's (N) from y 10 and the
// front's (S) from y 30, and the top strip of a side wall, drawn a face's height above its ground
const KIT_WALL  = 12;
const KIT_FACE  = { N: { x: 10, y: 10, w: 32, h: KIT_WALL + params.KIT_WALL_FACE },
                    S: { x: 10, y: 30, w: 32, h: KIT_WALL + params.KIT_WALL_FACE } };
const KIT_STRIP = { W: { x: 10, y: 10, w: 12, h: 32 }, E: { x: 30, y: 10, w: 12, h: 32 } };

// Whether cell (c, r) is in building b's footprint, its ring included
function inBuilding(b, c, r) {
    return c >= b.col && c < b.col + b.width && r >= b.row && r < b.row + b.height;
}

// Building b's room floor, in cells { c, r, w, h }: inside its side walls, south of its back ring
// row, down to the front ring row (which shows above the front sill)
function roomRect(b) {
    return { c: b.col + 1, r: b.row + 1, w: b.width - 2, h: b.height - 1 };
}

// Whether cell (c, r) is on building b's room floor
function inRoom(b, c, r) {
    const f = roomRect(b);
    return c >= f.c && c < f.c + f.w && r >= f.r && r < f.r + f.h;
}

// Whether someone's home (an NPC's) is in building b
function livesIn(e, b) {
    return !!e.npc && !!e.npc.home && inBuilding(b, Math.floor(e.npc.home.x / 64), Math.floor(e.npc.home.y / 64));
}

// Every room floor cell's building, as a grid by [row][col] (null outdoors): what stands on a
// room's floor takes its light (Lighting)
function roomGrid(level) {
    const grid = level.tiles.map(row => row.map(() => null));
    for (const b of level.buildings)
        for (let r = b.row; r < b.row + b.height; r++)
            for (let c = b.col; c < b.col + b.width; c++) if (inRoom(b, c, r)) grid[r][c] = b;
    return grid;
}

// The building whose room floor world point (x, y) is on, in a room grid, else null
function roomAt(grid, x, y) {
    const row = grid && grid[Math.floor(y / 64)];
    return (row && row[Math.floor(x / 64)]) || null;
}

// Source rect origin { sx, sy } of a kit piece
function kitPieceOrigin(index) {
    return { sx: (index % KIT_SHEET.columns) * KIT_SHEET.w, sy: Math.floor(index / KIT_SHEET.columns) * KIT_SHEET.h };
}

// The floor tile ref (a tile layer entry) for a kit's cell (c, r): its variant, if the kit has
// them, mirrored on half the cells like the grass
function kitFloorTile(kitName, c, r) {
    const h = cellHash(c, r), flip = (h & 1) === 1;
    const floors = BUILDING_KITS[kitName].floors;
    if (floors) return { set: floors, sx: FLOOR_VARIANTS.sixths[(h >>> 1) % 6] * params.ART_TILE, sy: 0, flip };
    const { sx, sy } = kitPieceOrigin(KIT_SHEET.pieces.floor);
    return { set: kitName, sx: sx + KIT_SHEET.floorAt.x, sy: sy + KIT_SHEET.floorAt.y, flip };
}

// The doorway columns in a building's ring row r
function kitDoors(level, b, r) {
    const doors = [];
    for (let c = b.col; c < b.col + b.width; c++) if (level.tiles[r][c] === params.TILES.DOOR) doors.push(c);
    return doors;
}

// Every depth-sorted wall piece of a kit building, as { sheet, sx, sy, sw, sh, x, y, base, wall }:
// sheet 'image', 'windows' or 'doors', a source rect in art px, its top-left and base line in
// world px, and the wall it's part of ('N' the back, 'S' the front, 'W' and 'E' the sides)
function kitBuildingPieces(level, b) {
    const kit = BUILDING_KITS[b.kit];
    const art = params.ART_TILE, s = params.ART_SCALE;
    const pieces = [];
    const piece = (wall, sheet, index, rect, dx, artX, artTop, artBase) => {
        const o = sheet === 'image' ? kitPieceOrigin(index) : { sx: index * KIT_SHEET.w, sy: 0 };
        pieces.push({ sheet, sx: o.sx + rect.x + dx, sy: o.sy + rect.y, sw: rect.w, sh: rect.h,
                      x: artX * s, y: artTop * s, base: artBase * s, wall });
    };

    // Outer sides of the side walls, which stand on the ring's inner edges
    const left  = (b.col + 1) * art - KIT_WALL;
    const right = (b.col + b.width - 1) * art + KIT_WALL;
    const southRow = b.row + b.height - 1;
    const backDoors = kitDoors(level, b, b.row), frontDoors = kitDoors(level, b, southRow);

    // Cells across [left, right], each as { c, x0, w, dx }: the part of column c the wall spans
    const span = [];
    for (let c = b.col; c < b.col + b.width; c++) {
        const x0 = Math.max(c * art, left), x1 = Math.min((c + 1) * art, right);
        if (x1 > x0) span.push({ c, x0, w: x1 - x0, dx: x0 - c * art });
    }

    // Back wall: full face, its base on the ring's inner edge; a door's full face in a doorway.
    // A kit with `northFaces` draws one of them per column, by cellHash, so the top line varies;
    // a window style may list several pieces too, and `first` gives the first window its own
    const nBase = (b.row + 1) * art;
    const northFace = c => kit.northFaces ? hashPick(kit.northFaces, c, b.row) : KIT_SHEET.pieces.N;
    const clear = c => !backDoors.includes(c - 1) && !backDoors.includes(c) && !backDoors.includes(c + 1);
    const windows = b.windows || span.map(({ c }) => c)
        .filter(c => c > b.col && c < b.col + b.width - 2 && (c - b.col) % 2 === 0 && clear(c));
    const style = b.window || Object.keys(kit.windows.pieces)[0];
    const firstPieces = kit.windows.first && kit.windows.first[style];
    const windowPiece = c => hashPick(c === windows[0] && firstPieces || kit.windows.pieces[style], c, b.row);
    for (const { c, x0, w, dx } of span) {
        if (backDoors.includes(c)) {
            piece('N', 'doors', 0, KIT_FACE.S, 0, x0, nBase - KIT_FACE.S.h, nBase);
            continue;
        }
        const rect = { ...KIT_FACE.N, w };
        if (windows.includes(c) && w === art) piece('N', 'windows', windowPiece(c), rect, dx, x0, nBase - rect.h, nBase);
        else                                  piece('N', 'image',   northFace(c), rect, dx, x0, nBase - rect.h, nBase);
    }

    // Front wall, its base on the building's outer edge: full face at the corner slivers (the side
    // walls' ends), a sill elsewhere (the cap on the bottom course), from the door in doorways
    const sBase = (southRow + 1) * art;
    const cap    = { ...KIT_FACE.S, h: KIT_WALL };
    const course = { ...KIT_FACE.S, y: KIT_FACE.S.y + KIT_FACE.S.h - KIT_WALL, h: KIT_WALL };
    for (const { c, x0, w, dx } of span) {
        if (w < art) { const full = { ...KIT_FACE.S, w }; piece('S', 'image', KIT_SHEET.pieces.S, full, dx, x0, sBase - full.h, sBase); continue; }
        const [sheet, index] = frontDoors.includes(c) ? ['doors', 0] : ['image', KIT_SHEET.pieces.S];
        piece('S', sheet, index, cap,    0, x0, sBase - 2 * KIT_WALL, sBase);
        piece('S', sheet, index, course, 0, x0, sBase - KIT_WALL,     sBase);
    }

    // Side walls: their top strip, one cell-high segment at a time, from the back wall's top cap
    // down to the front corners' (full height), each depth-sorted on the ground line it stands over
    const top = nBase - KIT_FACE.N.h, bottom = sBase - KIT_FACE.S.h;
    for (let y = top; y < bottom; y += art) {
        const base = y + KIT_FACE.N.h - KIT_WALL + art;
        piece('W', 'image', KIT_SHEET.pieces.W, KIT_STRIP.W, 0, left, y, base);
        piece('E', 'image', KIT_SHEET.pieces.E, KIT_STRIP.E, 0, right - KIT_WALL, y, base);
    }
    return pieces;
}

// A wall piece entity of building b: drawn with its top-left at (x, y), sorted by its base line,
// in its building's light. `sheet` is the entry its image is drawn from (the kit, its windows, the
// doors), so SeasonSystem can dress it for the look; `wall` the wall it's part of
function createKitPiece(game, b, p) {
    const kit   = BUILDING_KITS[b.kit];
    const sheet = { image: kit, windows: kit.windows, doors: kit.doors }[p.sheet];
    const s     = params.ART_SCALE;
    const entity = {
        removeFromWorld: false,
        drawWidth:  0,
        drawHeight: 0,
        position:   new Position(p.x, p.base),
        sprite:     new Sprite(ASSET_MANAGER.getAsset(sheet.image), p.sx, p.sy, p.sw, p.sh, (p.base - p.y) / s, 0),
        building:   b,
        sheet,
        wall:       p.wall,
    };
    game.addEntity(entity);
    return entity;
}

// Building b's back wall as one group that fades while the player is behind it (design/doors.md
// §3.2), as { shadow, members }: the shadow is the ground the wall hides, world px (its columns,
// from its top down to its base); the members are its back-wall pieces (faces, windows, door), its
// side walls' strips, and the props hung on it (`hung`, based on its line within its span)
function backWall(game, b) {
    const ts = 64, s = params.ART_SCALE, base = (b.row + 1) * ts, top = base - KIT_FACE.N.h * s;
    const x0 = b.col * ts, x1 = (b.col + b.width) * ts;
    const hung = p => PROP_TYPES[p.propType].hung && Math.abs(footY(p) - base) <= 8 &&
                      groundPoint(p).x >= x0 && groundPoint(p).x < x1;
    return {
        shadow: { x: x0, y: top, w: x1 - x0, h: base - top },
        members: [...game.pieces.filter(p => p.building === b && p.wall !== 'S'), ...game.props.filter(hung)],
    };
}

// A kit building's ring cells become floor: its wall boxes block instead (doors stay doors)
function openKitRing(level, b) {
    const { WALL, FLOOR } = params.TILES;
    for (let r = b.row; r < b.row + b.height; r++) {
        for (let c = b.col; c < b.col + b.width; c++) {
            if (level.tiles[r][c] === WALL) level.tiles[r][c] = FLOOR;
        }
    }
}

// The solid boxes of a kit building's walls, world px: the whole back ring row, the side walls
// on the ring's inner edges, the front sill along the building's outer edge; open in doorways
// (the door pieces are drawn shut, but a doorway is walked through)
function kitWallBoxes(level, b) {
    const ts = level.tileSize, wall = KIT_WALL * params.ART_SCALE;
    const x0 = b.col * ts, x1 = (b.col + b.width) * ts, y0 = b.row * ts, y1 = (b.row + b.height) * ts;
    const left = x0 + ts - wall, right = x1 - ts + wall;
    const boxes = [];
    // A band from xa to xb, split around the doorways of ring row r
    const band = (xa, xb, y, h, r) => {
        let start = xa;
        for (const c of kitDoors(level, b, r)) {
            if (c * ts > start) boxes.push({ x: start, y, w: c * ts - start, h });
            start = Math.max(start, (c + 1) * ts);
        }
        if (xb > start) boxes.push({ x: start, y, w: xb - start, h });
    };
    band(x0, x1, y0, ts, b.row);
    boxes.push({ x: left,         y: y0 + ts, w: wall, h: y1 - y0 - ts });
    boxes.push({ x: right - wall, y: y0 + ts, w: wall, h: y1 - y0 - ts });
    band(left, right, y1 - wall, wall, b.row + b.height - 1);
    return boxes;
}

// A wall box entity: solid, drawn by the wall pieces, not itself
function createKitWall(game, box) {
    const entity = {
        removeFromWorld: false,
        drawWidth:  box.w,
        drawHeight: box.h,
        position:   new Position(box.x, box.y),
        collider:   new Collider(box.w, box.h),
    };
    game.addEntity(entity);
    return entity;
}
