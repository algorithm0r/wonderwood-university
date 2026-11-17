// Campus map — 70 tiles wide × 107 tiles tall (4480 × 6848 px at 64px/tile), layout revision 3.1
// (design/campus-layout.md §6) with the back strips (design/doors.md §3.1, and Level 2's,
// design/campus-layout.md §9.5) and the woods above Larch Hill (§9.4). Setting: late 1990s /
// early 2000s urban campus in Ashwater, Pacific Northwest. Our own fictional university; UWT is
// the reference for look and feel.
//
// ORIENTATION: south (bottom) = the Kittredge Waterway; north (top) = Larch Hill, up the bluff
//
// ─── ROW ZONES ─────────────────────────────────────────────────────────────
//  0       border
//  ── Larch Hill (housing) ──
//  1-2     woods, so the houses' back walls stand inside the map (layout 3.4)
//  3-11    Houses and their yards (set back 0-2 rows), stands of trees between some
//  12-13   Larch Street
//  14-15   the back strip of the condos and apartments
//  16-24   Condos (west), Student Apts (east), set back 0-2 rows
//  25-26   Spruce Street
//  27-28   the back strip of The Ballast and the dorm, the top flight and the trails through it
//  29-35   the woods, the Ballast lot (vacant), The Ballast, the top flight, the dorm
//  36-37   the Bluff: a solid line of trees, crossed by the top flight (rows 27-37) and two trails
//  ── Campus ──
//  38-39   Terminal Street
//  40-41   Academic Level 1's back strip, the Grand Staircase and the outer paths through it
//  42-49   Academic Level 1 — buildings (the east lot a ruin, Health Sciences)
//  50      Level 1 path
//  51-52   Green Walkway 1, the cherry walk on row 52
//  53-54   Academic Level 2's back strip (layout 3.5), the Grand Staircase and the outer paths through it
//  55-62   Academic Level 2 — buildings
//  63      Level 2 path
//  64      the Mill Line (railway)
//  65      Green Walkway 2
//  66-76   Academic Level 3 — buildings; firs on the east lot
//  77-78   Exchange Street (pavers)
//  ── Waterfront ──
//  79-80   the waterfront's back strip, Customs Plaza through it
//  81-87   Bookstore, the old hotel, Customs Plaza, Sandwich Shop, a ruin (Teaching Center)
//  88      Cascade Avenue's north sidewalk
//  89-94   Cascade Avenue
//  95-96   the Esplanade
//  97-106  the Kittredge Waterway, open to the map's edge, behind the seawall (row 97); the
//          Customs quay at rows 97-101 between the boat dock and the tug pier
//
// ─── COLUMN ZONES (campus) ─────────────────────────────────────────────────
//  0       border
//  1-3     West lot
//  4       West outer campus path (a trail up the bluff at rows 27-37)
//  5-30    West academic wing
//  31-38   Grand Staircase (flights cols 33-36, lawn flanks 31-32 & 37-38 with a tree each side, paved landings)
//  39-64   East academic wing
//  65      East outer campus path (trail at rows 27-37)
//  66-68   East lot
//  69      border

// A building's `hours` (design/day-night.md §2.1): when it's open, and its room lit at night, in
// clock hours (6, 6 AM, to 26, 2 AM): `daily`, or `weekdays` and `weekends` (a building without one
// is closed those days). A home's (`residents`) room is lit within them only while someone who
// lives there is home. A building without hours never opens (the Warehouse, the ruins). These are
// the one record of a building's hours: the Sandwich Shop sells within its own (SHOP_CATALOGS)
const HOME_HOURS = {
    'House':        { daily: [6, 23], residents: true },
    'Condo':        { daily: [6, 23], residents: true },
    'Student Apts': { daily: [6, 25], residents: true },   // grad students keep late hours
};

// Larch Hill's homes, each 7 rows deep, facing its street (`street` = the street's first row) and
// set back `setback` rows of yard; widths and setbacks vary so neighbours' fronts don't line up.
// The door is mid-front, with a path from it to the street. The six house kits stay one per house
const LARCH_HILL = [
    { name: 'House',        col:  1, width:  9, setback: 1, street: 12, kit: 'houseSage' },
    { name: 'House',        col: 12, width: 11, setback: 0, street: 12, kit: 'houseRed' },
    { name: 'House',        col: 24, width:  9, setback: 2, street: 12, kit: 'houseCream' },
    { name: 'House',        col: 37, width: 11, setback: 2, street: 12, kit: 'houseTeal' },
    { name: 'House',        col: 49, width:  9, setback: 0, street: 12, kit: 'houseButter' },
    { name: 'House',        col: 60, width:  9, setback: 1, street: 12, kit: 'houseSlate', empty: true },  // ready for faculty housing (GDD §2.15)
    { name: 'Condo',        col:  2, width:  9, setback: 2, street: 25, kit: 'condo' },
    { name: 'Condo',        col: 12, width: 10, setback: 0, street: 25, kit: 'condo' },
    { name: 'Condo',        col: 24, width:  9, setback: 1, street: 25, kit: 'condo' },
    { name: 'Student Apts', col: 38, width: 10, setback: 0, street: 25, kit: 'apartments' },
    { name: 'Student Apts', col: 50, width:  9, setback: 2, street: 25, kit: 'apartments' },
    { name: 'Student Apts', col: 60, width:  9, setback: 1, street: 25, kit: 'apartments', beds: 1 },
].map(lot => ({ ...lot, row: lot.street - 7 - lot.setback, height: 7, hours: HOME_HOURS[lot.name] }));

// The Esplanade's lamp posts, by col: along the railing every six cols, clear of the gangways and
// the quay (47: clear of the cart); each casts its light on the water below
const ESPLANADE_LAMPS = [3, 9, 15, 21, 47, 51, 57, 63];

// Cascade Avenue's street plan (layout 3.2, design/campus-layout.md §7.3): crosswalks (col ranges),
// the seven parking bays (first col of 5), the four cars parked in them, a meter at each bay's
// east end on the north sidewalk, the bus shelter (cols 28-31) and stop sign on the Esplanade
const CASCADE = {
    crosswalks: [[9, 10], [33, 36], [46, 47]],
    bays: [11, 16, 21, 40, 54, 59, 64],
    cars: { 11: 'carWagonSide', 21: 'carHatchbackSide', 40: 'carPickupSide', 59: 'carSedanSide' },
    shelter: 28, stopSign: 32,
};
const inCrosswalk = c => CASCADE.crosswalks.some(([a, b]) => c >= a && c <= b);

// Vacant lots (gravel): the Ballast lot on Spruce Street, chain-link along its street side with
// a gate gap at `gate`; tyre ruts run in from the gate (maps/autotile.js)
const VACANT_LOTS = [{ c: 10, r: 29, w: 9, h: 7, gate: 14 }];

// A tutoring table whose image bottom is at (x, y): the table based a row behind (its foot at image
// row 13, so its footprint closes the row behind the front chairs) and the two front chairs, seats
const tutoringTable = (x, y) => [
    { type: 'tutoringTable',  x,          y: y - 56 },
    { type: 'tutoringChairL', x: x - 31,  y },
    { type: 'tutoringChairR', x: x + 33,  y },
];

// Desks or benches ({ type, x, y } placements) with a seat south of each, its back to the viewer,
// based CHAIR_DROP px below the piece so it tucks under it; `offsets` (px along the piece) seat
// more than one. Not for a station's furniture: its station cell is where the seat would go
const CHAIR_DROP = 32;
const withSeats = (seat, pieces, offsets = [0]) => [
    ...pieces,
    ...pieces.flatMap(({ x, y }) => offsets.map(dx => ({ type: seat, x: x + dx, y: y + CHAIR_DROP }))),
];

// A cubicle partition run from col c0 to c1, based at y: each segment carries its post at its west
// end, so the run's east end takes the end post
const partitionRun = (c0, c1, y) => [
    ...Array.from({ length: c1 - c0 + 1 }, (_, i) => ({ type: 'cubiclePartition', x: (c0 + i) * 64 + 32, y })),
    { type: 'cubiclePartitionEnd', x: (c1 + 1) * 64 + 2, y },
];

// The back strips (design/doors.md §3.1), by their first row: two rows of verge between a street
// (or the cherry walk: design/campus-layout.md §9.5) and the backs of the buildings behind it,
// where their back walls stand (a back wall rises three cells, so it hides the strip and not what's
// beyond). A path crosses a strip from each back door to a street beyond it; a door that opens onto
// a green walk's lawn needs none. The stairs and the outer paths run on through it
const BACK_STRIPS = [14, 27, 40, 53, 79];

function buildTiles() {
    const COLS = 70, ROWS = 107;
    const { GRASS: G, PATH, WALL, FLOOR, DOOR, WATER, TREE, STAIR, PAVERS, RAIL, GRAVEL, SEAWALL, SEAWALL_SIDE, ASPHALT } = params.TILES;

    // Initialize with grass
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(G));

    // Fill rectangle with tile
    const fill = (c, r, w, h, tile) => {
        for (let row = r; row < r + h; row++)
            for (let col = c; col < c + w; col++)
                if (row >= 0 && row < ROWS && col >= 0 && col < COLS)
                    t[row][col] = tile;
    };

    // Building with south-wall doors
    const bldg = (c, r, w, h, doorCols = []) => {
        fill(c, r, w, h, WALL);
        fill(c + 1, r + 1, w - 2, h - 2, FLOOR);
        doorCols.forEach(dc => { t[r + h - 1][dc] = DOOR; });
    };

    // Building with north-wall doors (faces road to north)
    const bldgN = (c, r, w, h, doorCols = []) => {
        fill(c, r, w, h, WALL);
        fill(c + 1, r + 1, w - 2, h - 2, FLOOR);
        doorCols.forEach(dc => { t[r][dc] = DOOR; });
    };

    // Horizontal path row
    const hpath = (c, r, w) => fill(c, r, w, 1, PATH);

    // ── Borders ──────────────────────────────────────────────────────────────
    fill(0, 0, 1, 97, TREE);              // west border, down to the seawall row
    fill(COLS - 1, 0, 1, 97, TREE);       // east border
    fill(0, 0, COLS, 1, TREE);            // north border
    fill(1, 1, COLS - 2, 2, TREE);        // the woods above Larch Hill, rows 1-2 (layout 3.4)
    fill(0, 97, COLS, 10, WATER);         // the Kitt, rows 97-106, open past the south edge and both sides

    // ══ Larch Hill (rows 3-35) ═══════════════════════════════════════════════
    // Homes on their lots, each with a front path to its street
    for (const { col, row, width, height, setback } of LARCH_HILL) {
        const door = col + Math.floor((width - 1) / 2);
        bldg(col, row, width, height, [door]);
        fill(door, row + height, 1, setback, PATH);
    }
    fill(10, 3, 2, 9, TREE);              // trees between Houses 1 and 2
    fill(58, 3, 2, 9, TREE);              // and Houses 5 and 6
    fill(22, 16, 2, 9, TREE);             // between Condos 2 and 3; cols 1 and 11 stay open as lanes
    fill(48, 16, 2, 9, TREE);             // between Apts A and B
    hpath(1, 12, COLS - 2);               // Larch Street, rows 12-13
    hpath(1, 13, COLS - 2);
    hpath(1, 25, COLS - 2);               // Spruce Street, rows 25-26
    hpath(1, 26, COLS - 2);

    bldgN(19, 29, 12, 7, [25]);           // The Ballast, door on Spruce Street, beside the top flight
    bldgN(39, 29, 22, 7, [45]);           // Dorm, lobby door on Spruce Street
    fill(1, 29, 9, 7, TREE);              // Larch Hill woods, west
    for (const { c, r, w, h } of VACANT_LOTS) fill(c, r, w, h, GRAVEL);   // the Ballast lot, gone to weeds
    fill(61, 29, 8, 7, TREE);             // Larch Hill woods, east
    fill(33, 12, 4, 15, PAVERS);          // stair head, rows 12-26, through the condos' strip
    fill(33, 3, 4, 6, TREE);              // a stand of firs closes the view up the stairs; green rows 9-11

    // ══ The Bluff (rows 36-37) and the top flight ════════════════════════════
    fill(1, 36, COLS - 2, 2, TREE);
    fill(33, 27, 4, 11, STAIR);           // top flight, rows 27-37, from Spruce through its strip, between the pub and the dorm
    fill(4, 27, 1, 11, PATH);             // west trail
    fill(65, 27, 1, 11, PATH);            // east trail

    // ══ Campus ═══════════════════════════════════════════════════════════════
    hpath(1, 38, COLS - 2);               // Terminal Street, rows 38-39
    hpath(1, 39, COLS - 2);

    // ── Academic Level 1 (rows 42-49) ─────────────────────────────────────
    bldg(5, 42, 12, 8, [10]);             // Physics Lab
    bldg(18, 42, 12, 8, [23]);            // Writing Center
    bldg(39, 42, 13, 8, [45]);            // Bio Lab
    bldg(53, 42, 12, 8, []);              // ruin: Health Sciences, one lab wide, no doors
    hpath(4, 50, 62);                     // Level 1 path
    fill(6, 51, 3, 2, TREE);              // Green Walkway 1, rows 51-52, clumps off the door columns
    fill(26, 51, 2, 2, TREE);
    fill(47, 51, 2, 2, TREE);
    fill(55, 51, 3, 2, TREE);

    // ── Academic Level 2 (rows 55-62) ─────────────────────────────────────
    bldg(5, 55, 12, 8, [10]);             // Stats & Soc Sci
    bldg(18, 55, 13, 8, [24]);            // Library, its east wall on the stair flank
    bldg(39, 55, 13, 8, [45]);            // CS Lab
    bldg(53, 55, 12, 8, [58]);            // Registration
    hpath(4, 63, 62);                     // Level 2 path
    fill(1, 64, COLS - 2, 1, RAIL);       // the Mill Line; crossings at the outer paths and the landing
    fill(12, 65, 3, 1, TREE);             // Green Walkway 2, behind Level 3, off its back doors
    fill(26, 65, 2, 1, TREE);
    fill(47, 65, 2, 1, TREE);
    fill(60, 65, 3, 1, TREE);

    // ── Academic Level 3 (rows 66-76) ─────────────────────────────────────
    bldg(5, 66, 12, 11, [10]);            // Faculty Offices
    bldg(18, 66, 12, 11, [23]);           // Campus Café
    bldg(39, 66, 18, 11, [46, 49]);       // Lecture Hall, double doors on the centre aisle
    fill(57, 66, 8, 11, TREE);            // firs on the east lot, too narrow for a building

    fill(1, 77, COLS - 2, 2, PAVERS);     // Exchange Street, rows 77-78

    fill(4, 38, 1, 39, PATH);             // outer campus paths, rows 38-76, over the railway
    fill(65, 38, 1, 39, PATH);

    // ── Grand Staircase ───────────────────────────────────────────────────
    // Flights cols 33-36 between lawn flanks (31-32, 37-38), one tree each side at each flight's
    // foot on the outer column, so its crown rises over its own flank; paved landings where the
    // paths cross
    for (const r of [49, 62, 76]) {
        t[r][31] = TREE;
        t[r][38] = TREE;
    }
    fill(33, 38, 4, 39, PATH);            // rows 38-76
    fill(33, 40, 4, 10, STAIR);           // the first flight, rows 40-49, from Terminal through Level 1's strip
    fill(33, 53, 4, 10, STAIR);           // the second flight, rows 53-62, from the landing through Level 2's strip
    fill(33, 66, 4, 11, STAIR);
    fill(31, 50, 8, 3, PAVERS);           // landing, rows 50-52
    fill(31, 63, 8, 3, PAVERS);           // landing, rows 63-65 (the railway crossing)
    fill(33, 38, 4, 2, PAVERS);           // foot of the top flight, on Terminal Street

    // Back doors: every campus building but the Lecture Hall (its board wall) has one in its uphill
    // wall, clear of the back-wall stations
    for (const [c, r] of [[10, 42], [23, 42], [42, 42], [10, 55], [20, 55], [42, 55], [62, 55], [7, 66], [20, 66]]) {
        t[r][c] = DOOR;
    }

    // ══ Cascade Avenue and the waterfront ════════════════════════════════════
    bldg(4, 81, 12, 7, [9]);              // Bookstore
    bldg(17, 81, 12, 7, []);              // vacant warehouse (the old hotel), no doors
    fill(31, 79, 8, 9, PAVERS);           // Customs Plaza, at the foot of the stairs, rows 79-87 through the strip
    bldg(41, 81, 12, 7, [46]);            // Sandwich Shop
    bldg(54, 81, 14, 7, []);              // ruin: Teaching Center, a storefront warehouse, no doors
    // Cascade Avenue (layout 3.2, design/campus-layout.md §7): the north sidewalk (row 88) the shop
    // doors open onto; the street, rows 89-94 (a parking lane 89-90 on the north curb, westbound
    // 91-92, eastbound 93-94; walkable, as there's no traffic); the Esplanade its south sidewalk
    hpath(1, 88, COLS - 2);
    fill(1, 89, COLS - 2, 6, ASPHALT);
    fill(1, 95, COLS - 2, 2, PAVERS);     // the Esplanade, rows 95-96
    fill(27, 97, 16, 5, PAVERS);          // the Customs quay, cols 27-42, rows 97-101
    fill(0, 97, 27, 1, SEAWALL);          // the seawall under the Esplanade and the quay's face,
    fill(43, 97, 27, 1, SEAWALL);         // to the map's edges
    fill(27, 102, 16, 1, SEAWALL);
    fill(26, 98, 1, 5, SEAWALL_SIDE);     // the quay's west and east sides, to its outer corners
    fill(43, 98, 1, 5, SEAWALL_SIDE);

    // The back strips: verge (the grass they're laid in), and a path across from each back door
    // in the row behind them to the street beyond, where there's a street
    for (const r of BACK_STRIPS) for (let c = 0; c < COLS; c++)
        if (t[r + 2][c] === DOOR && [PATH, PAVERS, ASPHALT].includes(t[r - 1][c])) fill(c, r, 1, 2, PATH);

    return t;
}

const CAMPUS = {
    tileSize: 64,
    passableTiles: [params.TILES.GRASS, params.TILES.PATH, params.TILES.FLOOR, params.TILES.DOOR,
                    params.TILES.STAIR, params.TILES.PAVERS, params.TILES.RAIL, params.TILES.GRAVEL,
                    params.TILES.ASPHALT],
    tiles: buildTiles(),
    vacantLots: VACANT_LOTS,

    // Tree cells inside a zone draw from its types instead of TREE_TYPES (entities/props.js);
    // the first zone holding a cell wins. A zone marked `stand` is drawn off-grid, with gaps; one
    // with `dx` draws its trees that many px east (west if negative) of their cells, the cells
    // still blocking
    treeZones: [
        // the Bluff's firs either side of the top flight's foot stand aside, so its banner lamps show
        { c: 32, r: 37, w: 1, h: 1, types: ['fir'], dx: -32 },
        { c: 37, r: 37, w: 1, h: 1, types: ['fir'], dx: 40 },
        { c: 0, r: 0, w: 70, h: 1, types: ['fir', 'fir', 'tallFir'] },   // the top edge: firs, whose crowns
                                                                         // start low (props.js sinks them)
        { c: 31, r: 62, w: 1, h: 1, types: ['fir'] },              // young firs among the flank trees
        { c: 38, r: 76, w: 1, h: 1, types: ['fir'] },
        { c: 31, r: 42, w: 8, h: 35, types: ['autumn'] },          // the Grand Staircase flanks
        { c: 33, r: 3, w: 4, h: 6, types: ['fir', 'tallFir'] },    // the stand at the stair head
        { c: 57, r: 66, w: 8, h: 11, types: ['fir', 'fir', 'tallFir'], stand: true },  // the Lecture Hall firs
        // the cherry walk: Green Walkway 1's south row (10 cells). A tree in its north row would
        // stand over the rooms north of it, so those cells keep their shrubs, as before
        { c: 6, r: 52, w: 52, h: 1, types: ['cherry'] },
    ],

    // `kit:` names the building kit each building is drawn from (maps/buildingkit.js; styles in
    // design/campus-layout.md §3). A ruin is a doorless shell of the building it becomes (§6.4)
    buildings: [
        // ── Larch Hill ───────────────────────────────────────────────────
        ...LARCH_HILL.map(({ name, col, row, width, height, kit, hours }) => ({ name, col, row, width, height, kit, hours })),
        { name: 'The Ballast',       col: 19, row: 29, width: 12, height: 7, kit: 'ballast',
          hours: { weekdays: [17, 24], weekends: [14, 26] } },
        { name: 'Dorm',              col: 39, row: 29, width: 22, height: 7, kit: 'dorm',
          hours: { daily: [6, 26] } },                                  // the lobby desk; the player's room

        // ── West Academic Wing ───────────────────────────────────────────
        { name: 'Physics Lab',       col:  5, row: 42, width: 12, height:  8, kit: 'uwtBrick',
          hours: { weekdays: [7, 19], weekends: [9, 17] } },
        { name: 'Writing Center',    col: 18, row: 42, width: 12, height:  8, kit: 'uwtBrick',
          hours: { weekdays: [9, 21] } },
        { name: 'Stats & Soc Sci',   col:  5, row: 55, width: 12, height:  8, kit: 'uwtBrick', window: 'sash',
          hours: { weekdays: [7, 19] } },
        { name: 'Library',           col: 18, row: 55, width: 13, height:  8, kit: 'library',
          hours: { weekdays: [7, 24], weekends: [9, 22] } },
        { name: 'Faculty Offices',   col:  5, row: 66, width: 12, height: 11, kit: 'uwtBrick',
          hours: { weekdays: [7, 19] } },
        { name: 'Campus Cafe',       col: 18, row: 66, width: 12, height: 11, kit: 'uwtBrick', window: 'sash',
          hours: { weekdays: [7, 20], weekends: [8, 18] } },

        // ── East Academic Wing ───────────────────────────────────────────
        { name: 'Bio Lab',           col: 39, row: 42, width: 13, height:  8, kit: 'uwtBrick',
          hours: { weekdays: [7, 19], weekends: [9, 17] } },
        { name: 'Ruin',              col: 53, row: 42, width: 12, height:  8, kit: 'uwtBrickRuin',
          ruin: { becomes: 'Health Sciences' } },
        { name: 'CS Lab',            col: 39, row: 55, width: 13, height:  8, kit: 'uwtBrick',
          hours: { weekdays: [8, 23], weekends: [10, 18] } },
        { name: 'Registration',      col: 53, row: 55, width: 12, height:  8, kit: 'uwtBrick',
          hours: { weekdays: [8, 17] } },
        { name: 'Lecture Hall',      col: 39, row: 66, width: 18, height: 11, kit: 'lecture',
          hours: { weekdays: [8, 18] } },

        // ── Cascade Avenue ───────────────────────────────────────────────
        { name: 'Bookstore',         col:  4, row: 81, width: 12, height:  7, kit: 'uwtBrick', window: 'sash',
          hours: { weekdays: [9, 17] } },
        { name: 'Warehouse',         col: 17, row: 81, width: 12, height:  7, kit: 'uwtBrick', window: 'sash' },
        { name: 'Sandwich Shop',     col: 41, row: 81, width: 12, height:  7, kit: 'shop',
          hours: { daily: [10, 16] } },                                 // Owen's counter sells within them
        { name: 'Ruin',              col: 54, row: 81, width: 14, height:  7, kit: 'uwtBrickRuin', window: 'storefront',
          ruin: { becomes: 'Teaching Center' } },
    ],

    stations: [
        // ── CS Lab (Level 2, east wing) ──────────────────────────────────
        { id: 'computer-lab',   name: 'Computer',          type: 'computer-lab',
          x: 41 * 64 + 32, y: 56 * 64 + 32, color: '#81c784' },
        { id: 'computer-lab-2', name: 'Computer',          type: 'computer-lab',
          x: 44 * 64 + 32, y: 56 * 64 + 32, color: '#81c784' },
        { id: 'computer-lab-3', name: 'Computer',          type: 'computer-lab',
          x: 47 * 64 + 32, y: 56 * 64 + 32, color: '#81c784' },
        { id: 'lab-bench',      name: 'Lab Bench',         type: 'lab-bench',
          x: 49 * 64 + 32, y: 57 * 64 + 32, color: '#e88c5a' },

        // ── Bio Lab (Level 1, east wing) ─────────────────────────────────
        { id: 'bio-lab-bench',  name: 'Bio Bench',         type: 'lab-bench',
          x: 45 * 64 + 32, y: 43 * 64 + 32, color: '#e88c5a' },

        // ── Library (Level 2, west wing, on the staircase) ───────────────
        { id: 'library-terminal', name: 'Library Terminal', type: 'library-terminal',
          x: 24 * 64 + 32, y: 56 * 64 + 32, color: '#5c9ed6' },

        // ── Faculty Offices (Level 3, west wing) ─────────────────────────
        { id: 'office-desk',    name: 'Office Desk',       type: 'office-desk',
          x: 10 * 64 + 32, y: 67 * 64 + 32, color: '#ba68c8' },

        // ── Registration Office (Level 2, east wing) ─────────────────────
        { id: 'registration-terminal', name: 'Registration Terminal',
          type: 'registration-desk',
          x: 58 * 64 + 32, y: 56 * 64 + 32, color: '#f5c842' },

        // ── Dorm — a room's bed, and the lobby desk beside the door ──────
        { id: 'bed',            name: 'Bed',               type: 'bed',
          x: 57 * 64 + 32, y: 32 * 64 + 32, color: '#a78bfa' },
        { id: 'dorm-desk',      name: 'Dorm Desk',         type: 'dorm-desk',
          x: 48 * 64 + 32, y: 30 * 64 + 32, color: '#a8d8a8' },

        // ── Lecture Hall (Level 3, east wing): the front row's six desks ─
        { id: 'classroom-board',  name: 'Whiteboard',      type: 'classroom-board',
          x: 47 * 64 + 32, y: 67 * 64 + 32, color: '#f5c842' },
        { id: 'classroom-desk-1', name: 'Desk',            type: 'classroom-desk',
          x: 41 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },
        { id: 'classroom-desk-2', name: 'Desk',            type: 'classroom-desk',
          x: 43 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },
        { id: 'classroom-desk-3', name: 'Desk',            type: 'classroom-desk',
          x: 45 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },
        { id: 'classroom-desk-4', name: 'Desk',            type: 'classroom-desk',
          x: 50 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },
        { id: 'classroom-desk-5', name: 'Desk',            type: 'classroom-desk',
          x: 52 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },
        { id: 'classroom-desk-6', name: 'Desk',            type: 'classroom-desk',
          x: 54 * 64 + 32, y: 70 * 64 + 32, color: '#a0c4ff' },

        // ── Campus Café (Level 3, west wing) ─────────────────────────────
        // the customer side, two rows in front of Dani, the counter between (its footprint closes row 68)
        { id: 'cafe-counter',   name: 'Café Counter',      type: 'cafe-counter',
          x: 23 * 64 + 32, y: 69 * 64 + 32, color: '#f9a825' },
        { id: 'cafe-seating',   name: 'Café Table',        type: 'cafe-seating',
          x: 26 * 64 + 32, y: 74 * 64 + 32, color: '#f9a825' },

        // ── The Ballast — the bar's customer side and the booth ──────────
        { id: 'bar-counter',    name: 'Bar',               type: 'bar-counter',   // in front of the stools
          x: 28 * 64 + 32, y: 32 * 64 + 32, color: '#c0392b' },
        { id: 'pub-table',      name: 'Booth',             type: 'pub-table',
          x: 22 * 64 + 32, y: 33 * 64 + 32, color: '#c0392b' },

        // ── Sandwich Shop — the counter's customer side ──────────────────
        { id: 'sandwich-counter', name: 'Sandwich Counter', type: 'sandwich-counter',
          x: 47 * 64 + 32, y: 84 * 64 + 32, color: '#82e0aa' },

        // ── Bookstore (Cascade Avenue) ───────────────────────────────────
        { id: 'bookstore-register', name: 'Bookstore Register',
          type: 'bookstore-register',      // the customer side, Ruth behind the register at (9, 82)
          x:  9 * 64 + 32, y: 84 * 64 + 32, color: '#8d6e63' },
    ],

    // Props: { type, x, y } with x, y the base point in world px (types: entities/props.js).
    // Trees are not listed: one stands in every tree cell.
    props: [
        // The Customs House on its quay, footprint cols 28-41, rows 97-100
        { type: 'customsHouse', x: 35 * 64, y: 101 * 64 },

        // The waterfront (§6.5): west, the boat dock, eight floats and the boat moored on the
        // south; east, the tug pier, fourteen floats, the tug alongside. Pilings at both ends of
        // each; each dock's gangway is with the Esplanade's railing below. Both vessels face east
        ...Array.from({ length: 8 }, (_, i) => ({ type: 'dockFloat', x: (10 + i) * 64 + 32, y: 99 * 64 })),
        { type: 'piling',    x: 10 * 64 + 6,  y: 99 * 64 - 2 },
        { type: 'piling',    x: 18 * 64 - 6,  y: 99 * 64 - 2 },
        { type: 'boat',      x: 14 * 64,      y: 101 * 64 - 48 },   // hull against the floats (audit #17)
        ...Array.from({ length: 14 }, (_, i) => ({ type: 'dockFloat', x: (47 + i) * 64 + 32, y: 99 * 64 })),
        { type: 'piling',    x: 47 * 64 + 6,  y: 99 * 64 - 2 },
        { type: 'piling',    x: 61 * 64 - 6,  y: 99 * 64 - 2 },
        { type: 'tug',       x: 54 * 64,      y: 103 * 64 },

        // Station furniture, each behind its station (entities/props.js); a classroom desk's chair
        // is its seat, drawn over whoever sits in it, with the desk behind them
        ...['computer-lab', 'computer-lab-2', 'computer-lab-3'].map(station => ({ type: 'desk', station })),
        { type: 'terminal',          station: 'library-terminal' },
        // A chair in each desk station: whoever works there sits in it (AnimationSystem)
        ...['computer-lab', 'computer-lab-2', 'computer-lab-3', 'library-terminal', 'office-desk']
            .map(station => ({ type: 'officeChair', station })),
        { type: 'labBench',          station: 'lab-bench' },
        { type: 'labBench',          station: 'bio-lab-bench' },
        { type: 'officeDesk',        station: 'office-desk' },
        { type: 'registrationDesk',  station: 'registration-terminal' },
        { type: 'bed',               station: 'bed' },
        { type: 'dormDesk',          station: 'dorm-desk' },
        { type: 'whiteboard',        station: 'classroom-board' },
        ...[1, 2, 3, 4, 5, 6].flatMap(n => ['classroomDesk', 'classroomChair'].map(type => ({ type, station: `classroom-desk-${n}` }))),
        { type: 'cafeCounter',       station: 'cafe-counter' },
        { type: 'cafeTable',         station: 'cafe-seating' },
        { type: 'bookstoreRegister', station: 'bookstore-register' },
        { type: 'sandwichCounter',   station: 'sandwich-counter' },

        // Lecture Hall: two banks of 3 × 3 desks either side of the centre aisle, the front row
        // the stations; the rest are seats like them
        ...[72, 74].flatMap(r => [41, 43, 45, 50, 52, 54].flatMap(c =>
            [{ type: 'classroomDesk', x: c * 64 + 32, y: r * 64 }, { type: 'classroomChair', x: c * 64 + 32, y: (r + 1) * 64 - 8 }])),

        // Café, shop and bookstore dressing
        ...[[20, 73], [23, 73], [20, 70], [23, 70], [26, 70], [26, 68], [20, 68]].map(([c, r]) =>
            ({ type: 'cafeTable', x: c * 64 + 32, y: (r + 1) * 64 })),
        { type: 'menuBoard', x: 48 * 64 + 32, y: 89 * 64 },       // the Sandwich Shop's A-frame on Cascade Avenue, by its door
        { type: 'bookTable', x: 12 * 64 + 32, y: 86 * 64 + 56 },  // Bookstore display tables, by the front
        { type: 'bookTable', x:  6 * 64 + 32, y: 86 * 64 + 56 },

        // Grand Staircase: a banner lamp each side of every flight's foot, so the university's
        // banners climb the stairs (design/campus-layout.md §8.2); the street lamps stay plain
        ...[37, 49, 62, 76].flatMap(r => [
            { type: 'lampPostBanner', x: 33 * 64 + 12, y: (r + 1) * 64 - 4 },
            { type: 'lampPostBanner', x: 37 * 64 - 12, y: (r + 1) * 64 - 4 },
        ]),

        // The Mill Line: a crossbuck beside each crossing, north of the track
        { type: 'crossbuck', x:  4 * 64 - 14, y: 64 * 64 - 4 },   // west outer path
        { type: 'crossbuck', x: 32 * 64 + 32, y: 63 * 64 - 4 },   // the landing, on the flank lawn
        { type: 'crossbuck', x: 66 * 64 + 14, y: 64 * 64 - 4 },   // east outer path

        // Bulletin boards (CONTENT §9): on the path beside each door (a front wall is a sill,
        // so a board against it would rise over the room), the dorm's on its lobby's back wall
        { type: 'bulletinBoard', x: 60 * 64 + 32, y: 64 * 64 },  // outside Registration
        { type: 'bulletinBoard', x: 42 * 64 + 32, y: 30 * 64 },  // dorm lobby, on the back wall
        { type: 'bulletinBoard', x: 21 * 64 + 32, y: 78 * 64 },  // Campus Café entrance
        { type: 'bulletinBoard', x: 22 * 64 + 32, y: 26 * 64 },  // The Ballast, on Spruce Street
        { type: 'bulletinBoard', x: 12 * 64 + 32, y: 51 * 64 },  // outside the Physics Lab
        { type: 'bulletinBoard', x: 47 * 64 + 32, y: 51 * 64 },  // outside the Bio Lab
        { type: 'bulletinBoard', x: 47 * 64 + 32, y: 64 * 64 },  // outside the CS Lab
        { type: 'bulletinBoard', x: 31 * 64 + 32, y: 86 * 64 },  // Customs Plaza at the foot of the stairs, by the shops

        // The Ballast (interior cols 20-29, rows 30-34; door (25, 29)): the bar along the east side
        // with Finn behind it at (28, 30), the booths west of the booth station, the jukebox on the
        // east wall; the sign and the bell hang on the back wall, based just in front of it
        { type: 'barCounter', x: 28 * 64,      y: 31 * 64 + 16 },
        { type: 'pubBooth',   x: 21 * 64,      y: 34 * 64 },
        { type: 'pubBooth',   x: 21 * 64,      y: 32 * 64 },
        { type: 'jukebox',    x: 29 * 64 + 32, y: 33 * 64 },
        { type: 'neonSign',   x: 21 * 64 + 48, y: 30 * 64 + 2 },
        { type: 'shipsBell',  x: 24 * 64 + 32, y: 30 * 64 + 2 },  // by the door

        // Library (interior cols 19-29, rows 56-61): reading tables under the crane gantry, the
        // card catalogue, the stacks to the east (its terminal is a station prop above). Col 24
        // stays clear from the door to the terminal, and col 20 from the back door
        { type: 'readingTable',  x: 20 * 64,      y: 59 * 64 + 56 },
        { type: 'readingTable',  x: 22 * 64,      y: 59 * 64 + 56 },
        { type: 'craneGantry',   x: 21 * 64,      y: 60 * 64 + 8 },
        { type: 'cardCatalogue', x: 22 * 64 + 32, y: 57 * 64 },
        ...[57, 59].flatMap(r => [
            { type: 'shelf', x: 26 * 64,      y: r * 64 + 40 },
            { type: 'shelf', x: 27 * 64 + 32, y: r * 64 + 40 },
            { type: 'shelf', x: 29 * 64,      y: r * 64 + 40 },
        ]),

        // Dorm: two shelves at col 50, rows 30-31, divide the room from the lobby
        { type: 'shelf', x: 50 * 64 + 32, y: 30 * 64 + 40 },
        { type: 'shelf', x: 50 * 64 + 32, y: 31 * 64 + 40 },

        // ── Room furniture (§6.6) ────────────────────────────────────────
        // Against a back wall a piece's base is the wall's base line (the first inside row's top
        // edge), so it stands on the wall; a wall piece hangs there. Nothing stands on a door's
        // column at a wall, and nothing on an NPC's cell

        // Dorm lobby (cols 40-49): pigeonholes, the board and the payphone on the back wall, the
        // vending machine by the west wall, a sofa by the window
        { type: 'mailPigeonholes', x: 40 * 64 + 48, y: 30 * 64 + 2 },
        { type: 'payphone',        x: 44 * 64 + 16, y: 30 * 64 + 2 },
        { type: 'vendingMachine',  x: 40 * 64 + 32, y: 32 * 64 },
        { type: 'sofa',            x: 43 * 64,      y: 34 * 64 + 56 },
        // A lounge round the sofa: armchairs facing in from either side of the round rug in
        // front of it, a ficus by the window east of it, bins beside the vending machine
        { type: 'roundRug',        x: 42 * 64 + 48, y: 32 * 64 + 40 },
        { type: 'armchair',        x: 41 * 64 + 32, y: 34 * 64 - 8 },
        { type: 'armchair',        x: 44 * 64 + 32, y: 34 * 64 - 8 },
        { type: 'ficus',           x: 47 * 64 + 32, y: 35 * 64 - 8 },
        { type: 'wasteBin',        x: 41 * 64 + 16, y: 32 * 64 - 8 },
        { type: 'recyclingBin',    x: 41 * 64 + 44, y: 32 * 64 - 8 },
        // Dorm room (cols 51-59): wardrobes, desks with chairs and a fridge on the back wall, the
        // second bed beside the station's, a rug between
        { type: 'wardrobe',        x: 51 * 64 + 32, y: 30 * 64 },
        ...withSeats('officeChair', [53, 55].map(c => ({ type: 'desk', x: c * 64 + 32, y: 30 * 64 }))),
        { type: 'miniFridge',      x: 56 * 64 + 32, y: 30 * 64 },
        { type: 'wardrobe',        x: 58 * 64 + 32, y: 30 * 64 },
        { type: 'bed',             x: 59 * 64 + 32, y: 32 * 64 },
        { type: 'rug',             x: 54 * 64 + 32, y: 32 * 64 + 16 },
        // and the roommates' corner of it: an armchair under a lamp, laundry and a bin
        { type: 'floorLamp',       x: 52 * 64 + 40, y: 34 * 64 - 8 },
        { type: 'armchair',        x: 53 * 64 + 32, y: 34 * 64 - 8 },
        { type: 'floorClutter',    x: 55 * 64 + 32, y: 34 * 64 - 8 },
        { type: 'wasteBin',        x: 56 * 64 + 32, y: 35 * 64 - 8 },

        // Physics Lab (cols 6-15, rows 43-48): physics bench tops in two rows (45, 47) either side of
        // the door's column, two stools at each, Webb and Volkov each at one (Volkov's stool moved
        // off his spot); glassware and a sink at the ends of the east rows; the whiteboard, a shelf
        { type: 'shelf',           x:  6 * 64 + 32, y: 43 * 64 },
        { type: 'whiteboard',      x: 13 * 64 + 20, y: 43 * 64 },   // east a little: the poster's slot by the door
        ...withSeats('labStool', [{ type: 'labBenchPhysics', x: 8 * 64, y: 46 * 64 }], [-36, 72]),   // Webb's spot clear
        ...withSeats('labStool', [{ type: 'labBenchPhysics', x: 8 * 64, y: 48 * 64 }], [-36, 36]),
        ...withSeats('labStool', [{ type: 'labBenchPhysics', x: 13 * 64, y: 46 * 64 }], [-36, 72]),
        ...withSeats('labStool', [{ type: 'labBenchPhysics', x: 13 * 64, y: 48 * 64 }], [-36, 36]),
        { type: 'equipmentCabinet', x: 15 * 64 + 32, y: 46 * 64 - 8 },
        { type: 'labSink',         x: 15 * 64 + 32, y: 48 * 64 - 8 },

        // Writing Center (cols 19-28, rows 43-48): shelves at the ends of the back wall, desks with
        // chairs inside them, the whiteboard east of the back door, a sofa at the front
        { type: 'shelf',           x: 19 * 64 + 32, y: 43 * 64 },
        ...withSeats('officeChair', [20, 27].map(c => ({ type: 'desk', x: c * 64 + 32, y: 43 * 64 }))),
        { type: 'whiteboard',      x: 25 * 64 + 32, y: 43 * 64 },
        { type: 'shelf',           x: 28 * 64 + 32, y: 43 * 64 },
        { type: 'sofa',            x: 20 * 64 + 32, y: 48 * 64 + 56 },

        // Bio Lab (cols 40-50, rows 43-48): behind the station's bench on the back wall, two more
        // rows (45, 47) either side of a lane at cols 44-45, two stools at each, Jamal at the
        // first; down the east wall the eyewash and an aquarium; specimen shelves
        ...withSeats('labStool', [
            { type: 'labBench',    x: 42 * 64,      y: 46 * 64 },
            { type: 'labBench',    x: 42 * 64,      y: 48 * 64 },
            { type: 'labBench',    x: 48 * 64,      y: 48 * 64 },
        ], [-36, 36]),
        ...withSeats('labStool', [{ type: 'labBench', x: 48 * 64, y: 46 * 64 }], [-36, 72]),   // Maria's spot clear
        { type: 'shelf',           x: 50 * 64 + 32, y: 43 * 64 },
        { type: 'eyewashStation',  x: 50 * 64 + 36, y: 46 * 64 - 8 },
        { type: 'aquarium',        x: 50 * 64 + 32, y: 48 * 64 - 8 },

        // Stats & Soc Sci (cols 6-15, rows 56-61): desks with chairs, the whiteboard, a shelf, a
        // cabinet
        { type: 'shelf',           x:  6 * 64 + 32, y: 56 * 64 },
        ...withSeats('officeChair', [7, 8, 11].map(c => ({ type: 'desk', x: c * 64 + 32, y: 56 * 64 }))),
        { type: 'whiteboard',      x: 13 * 64 + 32, y: 56 * 64 },
        { type: 'filingCabinet',   x: 15 * 64 + 32, y: 56 * 64 },

        // Library: carrels on the back wall (no chairs: the stacks stand right in front of them),
        // the circulation desk by the front door, a globe by the reading tables
        { type: 'studyCarrel',     x: 25 * 64 + 24, y: 56 * 64 },
        { type: 'studyCarrel',     x: 29 * 64 + 32, y: 56 * 64 },
        { type: 'globe',           x: 23 * 64 + 28, y: 62 * 64 - 8 },
        { type: 'circulationDesk', x: 28 * 64,      y: 61 * 64 + 56 },

        // CS Lab (cols 40-50, rows 56-61): the whiteboard between the station desks; two rows of
        // desks (58, 60) in pairs, each worked from the row south of it, row 57 the lane to the
        // stations and cols 45-46 the lane from the door
        { type: 'whiteboard',      x: 46 * 64,      y: 56 * 64 },
        ...withSeats('officeChair', [59, 61].flatMap(y => [40, 41, 43, 44, 47, 48].map(c =>
            ({ type: 'desk', x: c * 64 + 32, y: y * 64 })))),

        // Registration (cols 54-63, rows 56-61): chairs along the back wall to the west, and two
        // rows of seats facing the counter west of the lane from the door; a rope line beside the
        // lane, the rack and a cabinet, the clock; the water cooler and a ficus by the east wall
        { type: 'waitingChairs',   x: 55 * 64 + 32, y: 57 * 64 },
        ...[58, 60].flatMap(r => [54, 55, 56, 57].map(c => ({ type: 'seminarChair', x: c * 64 + 32, y: (r + 1) * 64 - 16 }))),
        ...[60, 61, 62].map(c => ({ type: 'seminarChair', x: c * 64 + 32, y: 61 * 64 - 16 })),   // and east of it
        { type: 'waterCooler',     x: 63 * 64 + 32, y: 60 * 64 - 8 },
        { type: 'ficus',           x: 63 * 64 + 32, y: 62 * 64 - 8 },
        { type: 'queueStanchions', x: 60 * 64,      y: 59 * 64 },
        { type: 'formsRack',       x: 60 * 64 + 32, y: 56 * 64 },
        { type: 'filingCabinet',   x: 63 * 64 + 32, y: 56 * 64 },
        { type: 'wallClock',       x: 56 * 64 + 32, y: 56 * 64 + 2 },

        // Faculty Offices (cols 6-15, rows 67-75): office desks in pairs, two rows (70, 73) either
        // side of the door's column, each with its chair south of it; cubicle partitions between
        // the rows (row 72, behind the second row's desks), a bank of cabinets facing the
        // back-wall shelves
        ...withSeats('officeChair', [71, 74].flatMap(y => [7, 9, 12, 14].map(c => ({ type: 'officeDesk', x: c * 64, y: y * 64 })))),
        ...partitionRun(6, 9, 73 * 64 - 8),
        ...partitionRun(11, 13, 73 * 64 - 8),
        { type: 'shelf',           x: 12 * 64 + 32, y: 67 * 64 },
        { type: 'shelf',           x: 14 * 64 + 32, y: 67 * 64 },
        { type: 'filingCabinet',   x:  8 * 64 + 40, y: 67 * 64 },
        { type: 'filingCabinet',   x: 15 * 64 + 32, y: 70 * 64 },
        ...[12, 13, 14].map(c => ({ type: 'filingCabinet', x: c * 64 + 32, y: 69 * 64 })),   // a bank facing the shelves

        // Campus Café (cols 19-28, rows 67-75): the menu board and pastry case either side of
        // the counter, armchairs in the east corner
        { type: 'menuBoard',       x: 21 * 64 + 32, y: 67 * 64 },
        { type: 'pastryCase',      x: 25 * 64 + 16, y: 67 * 64 },
        { type: 'armchair',        x: 28 * 64 + 32, y: 73 * 64 },
        { type: 'armchair',        x: 28 * 64 + 32, y: 75 * 64 },

        // Lecture Hall: the screen and clock on the board wall, the lectern beside the board, the
        // projector cart in the aisle; the lecturer's floor is rows 67-68, so the rolling board
        // and a bin stand at its east end
        { type: 'pulldownScreen',  x: 43 * 64,      y: 67 * 64 + 2 },
        { type: 'wallClock',       x: 53 * 64,      y: 67 * 64 + 2 },
        { type: 'lectern',         x: 49 * 64 + 32, y: 69 * 64 },
        { type: 'projectorCart',   x: 48 * 64,      y: 72 * 64 },
        { type: 'rollingWhiteboard', x: 55 * 64 + 32, y: 69 * 64 - 8 },
        { type: 'wasteBin',        x: 55 * 64 + 40, y: 70 * 64 - 8 },

        // Bookstore (cols 5-14, rows 82-86): two pairs of shelves either side of the register, and
        // in front of each a free-standing shelf, so row 82 is an aisle between them
        { type: 'shelf',           x:  6 * 64,      y: 82 * 64 },
        { type: 'shelf',           x:  7 * 64 + 32, y: 82 * 64 },
        { type: 'shelf',           x: 12 * 64,      y: 82 * 64 },
        { type: 'shelf',           x: 13 * 64 + 32, y: 82 * 64 },
        { type: 'shelf',           x:  7 * 64,      y: 83 * 64 + 40 },
        { type: 'shelf',           x: 13 * 64,      y: 83 * 64 + 40 },

        // Sandwich Shop (cols 42-51, rows 82-86): two tables either side of the door
        { type: 'cafeTable',       x: 43 * 64 + 32, y: 86 * 64 },
        { type: 'cafeTable',       x: 50 * 64 + 32, y: 86 * 64 },

        // The old hotel: its key pigeonholes still on the back wall
        { type: 'mailPigeonholes', x: 22 * 64 + 32, y: 82 * 64 + 2 },

        // ── P2 room props (§6.6) ─────────────────────────────────────────
        // Tall pieces stand on back or side walls, never against the front sill
        // The Ballast: the band's stage in the front corner by the jukebox, stools at the bar
        // west of its station, the dartboard on the back wall between the sign and the bell
        { type: 'pubStage',        x: 27 * 64 + 32, y: 35 * 64 - 4 },
        ...[26 * 64 + 20, 27 * 64, 27 * 64 + 44].map(x => ({ type: 'barStool', x, y: 32 * 64 - 12 })),
        { type: 'dartboard',       x: 23 * 64,      y: 30 * 64 + 2 },

        // Physics Lab: the oscilloscope cart behind Webb, the Van de Graaff in the east corner,
        // the optics table under the whiteboard, a row in front of the benches
        { type: 'oscilloscopeCart', x: 8 * 64 + 32, y: 43 * 64 },
        { type: 'vanDeGraaff',     x: 15 * 64 + 32, y: 43 * 64 },
        { type: 'opticsTable',     x: 12 * 64 + 32, y: 44 * 64 - 8 },

        // Writing Center: a tutoring table in front of each tutor and a third at the front east,
        // the sign-in stand by the door; armchairs round the sofa make a lounge in the west corner
        ...tutoringTable(21 * 64, 47 * 64 - 8),     // Okafor's, her chair the east front one
        ...tutoringTable(26 * 64, 46 * 64 - 8),     // Casey's, the same
        ...tutoringTable(27 * 64, 48 * 64 - 8),
        { type: 'signinStand',     x: 24 * 64 + 20, y: 49 * 64 - 12 },
        { type: 'armchair',        x: 22 * 64 + 32, y: 49 * 64 - 8 },
        { type: 'armchair',        x: 19 * 64 + 32, y: 48 * 64 - 8 },
        { type: 'rollingWhiteboard', x: 28 * 64 + 28, y: 46 * 64 - 8 },   // beside Mei's table

        // Bio Lab (windows at cols 45, 47, 49): the skeleton and the fridge west of the back door,
        // the fume hood behind Jamal on the brick between two windows
        { type: 'skeleton',        x: 40 * 64 + 32, y: 43 * 64 },
        { type: 'labFridge',       x: 41 * 64 + 32, y: 43 * 64 },
        { type: 'fumeHood',        x: 48 * 64 + 32, y: 43 * 64 },

        // Stats & Soc Sci: Nair's seminar table, two tutoring tables end to end in front of her;
        // west of the door's column the data room, desks in two rows with the printer at the end
        ...tutoringTable(13 * 64, 60 * 64 - 8),     // Nair's, her chair the west front one
        ...tutoringTable(15 * 64, 60 * 64 - 8),
        ...withSeats('officeChair', [59, 61].flatMap(y => [6, 7, 8].map(c => ({ type: 'desk', x: c * 64 + 32, y: y * 64 })))),
        { type: 'laserPrinter',    x:  9 * 64 + 28, y: 59 * 64 - 8 },

        // CS Lab: a printer in the front corner, the server rack on the east wall
        { type: 'laserPrinter',    x: 50 * 64 + 28, y: 62 * 64 - 8 },
        { type: 'serverRack',      x: 50 * 64 + 32, y: 60 * 64 - 4 },

        // Faculty Offices: the coat rack by the back door; down the east wall the coffee counter
        // and the water cooler, the copier in the front corner with the bins beside it; a plant
        // in the other front corner, a ficus by the back door
        { type: 'coatRack',        x:  6 * 64 + 28, y: 67 * 64 },
        { type: 'coffeeCounter',   x: 15 * 64,      y: 73 * 64 - 8 },
        { type: 'waterCooler',     x: 15 * 64 + 32, y: 74 * 64 - 8 },
        { type: 'photocopier',     x: 15 * 64 + 30, y: 76 * 64 - 8 },
        { type: 'wasteBin',        x: 14 * 64 + 16, y: 76 * 64 - 8 },
        { type: 'recyclingBin',    x: 14 * 64 + 44, y: 76 * 64 - 8 },
        { type: 'housePlant',      x:  6 * 64 + 28, y: 76 * 64 - 8 },
        { type: 'ficus',           x:  6 * 64 + 28, y: 69 * 64 - 8 },

        // Campus Café: a plant in the front corner, high-tops along the east wall
        { type: 'housePlant',      x: 19 * 64 + 28, y: 76 * 64 - 8 },
        { type: 'hightopTable',    x: 28 * 64 + 32, y: 69 * 64 - 8 },
        { type: 'hightopTable',    x: 28 * 64 + 32, y: 71 * 64 - 8 },

        // Bookstore: the spinner and the magazine rack by the side walls, the bins between; a low
        // island of books in front of the west shelves, the card spinner beside it
        { type: 'spinnerRack',     x:  5 * 64 + 24, y: 86 * 64 - 8 },
        { type: 'islandBookshelf', x:  7 * 64,      y: 86 * 64 - 8 },
        { type: 'cardSpinner',     x:  8 * 64 + 28, y: 86 * 64 - 8 },
        { type: 'textbookBins',    x: 12 * 64,      y: 86 * 64 - 8 },
        { type: 'magazineRack',    x: 14 * 64 + 32, y: 85 * 64 - 8 },

        // Sandwich Shop: the window counter and its stools on the back wall to the west, the
        // cooler on the east wall, the chip rack by the counter
        { type: 'windowCounter',   x: 43 * 64 + 32, y: 82 * 64 },
        ...[42 * 64 + 40, 43 * 64 + 32, 44 * 64 + 24].map(x => ({ type: 'barStool', x, y: 82 * 64 + 44 })),
        { type: 'drinksCooler',    x: 51 * 64 + 30, y: 85 * 64 - 8 },   // on the east wall, below the roofline (audit #19)
        { type: 'chipRack',        x: 45 * 64 + 32, y: 85 * 64 - 8 },

        // The old hotel: its front desk before the pigeonholes, chairs stacked in the west
        // corner, crates in the east, the furniture under dust sheets
        { type: 'hotelDesk',       x: 22 * 64 + 32, y: 84 * 64 - 8 },
        { type: 'stackedChairs',   x: 18 * 64 + 20, y: 82 * 64 },
        { type: 'stackedChairs',   x: 18 * 64 + 46, y: 82 * 64 },
        { type: 'crate',           x: 26 * 64 + 32, y: 82 * 64 },
        { type: 'crate',           x: 27 * 64 + 32, y: 82 * 64 },   // no stack here: it would rise over the back wall
        { type: 'dustSheetSofa',   x: 20 * 64,      y: 87 * 64 - 8 },
        { type: 'dustSheetSofa',   x: 26 * 64,      y: 86 * 64 - 8 },
        { type: 'dustSheetSofa',   x: 20 * 64,      y: 85 * 64 - 8 },     // the lobby's furniture, sheeted
        { type: 'stackedChairs',   x: 18 * 64 + 20, y: 84 * 64 - 8 },
        { type: 'stackedChairs',   x: 18 * 64 + 46, y: 84 * 64 - 8 },
        { type: 'crate',           x: 24 * 64 + 32, y: 86 * 64 - 8 },
        { type: 'crate',           x: 25 * 64 + 32, y: 87 * 64 - 8 },
        { type: 'crate',           x: 24 * 64 + 32, y: 84 * 64 - 8 },
        { type: 'crate',           x: 25 * 64 + 32, y: 84 * 64 - 8 },
        { type: 'crateOnTop',      x: 25 * 64,      y: 84 * 64 - 7 },

        // The ruins: rubble at the wall feet, a fallen beam, weeds through the floor
        { type: 'rubblePile',      x: 55 * 64 + 40, y: 43 * 64 + 28 },   // Health Sciences
        { type: 'rubblePile',      x: 61 * 64 + 20, y: 43 * 64 + 28 },
        { type: 'rubblePile',      x: 63 * 64 + 30, y: 46 * 64 + 40 },
        { type: 'fallenBeam',      x: 58 * 64 + 32, y: 46 * 64 + 50 },
        ...[[56, 45], [60, 47], [54, 48], [62, 44], [59, 43]].map(([c, r]) =>
            ({ type: 'weedClump', x: c * 64 + 20 + (cellHash(c, r) & 31), y: r * 64 + 48 })),
        { type: 'rubblePile',      x: 57 * 64 + 20, y: 82 * 64 + 28 },   // Teaching Center
        { type: 'rubblePile',      x: 64 * 64 + 40, y: 82 * 64 + 28 },
        { type: 'rubblePile',      x: 55 * 64 + 30, y: 85 * 64 + 40 },
        { type: 'fallenBeam',      x: 61 * 64,      y: 84 * 64 + 40 },
        ...[[58, 84], [63, 85], [66, 83], [56, 86], [61, 82]].map(([c, r]) =>
            ({ type: 'weedClump', x: c * 64 + 20 + (cellHash(c, r) & 31), y: r * 64 + 48 })),

        // ── P2 outdoors (§6.6) ───────────────────────────────────────────
        // Customs Plaza: benches and the bike rack either side, a planter each side of the walk's
        // mouth on Cascade, the fountain; cols 33-36, the line down the stairs, stay clear
        { type: 'bikeRack',        x: 32 * 64,      y: 82 * 64 - 8 },
        { type: 'parkBench',       x: 32 * 64,      y: 84 * 64 - 8 },
        { type: 'parkBench',       x: 38 * 64,      y: 84 * 64 - 8 },
        { type: 'drinkingFountain', x: 37 * 64 + 32, y: 86 * 64 - 8 },
        { type: 'planter',         x: 32 * 64 + 32, y: 88 * 64 - 8 },
        { type: 'planter',         x: 37 * 64 + 32, y: 88 * 64 - 8 },

        // The Esplanade: benches looking over the water, clear of the gangways and the quay
        // on the Esplanade's north row, each a col clear of the lamps, rings and bollards on its
        // south row, so the two-row walk stays open (tools/street_check.js)
        ...[6, 19, 54, 61].map(c => ({ type: 'parkBench', x: c * 64, y: 96 * 64 - 8 })),
    ],

    // Player start: Spruce Street outside the dorm, beside Jordan for the Day 0 greeting
    startPosition: { x: 43 * 64, y: 26 * 64 },
};

// Each Larch Hill house's front: a stoop at its door, and if it has a yard, a mailbox beside its
// path and a picket fence along the yard on Larch Street, on most houses. Which side the mailbox
// stands and whether the yard is fenced come from cellHash at the door, so neighbours vary
function houseFronts(level) {
    const ts = level.tileSize;
    const props = [];
    for (const lot of LARCH_HILL.filter(lot => lot.name === 'House')) {
        const r = lot.row + lot.height - 1, street = lot.street;
        const door = level.tiles[r].findIndex((t, c) => c >= lot.col && t === params.TILES.DOOR);
        const h = cellHash(door, r);
        const mail = door + ((h & 4) ? 1 : -1);
        props.push({ type: 'porch', x: door * ts + ts / 2, y: (r + 1) * ts + 36 });
        if (lot.setback === 0) continue;
        props.push({ type: 'mailbox', x: mail * ts + ts / 2, y: street * ts - 2 });
        if ((h & 3) === 0) {
            // An unfenced yard has a hedge along its front instead, a segment every two cols
            // clear of the path and the mailbox, clipped or laurel by the yard
            for (let c = lot.col; c + 1 < lot.col + lot.width; c += 2) {
                if ([c, c + 1].some(x => x === door || x === mail)) { c -= 1; continue; }
                props.push({ type: (h & 8) ? 'hedgeClipped' : 'hedgeLaurel', x: (c + 1) * ts, y: street * ts });
            }
            continue;
        }
        for (let c = lot.col; c < lot.col + lot.width; c++) {
            if (c !== door && c !== mail) props.push({ type: 'picketFence', x: c * ts + ts / 2, y: street * ts });
        }
    }
    return props;
}
CAMPUS.props.push(...houseFronts(CAMPUS));

// A vacant lot's chain-link along its street side (its top row), open at the gate: each segment
// carries its own post at its west end, so a run's east end takes an end post; the For Sale sign
// stands just inside, west of the gate. Weeds come up in about one gravel cell in six behind the
// fence, off the ruts, nudged within the cell by the same hash
function lotFence({ c, r, w, h, gate }) {
    const ts = 64, y = r * ts + 48;
    const props = [];
    for (let col = c; col < c + w; col++) {
        if (col === gate) continue;
        props.push({ type: 'chainlinkFence', x: col * ts + ts / 2, y });
        if (col + 1 === gate || col + 1 === c + w) props.push({ type: 'chainlinkPost', x: (col + 1) * ts - 5, y });
    }
    props.push({ type: 'forSaleSign', x: (gate - 1) * ts + ts / 2, y: (r + 1) * ts + 48 });
    for (let row = r + 1; row < r + h; row++) for (let col = c; col < c + w; col++) {
        const hash = cellHash(col, row);
        if (col === gate || col === gate - 1 && row === r + 1 || hash % 6) continue;
        props.push({ type: 'weedClump', x: col * ts + 16 + (hash >>> 8) % 33, y: row * ts + 24 + (hash >>> 16) % 33 });
    }
    return props;
}
CAMPUS.props.push(...VACANT_LOTS.flatMap(lotFence));

// A doormat outside every street door that has no porch (a house's porch is its step; audit #7)
CAMPUS.props.push(...CAMPUS.buildings.filter(b => b.name !== 'House').flatMap(b => {
    const d = streetDoors(CAMPUS, b);
    return d ? d.cols.map(c => ({ type: 'doormat', x: c * 64 + 32, y: d.front ? (d.row + 1) * 64 + 4 : d.row * 64 - 24 })) : [];
}));

// The Esplanade's railing along the top of the seawall, open at each gangway (the cell where a
// dock's gangway runs down onto its floats) and at the mooring bollard beside it, to the east.
// Each segment carries its post at its west end, so a run's east end takes an end post. The rail
// draws on the seawall's top edge; its base is 8 px below that (its foot, entities/props.js)
const GANGWAYS = [10, 47];
function esplanadeRailing(level) {
    const ts = level.tileSize, y = 97 * ts;
    const railY = y + 8;
    const seawall = c => level.tiles[97][c] === params.TILES.SEAWALL && level.tiles[96][c] === params.TILES.PAVERS;
    const railed  = c => seawall(c) && !GANGWAYS.includes(c) && !GANGWAYS.includes(c - 1);
    const props = [];
    for (let c = 0; c < level.tiles[93].length; c++) {
        if (GANGWAYS.includes(c)) props.push({ type: 'gangway', x: c * ts + ts / 2, y: 99 * ts + 2 });
        if (GANGWAYS.includes(c - 1)) props.push({ type: 'mooringBollard', x: c * ts + 20, y: y - 2 });
        if (!railed(c)) continue;
        props.push({ type: 'seawallRailing', x: c * ts + ts / 2, y: railY });
        if (!railed(c + 1)) props.push({ type: 'seawallRailPost', x: (c + 1) * ts + ts / 2, y: railY });
    }
    return props;
}
CAMPUS.props.push(...esplanadeRailing(CAMPUS));

// A reading corner: an armchair in cell (c, r) on a round rug, a globe or a ficus (`extra`) behind
// it to the east
const readingCorner = (c, r, extra) => [
    { type: 'roundRug', x: c * 64 + 32,       y: r * 64 + 8 },
    { type: 'armchair', x: c * 64 + 32,       y: (r + 1) * 64 - 8 },
    { type: extra,      x: (c + 1) * 64 + 28, y: r * 64 - 8 },
];

// Each Larch Hill home's furniture, by kind, laid out from its inside rectangle (x0, y0, w cells
// wide, 5 deep), clear of the door's column, which runs from the door to the NPC's spot two rows
// in. A house or condo sleeps in the west, cooks in the east, sits at the front; an empty house
// is mid-move
const HOME_FURNITURE = {
    // Bed and shelf at the west end of the back wall, the kitchen counter at the east end with the
    // table in front of it, the sofa in the front corner, the rug inside the door
    home: ({ x0, y0, w, door }, bed = 'bed') => [
        { type: bed,              x: x0 * 64 + 32,           y: (y0 + 1) * 64 },
        { type: 'shelf',          x: (x0 + 2) * 64,          y: y0 * 64 },
        { type: 'kitchenCounter', x: (x0 + w - 2) * 64 + 32, y: y0 * 64 },
        { type: 'kitchenTable',   x: (x0 + w - 2) * 64 + 32, y: (y0 + 3) * 64 - 8 },
        { type: 'sofa',           x: (x0 + 1) * 64,          y: (y0 + 5) * 64 - 8 },
        { type: 'rug',            x: door * 64 + 32,         y: (y0 + 1) * 64 + 16 },
    ],
    // The TV on the back wall over the rug, a lamp by the west wall behind the sofa; a wide house
    // has room for a reading corner by the shelf
    House: room => [
        ...HOME_FURNITURE.home(room, 'bedDouble'),
        { type: 'crtTv',     x: room.door * 64 + 32, y: room.y0 * 64 },
        { type: 'floorLamp', x: room.x0 * 64 + 24,   y: (room.y0 + 4) * 64 - 8 },
        ...(room.w > 7 ? readingCorner(room.x0 + 2, room.y0 + 2, 'globe') : []),
    ],
    // The desk and its chair out from the west wall, a plant in the front corner
    Condo: room => [
        ...HOME_FURNITURE.home(room),
        ...withSeats('officeChair', [{ type: 'officeDesk', x: (room.x0 + 1) * 64, y: (room.y0 + 3) * 64 - 8 }]),
        { type: 'housePlant', x: (room.x0 + room.w - 1) * 64 + 32, y: (room.y0 + 5) * 64 - 8 },
    ],
    // Grads two to a flat (`beds` on the lot says otherwise), a bed and desk each at either end,
    // their spots in front; a poster over the first bed, the floor not quite clear. A flat for
    // one has a reading corner where the second bed would be
    'Student Apts': ({ x0, y0, w, door, beds }) => [
        { type: 'bed',  x: x0 * 64 + 32,       y: (y0 + 1) * 64 },
        ...withSeats('officeChair', [{ type: 'desk', x: (x0 + 1) * 64 + 32, y: y0 * 64 }]),
        ...(beds > 1 ? [
            { type: 'bed',  x: (x0 + w - 1) * 64 + 32, y: (y0 + 1) * 64 },
            ...withSeats('officeChair', [{ type: 'desk', x: (x0 + w - 2) * 64 + 32, y: y0 * 64 }]),
        ] : readingCorner(x0 + w - 2, y0 + 1, 'ficus')),
        { type: 'shelf',        x: door * 64 + 32,         y: y0 * 64 },
        { type: 'sofa',         x: (x0 + 2) * 64,          y: (y0 + 5) * 64 - 8 },
        { type: 'miniFridge',   x: (x0 + w - 1) * 64 + 32, y: (y0 + 5) * 64 - 8 },
        { type: 'wallPoster',   x: x0 * 64 + 32,           y: y0 * 64 + 2 },
        { type: 'floorClutter', x: (x0 + w - 3) * 64 + 32, y: (y0 + 5) * 64 - 8 },
    ],
    // House 6: boxes on the back wall and piled in the room, the sofa under a sheet, a round rug
    // laid out ready, the ladder and paint where the walls are being done
    empty: ({ x0, y0, w }) => [
        { type: 'movingBoxes',   x: x0 * 64 + 36,           y: y0 * 64 },
        { type: 'movingBoxes',   x: (x0 + 1) * 64 + 32,     y: (y0 + 3) * 64 - 8 },
        { type: 'movingBoxes',   x: (x0 + 5) * 64 + 32,     y: (y0 + 3) * 64 - 8 },
        { type: 'fileBoxes',     x: (x0 + 4) * 64 + 32,     y: (y0 + 4) * 64 - 8 },
        { type: 'fileBoxes',     x: (x0 + 6) * 64 + 32,     y: (y0 + 2) * 64 - 8 },
        { type: 'roundRug',      x: (x0 + 5) * 64 + 32,     y: (y0 + 3) * 64 + 8 },
        { type: 'dustSheetSofa', x: (x0 + 1) * 64,          y: (y0 + 5) * 64 - 8 },
        { type: 'stepladder',    x: (x0 + w - 2) * 64 + 32, y: y0 * 64 },
        { type: 'paintTins',     x: (x0 + w - 1) * 64 + 24, y: y0 * 64 + 28 },
    ],
};
// Every other lot along a street mirrors its kind's layout east to west, so no two neighbours
// show the same room (audit #5); the residents' own things come with the art
CAMPUS.props.push(...LARCH_HILL.flatMap(lot => {
    const room = { x0: lot.col + 1, y0: lot.row + 1, w: lot.width - 2,
                   door: lot.col + Math.floor((lot.width - 1) / 2), beds: lot.beds || 2 };
    const props = HOME_FURNITURE[lot.empty ? 'empty' : lot.name](room);
    const along = LARCH_HILL.filter(l => l.street === lot.street).indexOf(lot);
    if (along % 2 === 0) return props;
    const mid = (room.x0 + room.w / 2) * 64;
    return props.map(p => ({ ...p, x: 2 * mid - p.x }));
}));

// Each resident's own things (audit #5), placed after the mirroring, in cells each home leaves
// free (the fill check and the routes cover them). Wall pieces hang on the back wall's line
const inCell = (c, r) => ({ x: c * 64 + 32, y: (r + 1) * 64 - 8 });   // a floor piece standing in cell (c, r)
CAMPUS.props.push(
    { type: 'crtManuals',      ...inCell(8, 9) },                                   // Marriott, House 1
    { type: 'telescope',       ...inCell(13, 9) },                                  // Webb, House 2
    { type: 'framedEquation',  x: 21 * 64 + 32, y: 6 * 64 + 2 },                 //   over the bed
    { type: 'loom',            ...inCell(26, 5), x: 27 * 64 },                     // Ruth, House 3: half a cell east, clear of the wider double bed
    { type: 'bandPosterA',     x: 41 * 64,      y: 4 * 64 + 2 },                 // Chebib, House 4
    { type: 'bandPosterB',     x: 43 * 64 + 24, y: 4 * 64 + 2 },
    { type: 'aquarium',        ...inCell(38, 8) },
    { type: 'bicycle',         x: 55 * 64 + 32, y: 11 * 64 - 8 },                 // Owen, House 5
    { type: 'picnicCooler',    ...inCell(52, 10) },
    { type: 'whiteboardModel', x: 9 * 64,       y: 21 * 64 - 8 },                // Nair, Condo 1
    { type: 'typewriterTable', ...inCell(18, 21) },                                 // Okafor, Condo 2
    { type: 'ficus',           ...inCell(31, 20) },                                 // Reyes, Condo 3: plants
    { type: 'housePlant',      ...inCell(25, 21) },
    { type: 'monitorCans',     ...inCell(41, 19) },                                 // Sam, Apt A
    { type: 'seedcapRack',     x: 45 * 64 + 32, y: 19 * 64 + 2 },                // Travis, Apt A
    { type: 'statsBooks',      ...inCell(44, 19) },
    { type: 'fieldBoots',      ...inCell(51, 18) },                                 // Maria, Apt B
    { type: 'aquarium',        ...inCell(53, 17) },                                 //   her terrarium
    { type: 'easel',           ...inCell(55, 17) },                                 // Casey, Apt B
    { type: 'chessTable',      ...inCell(66, 21) },                                 // Dmitri, Apt C
);

// ── New assets A: the street (design/new-assets.md, rank A) ──────────────────────────────────────
// Flat things first, by rule over the ground (decals: entities/props.js), each cell's pick and
// nudge fixed by cellHash and no cell taking two. SeasonSystem lays them for the season, and lays
// them again when it changes: the petals, leaves and puddles lie on 1 in N of their cells by
// params.SEASON_DECALS:
//  - petals in spring on every cherry's cell (the cherry walk) and on path and paver cells beside one
//    or under its crown (up to two rows north);
//  - leaf litter on path and paver cells beside a tree (the map's border woods aside; one in four
//    in fall);
//  - puddles on the wet open ground: Exchange Street, Cascade Avenue, the Esplanade, the quay's
//    south row, the Ballast lot (one in twelve in fall, one in six on a rain day; half small, a third
//    medium, the rest large);
//  - sidewalk wear on about one in ten street cells (Larch, Spruce, Terminal, Cascade);
//  - a manhole every nine cols in Cascade's lanes (row 92) and on Terminal (row 39), clear of the
//    plaza and the stairs, with a storm drain four cols on: on Terminal at the row's south edge, on
//    Cascade at a curb, north and south by turns;
//  - moss at the foot of the ruins', the old hotel's and The Ballast's walls, and by the stair flanks.
function streetDecals(level, season, weather) {
    const ts = level.tileSize, T = params.TILES, tiles = level.tiles;
    const used = new Set(), props = [];
    const at = (type, c, r, dx = 0, dy = 0) => { used.add(c + ',' + r); props.push({ type, x: c * ts + ts / 2 + dx, y: (r + 1) * ts + dy }); };
    const free = (c, r) => !used.has(c + ',' + r);
    const nudge = (h, k) => (h >>> k) % 17 - 8;
    const rows = level.tiles.length, cols = tiles[0].length;
    const border = (c, r) => c === 0 || r === 0 || c === cols - 1;
    const besideTree = (c, r) => [-1, 0, 1].some(dr => [-1, 0, 1].some(dc =>
        tiles[r + dr] && tiles[r + dr][c + dc] === T.TREE && !border(c + dc, r + dr)));

    // Petals (spring): on every cherry's cell and on 1 in N path and paver cells beside one or
    // under its crown (up to two rows north of it)
    const PETALS = ['petalsScatter', 'petalsFew', 'petalsDrift'];
    const { leaves, puddles, petals } = params.SEASON_DECALS;
    const cherry = (c, r) => tiles[r] && tiles[r][c] === T.TREE && (treeZone(level, c, r) || { types: [] }).types.includes('cherry');
    const besideCherry = (c, r) => [-1, 0, 1, 2].some(dr => [-1, 0, 1].some(dc => cherry(c + dc, r + dr)));
    if (petals[season]) tiles.forEach((row, r) => row.forEach((t, c) => {
        const h = cellHash(c + 433, r);
        if (cherry(c, r) || ((t === T.PATH || t === T.PAVERS) && besideCherry(c, r) && h % petals[season] === 0))
            at(PETALS[(h >>> 4) % 3], c, r, nudge(h, 8), nudge(h, 12) - 8);
    }));

    // Leaf litter
    const LEAVES = ['leavesScatter', 'leavesDrift', 'leavesClump', 'leavesFew'];
    tiles.forEach((row, r) => row.forEach((t, c) => {
        const h = cellHash(c + 911, r);
        if ((t === T.PATH || t === T.PAVERS) && besideTree(c, r) && leaves[season] && h % leaves[season] === 0)
            at(LEAVES[(h >>> 4) % 4], c, r, nudge(h, 8), nudge(h, 12) - 8);
    }));

    // Puddles
    const wet = [[0, 77, cols, 2], [0, 88, cols, 2], [0, 95, cols, 2], [27, 101, 16, 1], [10, 30, 9, 6]];
    const PUDDLES = ['puddleSmall', 'puddleSmall', 'puddleSmall', 'puddleMedium', 'puddleMedium', 'puddleLarge'];
    for (const [c0, r0, w, hgt] of wet) for (let r = r0; r < r0 + hgt; r++) for (let c = c0; c < c0 + w; c++) {
        const h = cellHash(c, r + 577);
        const odds = puddles[weather === 'rain' ? 'rain' : season];   // a rain day leaves rain's, any season
        if (tiles[r][c] === T.WALL || !free(c, r) || !odds || h % odds) continue;
        at(PUDDLES[(h >>> 4) % 6], c, r, nudge(h, 8), -16 + nudge(h, 12));
    }

    // Sidewalk wear
    const WEAR = ['wearCrack', 'wearPatch', 'wearStain'];
    for (const r of [12, 13, 25, 26, 38, 39, 88]) for (let c = 0; c < cols; c++) {   // the asphalt's wear: its own art, to come
        const h = cellHash(c + 313, r);
        if (tiles[r][c] === T.PATH && free(c, r) && h % 10 === 0) at(WEAR[(h >>> 4) % 3], c, r);
    }

    // Manholes and drains
    for (const c of [7, 16, 25, 43, 52, 61]) {
        at('manhole', c, 39, 0, -20);
        at('stormDrain', c + 4, 39, 0, -2);
    }
    [6, 15, 24, 42, 51, 60].forEach((c, i) => {
        at('manhole', c, 92, 0, -20);
        let d = c + 4;
        while (inCrosswalk(d)) d++;                              // drains stay out of the crosswalks
        if (i % 2) at('stormDrain', d, 89, 0, -12);              // the north curb (drawn mid-row 89)
        else       at('stormDrain', d, 94, 0, 30);               // the south curb (drawn mid-row 95)
    });

    // Asphalt wear: a patch or a crack on about one in ten lane cells, an oil drip on about one in
    // four bay cells (where cars stand), clear of the crosswalks and the street's other decals
    for (let r = 89; r <= 94; r++) for (let c = 1; c < cols - 1; c++) {
        const h = cellHash(c + 709, r), bay = r <= 90 && CASCADE.bays.some(b => c >= b && c < b + 5);
        if (tiles[r][c] !== T.ASPHALT || inCrosswalk(c) || !free(c, r)) continue;
        if (bay && h % 4 === 0) at('asphaltOil', c, r, nudge(h, 8), 32 + nudge(h, 12) / 2);
        else if (!bay && r >= 91 && h % 10 === 0) at((h >>> 4) % 2 ? 'asphaltCrack' : 'asphaltPatch', c, r, nudge(h, 8), nudge(h, 12));
    }

    // Moss: strips along a wall's foot, a patch or a crevice line here and there
    const footOf = (y, cs) => cs.forEach((c, i) => props.push({ type: i % 3 === 2 ? 'mossCrevice' : 'mossWallfoot', x: c * ts + ts / 2, y: y * ts + 16 }));
    footOf(50, [54, 55, 58, 62, 63]);          // the ruin on Walkway 1 (53, 42)
    footOf(88, [55, 56, 60, 65, 66]);          // the ruin on Cascade (54, 81)
    footOf(88, [18, 19, 24, 27]);              // the old hotel (17, 81)
    footOf(36, [20, 21, 25, 28, 29]);          // The Ballast's stone foundation, its south wall
    for (const [c, r] of [[32, 44], [37, 47], [32, 57], [37, 59], [32, 69], [37, 73]])   // the stair flanks
        props.push({ type: 'mossPatch', x: c * ts + (c < 35 ? ts - 16 : 16), y: r * ts + 40 });
    return props;
}

// Cascade Avenue's markings and the things that stand on its street (CASCADE). The drawn street is
// its rows a half row south (maps/autotile.js), mid-row 89 to mid-row 95, so the crosswalks' six
// cells and the bays' two sit a half row down; the double centre line lies on the 92/93 seam,
// broken at the crosswalks. The cars face west in their bays; the meters stand on the north
// sidewalk at the curb, the shelter and sign on the Esplanade's north row
function cascadeStreet(level) {
    const ts = level.tileSize, half = ts / 2, props = [];
    const put = (type, c, y, dx = 0) => props.push({ type, x: c * ts + half + dx, y });
    for (const [a, b] of CASCADE.crosswalks) for (let c = a; c <= b; c++) for (let r = 89; r <= 94; r++)
        put(c === a ? 'crosswalkLeft' : c === b ? 'crosswalkRight' : 'crosswalkMid', c, (r + 1) * ts + half);
    for (let c = 1; c < level.tiles[0].length - 1; c++) if (!inCrosswalk(c)) put('lineDoubleYellow', c, 93 * ts + 8);
    for (const c of new Set(CASCADE.bays.flatMap(b => [b, b + 5]))) {
        put('bayTick', c, 90 * ts + half);
        put('bayTickEnd', c, 91 * ts + half);
    }
    for (const b of CASCADE.bays) put('parkingMeter', b + 4, 89 * ts - 4);
    for (const [b, type] of Object.entries(CASCADE.cars)) props.push({ type, x: (+b + 2.5) * ts, y: 91 * ts - 2 });
    props.push({ type: 'busShelter', x: (CASCADE.shelter + 2) * ts, y: 96 * ts - 4 });
    put('busStopSign', CASCADE.stopSign, 96 * ts - 4);
    return props;
}
CAMPUS.props.push(...cascadeStreet(CAMPUS));

// The street's things that stand (design/new-assets.md A2-A7), at the cells the design gives,
// moved where two fell in one cell: on the north row of a street they stand against its north
// edge, on the south row against its south edge, so the street's other row stays a lane
const onNorth = (type, c, r, dx = 0) => ({ type, x: c * 64 + 32 + dx, y: r * 64 + 24 });
const onSouth = (type, c, r, dx = 0) => ({ type, x: c * 64 + 32 + dx, y: (r + 1) * 64 - 4 });
CAMPUS.props.push(
    // A2 newspaper boxes: three by the plaza on Cascade, two at the foot of the top flight
    onNorth('newsboxDaily', 28, 88, -16), onNorth('newsboxWeekly', 28, 88, 22), onNorth('newsboxRealestate', 29, 88, 0),
    onNorth('newsboxDaily', 30, 38, -14), onNorth('newsboxWeekly', 30, 38, 20),
    // City trash cans (Exchange's at (30, 77) moved to 28: the street sign has 30)
    ...[16, 40, 53].map(c => onNorth('streetTrashCan', c, 88)),
    onSouth('streetTrashCan', 37, 39),
    onNorth('streetTrashCan', 28, 77), onNorth('streetTrashCan', 39, 77),
    ...[7, 42].map(c => onNorth('streetTrashCan', c, 95)),    // clear of the crosswalk landings and the south row's pieces
    // Fire hydrants, the postal box by the plaza, the payphone at its east corner, the kiosk in it
    ...[3, 27, 52].map(c => onNorth('hydrant', c, 88)), onNorth('hydrant', 5, 38), onNorth('hydrant', 64, 38),
    onNorth('postalBox', 31, 88, -12),
    onNorth('payphonePedestal', 39, 88, -12),
    { type: 'posterKiosk', x: 37 * 64 + 32, y: 83 * 64 - 8 },
    // Street-name signs at the stair corners; Terminal's a col further west, so its blade clears
    // the top flight's west banner lamp
    onNorth('streetSignLarch', 32, 12, 20), onNorth('streetSignSpruce', 32, 25, 20), onNorth('streetSignTerminal', 31, 38, 20),
    onNorth('streetSignExchange', 30, 77, 20), onNorth('streetSignCascade', 30, 88, 20),
    // A3 blade signs beside each shop's street door, on its façade line, and awnings over two doors
    { type: 'bladeBookstore', x: 10 * 64 + 40, y: 88 * 64 + 22 },     // over the sidewalk, south of the sill
    { type: 'bladeSandwich',  x: 47 * 64 + 40, y: 88 * 64 + 22 },
    { type: 'bladeCafe',      x: 24 * 64 + 40, y: 77 * 64 + 22 },
    { type: 'bladeBallast',   x: 24 * 64 + 32, y: 27 * 64 - 2 },        // on its post at Spruce's south edge
    { type: 'awningBookstore', x: 9 * 64 + 32, y: 88 * 64 + 24 },
    { type: 'awningSandwich',  x: 46 * 64 + 32, y: 88 * 64 + 28 },
    // A4 lamp posts: along the Esplanade's railing every six cols (clear of the gangways and the
    // quay), and at the gaps between buildings on Terminal Street and Exchange Street
    ...ESPLANADE_LAMPS.map(c => ({ type: 'lampPost', x: c * 64 + 32, y: 97 * 64 - 6 })),
    ...ESPLANADE_LAMPS.map(c => ({ type: 'lampReflection', x: c * 64 + 32, y: 98 * 64 + 96 })),   // on the water, from the seawall's foot
    onSouth('lampPost', 17, 39), onSouth('lampPost', 52, 39),
    onNorth('lampPost', 17, 77), onSouth('lampPost', 56, 78),   // 56: at 130 art px tall, from 53 its head stood over the Lecture Hall's floor
    // A6 the flag on its own pole at the Customs House, on the quay's south row
    { type: 'flagpole', x: 41 * 64 + 32, y: 102 * 64 - 12 },
    { type: 'flagUs',   x: 41 * 64 + 32, y: 102 * 64 - 12 + 2 },
    // A7 four cars nose-in in the Ballast lot, either side of the gate's lane (col 14)
    ...[['carWagon', 11], ['carHatchback', 13], ['carPickup', 16], ['carSedan', 18]].map(([type, c]) =>
        ({ type, x: c * 64, y: 33 * 64 - 6 })),
);

// The critters' seed spots (design/ambient-life.md §4), where the perched crows and gulls were: the
// crows' lawn cells on the lawns, the stair flank, the Ballast lot and the yards, which they spawn
// on first; the gulls' perches (x, y their foot, world px) on the dock pilings' tops, two railing
// posts and the quay, which a gull takes when it can. A perch over the water (`safe`) is one a
// gull stays put on when someone passes (CritterSystem)
CAMPUS.critterSeeds = {
    crow: [[12, 51], [21, 52], [31, 46], [16, 31], [11, 34], [59, 17], [3, 11]],
    gull: [
        ...[10 * 64 + 6, 18 * 64 - 6, 47 * 64 + 6, 61 * 64 - 6].map(x => ({ x, y: 99 * 64 - 2 - 128, safe: true })),   // pilings
        ...[21, 55].map(c => ({ x: c * 64 + 2, y: 97 * 64 + 8 - 92, safe: true })),                                   // railing posts
        { x: 29 * 64 + 40, y: 101 * 64 + 40 },                                                                        // the quay
    ],
};

// ── New assets B: the waterfront and edges (design/new-assets.md, rank B) ──────────────────────────
// Curbside carts: at each house's and condo's front path, on the street's north row on the side
// away from the mailbox (a lot with no path has them beside its door)
function curbsideCarts(level) {
    const ts = level.tileSize, props = [];
    for (const lot of LARCH_HILL.filter(lot => lot.name === 'House' || lot.name === 'Condo')) {
        const r = lot.row + lot.height - 1;
        const door = level.tiles[r].findIndex((t, c) => c >= lot.col && t === params.TILES.DOOR);
        const mailSide = (cellHash(door, r) & 4) ? 1 : -1;
        const c = lot.name === 'House' && lot.setback ? door - mailSide : door + 1;
        props.push({ type: 'garbageCart',   x: c * ts + 18, y: lot.street * ts + 24 });
        props.push({ type: 'recyclingCart', x: c * ts + 46, y: lot.street * ts + 24 });
    }
    return props;
}
CAMPUS.props.push(...curbsideCarts(CAMPUS));

// Brambles in the west and east lots between the woods and the trails (cols 1-3, 66-68), on about
// one grass cell in six there, A or B by the cell
const brambles = [];
CAMPUS.tiles.forEach((row, r) => row.forEach((t, c) => {
    const h = cellHash(c + 59, r);
    if (r >= 38 && r <= 76 && (c <= 3 || c >= 66) && t === params.TILES.GRASS && h % 6 === 0)
        brambles.push({ type: (h >>> 4) & 1 ? 'brambleA' : 'brambleB', x: c * 64 + 32 + (h >>> 8) % 17 - 8, y: (r + 1) * 64 - 8 });
}));
CAMPUS.props.push(...brambles,
    // B8 the Esplanade and the quay: life rings by the gangways (clear of the bollards and lamps),
    // the binoculars and cleats on the quay's south edge, the plaque, the espresso cart
    ...[13, 49].map(c => ({ type: 'lifeRing', x: c * 64 + 32, y: 97 * 64 - 6 })),
    { type: 'coinBinoculars',     x: 28 * 64 + 32, y: 102 * 64 - 10 },
    ...[31, 35, 39].map(c => ({ type: 'mooringCleat', x: c * 64 + 32, y: 102 * 64 - 4 })),
    { type: 'interpretivePlaque', x: 38 * 64 + 32, y: 96 * 64 - 8 },
    { type: 'espressoCart',       x: 44 * 64 + 32, y: 95 * 64 + 40 },     // clear of the railing in front of it
    // B9 the water: the log boom in the east bay, two buoys, the skiff at the boat dock's free
    // end, the kayak on its float
    { type: 'logBoom', x: 64 * 64, y: 104 * 64 + 40 },              // east of the tug, which covers cols 49-59
    { type: 'navBuoy', x: 20 * 64 + 32, y: 104 * 64 },
    { type: 'navBuoy', x: 45 * 64 + 32, y: 104 * 64 },
    { type: 'skiff',   x: 18 * 64 + 40, y: 100 * 64 - 8 },
    { type: 'kayak',   x: 49 * 64 + 32, y: 99 * 64 + 2 },     // on the tug pier's float: the boat covers its own
    // B10 the edges: a nurse log in each lot beside the woods (in the woods the trees hide it),
    // mushrooms by it, mossy boulders in the lots
    { type: 'nurseLog',  x: 2 * 64 + 16,  y: 48 * 64 - 8 },
    { type: 'nurseLog',  x: 67 * 64 + 32, y: 68 * 64 - 8 },
    { type: 'mushrooms', x: 3 * 64 + 40,  y: 48 * 64 + 10 },
    { type: 'mushrooms', x: 66 * 64 + 20, y: 68 * 64 + 10 },
    { type: 'mossyBoulder', x: 2 * 64 + 32,  y: 44 * 64 - 8 },
    { type: 'mossyBoulder', x: 67 * 64 + 16, y: 57 * 64 - 8 },
    // B11 Larch Hill: utility poles along the north edges of Larch and Spruce, in the gaps between
    // lots, so a pole never rises through a home (ART.md §5; tools/tall_prop_check.js), the condos'
    // cluster mailbox, raised beds in Ruth's and Chebib's yards. Row 10's pole at col 36, not the
    // stair axis (35), where it would cross the W
    ...[[12, [10, 23, 36, 48, 58]], [25, [11, 23, 37, 49, 59]]].flatMap(([r, cols]) =>
        cols.map(c => ({ type: 'utilityPole', x: c * 64 + 32, y: r * 64 + 14 }))),
    { type: 'clusterMailbox', x: 1 * 64 + 32,  y: 25 * 64 - 6 },
    { type: 'raisedBed',      x: 25 * 64 + 32, y: 11 * 64 - 8 },
    { type: 'raisedBed',      x: 39 * 64 + 32, y: 11 * 64 - 8 },
    // The University of Wonderwood's W at the stair head, on the stairs' axis (between cols 34
    // and 35), its footprint cols 34-35 of row 9, rows 10-11 its open forecourt (§8.1)
    { type: 'wMonument',      x: 35 * 64,      y: 10 * 64 },
    // B12 the entrance sign east of the top flight's foot (the design's (31, 38) holds the
    // Terminal sign and the newspaper boxes), signposts on the landings, the rail signs by the
    // Mill Line crossings
    { type: 'entranceSign', x: 39 * 64,      y: 38 * 64 + 24 },
    { type: 'signpost',     x: 31 * 64 + 16, y: 51 * 64 - 4 },
    { type: 'signpost',     x: 38 * 64 + 48, y: 64 * 64 - 4 },
    { type: 'railSign',     x: 5 * 64 + 16,  y: 64 * 64 - 4 },
    { type: 'railSign',     x: 66 * 64 - 16, y: 64 * 64 - 4 },
    { type: 'railSign',     x: 30 * 64 + 40, y: 64 * 64 - 4 },
    // B13 the ruins and the old hotel: posters and tags on their front bands, cones and a sawhorse
    ...[[56, 50], [60, 50], [58, 88], [63, 88], [21, 88], [25, 88]].map(([c, r], i) =>
        ({ type: i % 2 ? 'wallTags' : 'wheatpastePosters', x: c * 64 + 32, y: r * 64 + 1 })),
    { type: 'trafficCone', x: 55 * 64 + 20, y: 88 * 64 + 24 },
    { type: 'trafficCone', x: 55 * 64 + 52, y: 88 * 64 + 24 },
    { type: 'sawhorse',    x: 53 * 64 + 32, y: 50 * 64 + 24 },

    // ── New assets C: the rooms (rank C) ─────────────────────────────────────────────────────
    { type: 'backBar',            x: 27 * 64 + 48, y: 30 * 64 },          // The Ballast, behind the bar
    { type: 'posterPeriodicTable', x: 43 * 64 + 32, y: 43 * 64 + 2 },      // Bio Lab back wall
    { type: 'posterEmSpectrum',    x: 11 * 64 + 36, y: 43 * 64 + 2 },      // Physics Lab back wall, between the door and the board
    { type: 'floppyBoxes',        x: 41 * 64 + 12, y: 59 * 64 + 1 },      // CS Lab, on a desk
    { type: 'signY2kReady',       x: 49 * 64 + 32, y: 56 * 64 + 2 },      // CS Lab back wall
    { type: 'takeANumber',        x: 57 * 64 + 16, y: 58 * 64 - 8 },      // Registration, by the counter
    { type: 'signNowServing',     x: 58 * 64 + 32, y: 56 * 64 + 2 },      //   over the counter
    { type: 'bookReturn',         x: 25 * 64 + 32, y: 63 * 64 + 1 },      // Library front, by the door
    { type: 'diplomaBlack',       x: 10 * 64 + 16, y: 67 * 64 + 2 },      // Faculty Offices back wall
    { type: 'diplomaWood',        x: 11 * 64,      y: 67 * 64 + 2 },
    { type: 'lavaLamp',           x: 55 * 64 + 56, y: 30 * 64 + 1 },      // the dorm room, on a desk
);
