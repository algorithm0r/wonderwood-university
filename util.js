/** Global Parameters — single namespace for shared constants */
const params = {
    UI_HEIGHT:          88,  // px reserved at top for HUD (64 main + the timeline strip)
    TIMELINE_HEIGHT:    24,  // px, the day timeline under the HUD, tall enough for a line of text
    MINUTES_PER_SECOND:  2,  // game minutes per real second
    CHUNK_DURATION:     10,  // game-minutes of work per task chunk

    // Art (see ART.md)
    ART_SCALE:    2,   // art pixels → world pixels: 32px art tiles fill the 64px grid
    ART_TILE:    32,   // art tile size (px)
    CHAR_CELL:   72,   // character sheet cell (px), the same in every state's sheet
    CHAR_FOOT_Y: 69,   // feet line inside a cell
    // A character's states, one sheet each (entities/charactersheets.js): frames per row, cycle
    // speed, and rows: 8 directions (S SE E NE N NW W SW) or 1, facing N (back to the viewer, at a
    // desk). A state a character has no sheet for falls back along `fallback`; one that falls back
    // to walk shows walk frame 0, standing
    CHAR_STATES: {
        walk: { frames: 6, fps: 9, rows: 8 },
        idle: { frames: 4, fps: 4, rows: 8, fallback: 'walk' },
        talk: { frames: 4, fps: 6, rows: 8, fallback: 'idle' },
        type: { frames: 4, fps: 8, rows: 1, fallback: 'idle' },
        sit:  { frames: 1, fps: 1, rows: 1, fallback: 'idle' },
        work:    { frames: 4, fps: 6, rows: 1, fallback: 'idle' },   // at a counter or bench, one facing
        write:   { frames: 4, fps: 4, rows: 1, fallback: 'sit' },    // writing at a table, seated
        perform: { frames: 6, fps: 8, rows: 1, fallback: 'idle' },   // Finn's strum
    },
    CHAR_HEAD_Y:  2,   // top of the head inside a cell
    // A character seated at work draws this far (art px) below its seat's anchor, and is cut off
    // at the seat's base line: sit and type frames come out at standing height, so this puts the
    // head at seated height and keeps the legs from showing under the chair (draw only)
    SEAT_DROP:    8,
    CULL_MARGIN: 384,  // px beyond the view still drawn: covers the tallest prop above its base
    // E's one reach: px from the player's centre to a station, shop, bed or person it acts on
    // (interactTarget); an open talk or shop closes once the player is LEAVE_RADIUS away
    INTERACT_RADIUS: 52,
    LEAVE_RADIUS:    78,  // 1.5 x INTERACT_RADIUS
    NAME_RADIUS:    192,  // px from the player within which a building's name shows, by its door

    // A prop drawn taller than FADE_HEIGHT (world px; a cell and a half, so walk-on steps and low
    // furniture stay solid) fades to FADE_ALPHA while it hides the player, easing over FADE_TIME s
    FADE_HEIGHT: 96,
    FADE_ALPHA:  0.4,
    FADE_TIME:   0.15,

    // A kit wall's face, art px (design/doors.md §1): the kits' piece cells, their faces' rects and
    // the pieces hung on a back wall follow from it (maps/buildingkit.js, entities/props.js). Every
    // kit is at full height, 84 (the kits were made at 42)
    KIT_WALL_FACE: 84,
    // The showpiece trees (design/campus-layout.md §9.6): a tree of these types, as its cell's
    // tree zone gives it, must stand clear of every back wall's reach, trunk and all (strip_check);
    // any other may stand behind a wall, its crown over the roofline
    SHOWPIECE_TREES: ['cherry', 'autumn'],

    // Seasons (design/seasons.md): the quarter's season holds all quarter (seasonOf); a winter day
    // is a snow day one in SNOW_DAY_ODDS, by a hash of the day, never in finals week (weatherOf).
    // The scattered decals come and go with the season: each lies on 1 in N of its cells, 0 none
    // (streetDecals: leaves beside any tree, petals under and beside the cherries)
    SEASONS: ['fall', 'winter', 'spring', 'summer'],
    SNOW_DAY_ODDS: 20,
    SEASON_DECALS: {
        leaves:  { fall: 4,  winter: 8, spring: 0,  summer: 12 },
        petals:  { fall: 0,  winter: 0, spring: 3,  summer: 0 },
        puddles: { fall: 12, winter: 6, spring: 12, summer: 0, rain: 6 },   // rain: on a rain day, any season
    },

    // Rain (design/rain.md): a rain day is the day's weather (weatherOf: snow first, then rain on
    // RAIN_CHANCE[season] percent of days, by a hash of its own). On one, each clock hour falls at a
    // strength from SPELLS (0 a break, 0.4 drizzle, 0.7 steady, 1 a downpour), eased in over EASE
    // minutes (rainOf); the day is OVERCAST in place of DAY and GOLDEN (daylightOf); the ground
    // outdoors is shaded WET_PAVED or WET_GRASS, pools there are WET_GAIN strong, and puddles lie at
    // SEASON_DECALS.puddles.rain. Streaks: DENSITY per px² of view at strength 1, LEN px long,
    // falling SPEED px/s with SLANT px across per px down; DAY_STREAK at DAY_ALPHA by day, the
    // ambient lifted by NIGHT_LIFT at NIGHT_ALPHA in the dark, a light's colour up to LIT_ALPHA in
    // its reach (a lamp's reaches LAMP_UP px above its pool, to its globes). Splashes on paving and
    // rings on water: SPLASH_DENSITY, each SPLASH_TIME s; two rings in each puddle, RING_TIME s
    // each. Halos swell HALO_GAIN. An umbrella's canopy is centred UMBRELLA.y art px above the
    // foot, `lean` art px toward the facing (Rain)
    RAIN_CHANCE: { fall: 50, winter: 50, spring: 33, summer: 10 },
    RAIN: {
        SPELLS: [0, 0.4, 0.4, 0.7, 0.7, 1], EASE: 10,
        OVERCAST: [196, 202, 214], WET_PAVED: [222, 224, 232], WET_GRASS: [240, 242, 244], WET_GAIN: 1.3,
        DENSITY: 1 / 1800, LEN: 20, SPEED: 1000, SLANT: -0.2,
        DAY_STREAK: [214, 222, 236], DAY_ALPHA: 0.34, NIGHT_LIFT: 1.9, NIGHT_ALPHA: 0.16, LIT_ALPHA: 0.95, LAMP_UP: 236,
        SPLASH_DENSITY: 1 / 9000, SPLASH_TIME: 0.3, RING_TIME: 0.8, HALO_GAIN: 1.3,
        UMBRELLA: { y: 67, lean: 2 },
    },

    // Steam off the street on winter mornings (before STEAM.until) and smoke off the lit houses on
    // fall and winter evenings (from SMOKE.from hours before sunset) (Wisps, design/ambient-life.md
    // §3): each source's `puffs` along a `life` s cycle, soft discs overlapping into a column, each
    // rising `rise` art px, drifting `drift` east and wandering up to `wander` either way as it goes,
    // growing from `size[0]` to `size[1]` art px across, `alpha` at most, fading in over FADE_IN of
    // its life and out; `gaps` of them skipped each cycle, so steam breaks up. Their colour times the
    // ambient, never darker than a character's (LIGHT.CHAR_MIN)
    WISPS: {
        FADE_IN: 0.15,
        STEAM: { until: 10, puffs: 12, life: 1.8, rise: 18, drift: 0, wander: 8, size: [6, 16], gaps: 0.25,
                 color: [250, 252, 255], alpha: 0.6 },
        SMOKE: { from: 1, puffs: 28, life: 6, rise: 70, drift: 18, wander: 4, size: [4, 14], gaps: 0,
                 color: [206, 206, 212], alpha: 0.7 },
    },

    // Ambient life (design/ambient-life.md): each kind lives on its habitat's cells (CritterSystem's
    // named rules), is about in its seasons, `hours` ('day': sunrise to sunset; 'always'; the
    // daylight phases it's out in; or either by season) and weather (`snow` 0: never on a snow day;
    // `rain`: its count's share in drizzle, steady rain and a downpour; `winter`: its count's share
    // in winter), up to `map` near the view and `view` in it (VIEW_MAX of all kinds), in groups of
    // `group`; it flees any agent within `flee` px, walking at `walk` px/s and fleeing at `run`, to
    // its `cover` (a bird: the air; a kind with a cover rule: there, where it's hidden, and it comes
    // out `back` s after, once no one's within `flee` of it; else open ground or water, as its
    // `fleeTo` rule has it). It rests `rest` s at a time, in one of its `idles`. A bird (`flies`)
    // takes off and lands over CLIMB s (its own `climb`, if slower), flying CLIMB_ALT px up, its
    // shadow SHADOW dark beneath it; a gull (`fly: 'day'`) stays put at night.
    // `art`: its sheet, in w × h art px cells, facing east (mirrored heading west), and its `anims`
    // by name: a `row` (or `rows` by facing, E, S and N), its `frames` and `fps`, and `once` for one
    // played through and then back to rest; `foot` the ground line's row in a cell, if not its
    // bottom; `images` for a kind in more than one colourway, picked per animal. A bird's `fly`
    // sheet is laid out as FLIGHT: a take-off frame, a flap's frames (first to last, looped at its
    // fps) and a glide. A kind with no art isn't about. The crow commute: at dusk in fall and winter,
    // COMMUTE.birds crows cross the sky eastward, high, over COMMUTE.minutes game minutes, flapping
    // COMMUTE.flap s of every COMMUTE.beat and gliding the rest. A squirrel climbs its trunk at
    // TRUNK.speed art px/s to the crown (TRUNK.crown, by tree, art px over the foot), fading into
    // it over its last TRUNK.fade px; a cat fades into its cover over HIDE s
    CRITTERS: {
        VIEW_MAX: 8, MARGIN: 3, CLIMB: 0.5, CLIMB_ALT: 48, SHADOW: 0.22, HIDE: 0.6,
        FLIGHT: { takeoff: 0, flap: [1, 4], glide: 5 },
        COMMUTE: { birds: [12, 20], minutes: 20, after: 10, alt: [0.08, 0.3], speed: 160, beat: 2, flap: 1.3 },
        TRUNK: { speed: 30, fade: 12, crown: { maple: 62, cherry: 44, autumn: 52 } },
        crow:     { habitat: 'lawn', flies: true, hours: 'day', map: 10, view: 4, group: [2, 4], flee: 96, walk: 30, run: 180, back: 40,
                    art: { image: 'sprites/props/crow_loop.png', w: 12, h: 12, anims: { idle: { frames: 4, fps: 2 } },
                           fly: { image: 'sprites/props/crow_fly.png', w: 16, h: 14, fps: 10 } } },
        gull:     { habitat: 'perch', flies: true, hours: 'always', fly: 'day', map: 10, view: 4, winter: 2, flee: 128, run: 200, back: 60,
                    art: { image: 'sprites/props/gull_loop.png', w: 18, h: 16, anims: { idle: { frames: 4, fps: 1 } },
                           fly: { image: 'sprites/props/gull_fly.png', w: 24, h: 18, fps: 6 } } },
        squirrel: { habitat: 'underTrees', cover: 'trunk', hours: 'day', map: 6, view: 2, winter: 0.5, rain: [1, 0.5, 0], snow: 0,
                    flee: 128, walk: 60, run: 220, back: 30,
                    art: { image: 'sprites/props/squirrel.png', w: 16, h: 16, anims: {
                        idle: { row: 0, frames: 4, fps: 4 }, walk: { row: 1, frames: 4, fps: 10 },
                        run: { row: 1, frames: 4, fps: 16 }, climb: { row: 2, frames: 2, fps: 8 } } } },
        catTabby: { habitat: 'porch', porch: 'houseCream', cover: 'porch', map: 1, view: 1, rain: [0, 0, 0], snow: 0,
                    hours: { spring: 'day', summer: 'day', fall: ['dusk', 'night', 'dawn'], winter: ['dusk', 'night', 'dawn'] },
                    flee: 160, walk: 40, run: 60, back: 90, idles: ['groom', 'sleep', 'sleep'], rest: [8, 30],
                    art: { image: 'sprites/props/cat_tabby.png', w: 32, h: 32, anims: {
                        walk: { rows: { E: 0, S: 1, N: 2 }, frames: 4, fps: 6 }, run: { rows: { E: 3, S: 4, N: 5 }, frames: 8, fps: 12 },
                        groom: { row: 6, frames: 12, fps: 6 }, sleep: { row: 7, frames: 10, fps: 2 } } } },
        catBlack: { habitat: 'ballastLot', cover: 'cars', hours: ['dusk', 'night', 'dawn'], map: 1, view: 1, rain: [0, 0, 0], snow: 0,
                    flee: 160, walk: 40, run: 60, back: 90, idles: ['groom', 'sleep', 'sleep'], rest: [8, 30],
                    art: { image: 'sprites/props/cat_black.png', w: 32, h: 32, anims: {
                        walk: { rows: { E: 0, S: 1, N: 2 }, frames: 4, fps: 6 }, run: { rows: { E: 3, S: 4, N: 5 }, frames: 8, fps: 12 },
                        groom: { row: 6, frames: 12, fps: 6 }, sleep: { row: 7, frames: 10, fps: 2 } } } },
        duck:     { habitat: 'seawallWater', fleeTo: 'openWater', hours: ['day', 'dusk'], map: 5, view: 5, winter: 2, group: [3, 5],
                    flee: 96 + 64, walk: 12, run: 30, back: 60, idles: ['idle', 'idle', 'dabble'],   // 96 from the seawall's edge
                    art: { images: ['sprites/props/duck.png', 'sprites/props/duck_hen.png'], w: 24, h: 16, foot: 13, anims: {
                        idle: { row: 0, frames: 4, fps: 3 }, walk: { row: 0, frames: 4, fps: 4 }, run: { row: 0, frames: 4, fps: 8 },
                        dabble: { row: 1, frames: 4, fps: 3, once: true } } } },
        heron:    { habitat: 'shallows', flies: true, fleeTo: 'away', climb: 1.2, hours: ['dawn', 'dusk'], map: 1, view: 1, snow: 0,
                    flee: 256, walk: 8, run: 90, back: 300, idles: ['idle', 'idle', 'strike'], rest: [4, 12],
                    art: { image: 'sprites/props/heron.png', w: 28, h: 40, anims: {
                        idle: { row: 0, frames: 4, fps: 1 }, walk: { row: 1, frames: 4, fps: 3 }, strike: { row: 2, frames: 4, fps: 6, once: true } },
                        fly: { image: 'sprites/props/heron_fly.png', w: 40, h: 28, fps: 3 } } },
    },

    // Day and night (design/day-night.md §1): light by clock hour (6 to 26, 2 AM). The scene is
    // multiplied by an ambient colour (white: unchanged) blended through the day's keyframes, set
    // from the season's sunrise and sunset (clock hours; daylightOf). The lamps are on from
    // LAMPS_ON minutes from sunset to LAMPS_OFF minutes from sunrise (lampsOn). No character is
    // drawn darker than CHAR_MIN. A lit room (an open building's: buildingOpen) takes ROOM light
    // where it's brighter than the ambient, and its doors throw SPILL; while a gig runs in it, its
    // house lights are down (GIG_ROOM, at any hour) and a SPOT lights the stage. A sprite's tinted
    // copy is kept by its light rounded to TINT_STEP, up to TINT_KEEP copies an image, and at most
    // TINT_BUDGET new copies are made a frame (Lighting)
    DAYLIGHT: { fall:   { sunrise: 7.25, sunset: 17.5 }, winter: { sunrise: 7.75, sunset: 16.25 },
                spring: { sunrise: 6,    sunset: 20.25 }, summer: { sunrise: 5.5, sunset: 21 } },
    LIGHT: {
        DAY: [255, 255, 255], GOLDEN: [255, 222, 178], DUSK: [150, 128, 168], DAWN: [170, 150, 180],
        NIGHT: [70, 82, 135], LATE: [52, 62, 110], SNOW_NIGHT: [96, 108, 158],   // a snow day's night, lit by the snow
        DAWN_BEFORE: 30, DAWN_AFTER: 20, GOLDEN_FOR: 60, DUSK_FOR: 35,   // minutes
        LATE_FROM: 23, LATE_RAMP: 60,                                    // clock hour, minutes
        LAMPS_ON: -10, LAMPS_OFF: 10,                                    // minutes from sunset, from sunrise
        CHAR_MIN: [150, 150, 175],
        ROOM: [255, 236, 200],                                           // a lit room: warm, near full
        // A lit building's door throws a warm wedge onto the ground outside, `reach` px from the
        // wall (`northReach` from a back wall's top, across the back strip to the street behind),
        // widening `spread` px each side, from `strength` at the door to nothing
        SPILL: { reach: 96, northReach: 170, spread: 24, strength: 0.8 },
        // The lights things throw while they're lit (a prop type's `lit`): a pool of `color`,
        // `radius` px, squashed to `squash` high for the 3/4 view, from full at its centre to
        // nothing at its edge (the ground takes it whole, a sprite standing in it `spriteGain` of
        // it), and a halo at each of the thing's halo points, `halo` px, from `haloStrength` to
        // nothing. A light without a radius throws no pool
        LAMP:    { color: [255, 214, 150], radius: 150, squash: 0.7, spriteGain: 0.4, halo: 26, haloStrength: 0.45 },
        NEON:    { color: [255, 96, 176],  radius: 96,  squash: 0.7, spriteGain: 0.4, halo: 30, haloStrength: 0.35 },
        JUKEBOX: { color: [255, 196, 120], radius: 56,  squash: 0.7, spriteGain: 0.3 },
        SHELTER: { color: [176, 206, 255], radius: 90,  squash: 0.7, spriteGain: 0.4 },
        SMALL:   { color: [255, 200, 130], radius: 60,  squash: 0.7, spriteGain: 0.3 },   // a lava lamp, a floor lamp
        UPLIGHT: { color: [255, 226, 176], radius: 72,  squash: 0.7, spriteGain: 0.8 },   // the W's, washing its face
        DIAL:    { color: [255, 232, 176], halo: 40, haloStrength: 0.45 },              // the Customs House's backlit dial
        GIG_ROOM: [120, 84, 110],
        // The ground outdoors is wet (design/day-night.md §3.2): a pool there is WET_GAIN[season]
        // strong (1 if none; never on a snow day, when snow scatters the light), and a puddle in
        // one glints, drawn again in the pool's colour at GLINT of its strength
        WET_GAIN: { winter: 1.25 }, GLINT: 0.7,
        SPOT:    { color: [255, 240, 210], radius: 110, squash: 0.7, spriteGain: 1 },
        TINT_STEP: 8, TINT_KEEP: 6, TINT_BUDGET: 24,
    },

    // Map cell tile indices. STAIR, PAVERS and RAIL are built ground: walkable, one flat tile each.
    // GRAVEL is a vacant lot: walkable, gone to weeds. SEAWALL is the first water row under a
    // quayside: impassable, drawn as the wall's face; SEAWALL_SIDE is water along a quay's side
    TILES: { GRASS: 0, PATH: 1, WALL: 2, FLOOR: 3, DOOR: 4, WATER: 5, TREE: 6, STAIR: 7, PAVERS: 8, RAIL: 9, GRAVEL: 10,
             SEAWALL: 11, SEAWALL_SIDE: 12, ASPHALT: 13 },
};

// Convenience aliases (available globally after util.js loads)
const UI_HEIGHT     = params.UI_HEIGHT;
const CHUNK_DURATION = params.CHUNK_DURATION;
const DAY_NAMES     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const randomInt = n => Math.floor(Math.random() * n);

const rgb  = (r, g, b)    => `rgba(${r}, ${g}, ${b})`;
const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;
const hsl  = (h, s, l)    => `hsl(${h}, ${s}%, ${l}%)`;

/** Creates an alias for requestAnimationFrame for backwards compatibility */
window.requestAnimFrame = (() => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        });
})();

const getDistance = (p1, p2) =>
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

/** Whether the player's centre is within `radius` of `point` */
const nearPlayer = (game, point, radius) => {
    const p = game.player;
    return getDistance({ x: p.position.x + p.drawWidth / 2, y: p.position.y + p.drawHeight / 2 }, point) < radius;
};

/** Where an entity is drawn standing: the bottom-centre of its box, or for a character seated at
 *  work, just behind its seat (animator.seat, the seat's base point, set by AnimationSystem), so
 *  the seat draws over it. Drawing only: position and collision stay with the box */
const groundPoint = e => {
    const seat = e.animator && e.animator.seat, stand = e.animator && e.animator.stand;
    if (stand) return { x: stand.x, y: stand.sort };
    return seat ? { x: seat.x, y: seat.y - 2 } : { x: e.position.x + e.drawWidth / 2, y: e.position.y + e.drawHeight };
};

/** Ground line of anything drawn standing. Draw order is by this. */
const footY = e => groundPoint(e).y;

/** World-space box { x, y, w, h } an entity's sprite frame is drawn into: its ground point on the
 *  entity's ground point. A box stops at a cut line, so h may be less than the frame's (the draw
 *  takes the frame's top h / ART_SCALE rows): a seated character's sinks SEAT_DROP and is cut at
 *  its seat's base line; a prop with clipY is cut there (the map's top edge trees) */
const spriteBox = e => {
    const s = e.sprite, scale = params.ART_SCALE, g = groundPoint(e);
    const seat = e.animator && e.animator.seat;
    const x = Math.round(g.x - s.footX * scale);
    const stand = e.animator && e.animator.stand;       // on a platform: feet on its stand point
    const y = Math.round((stand ? stand.y : g.y + (seat ? params.SEAT_DROP * scale : 0)) - s.footY * scale);
    const full = s.frameHeight * scale, cut = seat ? seat.y : e.clipY;
    const h = cut === undefined ? full : Math.max(0, Math.min(full, Math.floor((cut - y) / scale) * scale));
    return { x, y, w: s.frameWidth * scale, h };
};

/** World y of the top of what an entity draws: the head for a sprite (CHAR_HEAD_Y art px below
 *  its frame's top, so it sinks with a seated figure), the box otherwise. A name tag, a speech
 *  bubble and a task prompt stack up from here, over the figure, never across it */
const headTop = e => e.sprite && e.sprite.image ? spriteBox(e).y + params.CHAR_HEAD_Y * params.ART_SCALE : e.position.y;

/** World-space collision box { x, y, w, h } of an entity's collider, at (x, y) or where it stands */
const colliderBox = (e, x = e.position.x, y = e.position.y) =>
    ({ x: x + e.collider.offsetX, y: y + e.collider.offsetY, w: e.collider.width, h: e.collider.height });

/** What E acts on this frame: of everything in the player's reach (the work station
 *  TaskInteractionSystem found, shops and the registration desk, the bed, people), the one the player faces wins (within
 *  about 45 degrees of its facing), then a station, shop or bed over someone to talk to, then the
 *  nearest. { kind: 'station' | 'shop' | 'desk' | 'bed' | 'npc', station | entity, dist } or null */
function interactTarget(game, workNear) {
    const player = game.player;
    if (!player) return null;
    const c = { x: player.position.x + player.drawWidth / 2, y: player.position.y + player.drawHeight / 2 };
    const reach = (kind, at, ref) => { const dist = getDistance(c, at); return dist < params.INTERACT_RADIUS ? { kind, ...ref, at, dist } : null; };
    const stations = Object.values(game.stationMap || {});
    const bed = game.stationMap && game.stationMap.bed;
    const found = [
        workNear && reach('station', workNear.station, { station: workNear.station }),
        ...stations.filter(s => SHOP_CATALOGS[s.type]).map(s => reach('shop', s, { station: s })),
        ...stations.filter(s => s.type === 'registration-desk').map(s => reach('desk', s, { station: s })),
        bed && reach('bed', bed, { station: bed }),
        ...game.entities.filter(e => e.npc && e.agent && e.position)
            .map(e => reach('npc', { x: e.position.x + e.drawWidth / 2, y: e.position.y + e.drawHeight / 2 }, { entity: e })),
    ].filter(Boolean);
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing && player.facing.direction] || [0, 1];
    const faced = t => t.dist > 0 && ((t.at.x - c.x) * f[0] + (t.at.y - c.y) * f[1]) / t.dist > 0.7;   // underfoot isn't faced
    const rank = t => (faced(t) ? 0 : 2) + (t.kind === 'npc' ? 1 : 0);
    found.sort((a, b) => rank(a) - rank(b) || a.dist - b.dist);
    return found[0] || null;
}

/** Boxes overlap when they share area; touching edges don't count */
const boxesOverlap = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Cell range { c0, c1, r0, r1 } (inclusive) a box covers on a grid of ts-px cells */
const boxCells = (box, ts) => ({
    c0: Math.floor(box.x / ts), c1: Math.ceil((box.x + box.w) / ts) - 1,
    r0: Math.floor(box.y / ts), r1: Math.ceil((box.y + box.h) / ts) - 1,
});

/** Fixed pseudo-random 32-bit hash of a grid cell: the same cell always gets the same variation */
const cellHash = (c, r) => {
    let h = Math.imul(c, 374761393) + Math.imul(r, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
};

/** Fixed pseudo-random 32-bit hash of a string (FNV-1a): the same name always gets the same variation */
const nameHash = s => {
    let h = 2166136261;
    for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
};

/** One of a list (or the one value), picked for cell (c, r) by cellHash: a value listed twice
 *  is picked twice as often */
const hashPick = (list, c, r) => {
    const all = [].concat(list);
    return all[cellHash(c, r) % all.length];
};

/** The season: the quarter's (quarters 1-4 are fall, winter, spring, summer, and round again) */
const seasonOf = quarter => params.SEASONS[(quarter.number - 1) % params.SEASONS.length];

/** The day's weather, by hashes of the day and the quarter, so it's fixed for a playthrough:
 *  'snow' on a winter snow day (never in finals week), else 'rain' on a rain day (RAIN_CHANCE
 *  percent of the season's days, by a hash of its own), else null */
const weatherOf = (quarter, clock) => {
    const day = (clock.week - 1) * 7 + clock.day, season = seasonOf(quarter);
    const snow = season === 'winter' && !quarter.isFinalsWeek(clock.week) &&
                 cellHash(day, quarter.number) % params.SNOW_DAY_ODDS === 0;
    if (snow) return 'snow';
    // the salt keeps the opening days dry and brings rain mid-week (week 1: Wednesday, Thursday)
    return cellHash(day + 7996, quarter.number) % 100 < params.RAIN_CHANCE[season] ? 'rain' : null;
};

/** How hard it rains in clock hour h of the day (6 to 25), 0 to 1: one of RAIN.SPELLS by a hash
 *  of the day and the hour */
const rainSpell = (quarter, clock, h) => {
    const S = params.RAIN.SPELLS, day = (clock.week - 1) * 7 + clock.day;
    return S[cellHash(day * 32 + Math.floor(h), quarter.number + 104729) % S.length];
};

/** How hard it's raining now, 0 to 1: 0 but on a rain day; else the hour's spell, eased in from
 *  the hour before's over RAIN.EASE minutes. Worked out, never kept */
const rainOf = (quarter, clock) => {
    if (weatherOf(quarter, clock) !== 'rain') return 0;
    const h = clockHour(clock), now = rainSpell(quarter, clock, h);
    const into = (h - Math.floor(h)) * 60, ease = params.RAIN.EASE;
    if (into >= ease || h < DAY_START_HOUR + 1) return now;
    const before = rainSpell(quarter, clock, h - 1);
    return before + (now - before) * into / ease;
};

/** The game's look, the keys its art is picked by: night while it's dark (the lamps are on), then
 *  the weather, then the season (SeasonSystem sets all three each tick) */
const lookOf = game => [game.dark && 'night', game.weather, game.season];

/** An entry's image for a look ([night, weather, season]): the first key its `seasons` lists (the
 *  variants that exist), drawn from the base image's file with the key before .png
 *  (tree_maple.png → tree_maple_winter.png), else the base image */
const seasonalImage = (def, look) => {
    const key = def.seasons && look.find(k => def.seasons.includes(k));
    return key ? def.image.replace(/\.png$/, `_${key}.png`) : def.image;
};

/** Every image an entry may draw: its base and each variant it lists */
const seasonalImages = def => [def.image, ...(def.seasons || []).map(k => seasonalImage(def, [k]))];

/** One of a lit entry's masks (design/day-night.md §5), on the same canvas and frames as its base
 *  image: 'glow', its emitting pixels only (lamp_post.png → lamp_post_glow.png), or 'wash', light
 *  added over it (the Customs House's tower); they're drawn in the order the entry lists them */
const maskImage = (def, mask) => def.image.replace(/\.png$/, `_${mask}.png`);

/** The clock's hour of the day, in fractions: 6 (6 AM) to 26 (2 AM) */
const clockHour = clock => DAY_START_HOUR + clock.gameMinute / 60;

/** An hour as the HUD reads it: 17.5 → "5:30 PM", 25 → "1:00 AM" */
const timeOfDay = hour => {
    const minutes = Math.round(hour * 60), h24 = Math.floor(minutes / 60) % 24, m = minutes % 60;
    return `${h24 % 12 || 12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
};

/** The light at clock hour h in a season and weather (design/day-night.md §1.1, §3.2): { phase,
 *  ambient }. The ambient blends in RGB between keyframes set from the season's sunrise R and
 *  sunset S, and each keyframe opens its phase: night until R - DAWN_BEFORE, then NIGHT → DAWN (at
 *  the dawn's middle) → DAY by R + DAWN_AFTER; DAY → GOLDEN over the hour before S; GOLDEN → DUSK
 *  (at the dusk's middle) → NIGHT by S + DUSK_FOR; NIGHT → LATE from LATE_FROM, held to the day's
 *  end. On a snow day the night is SNOW_NIGHT, and late night darkens from it by the same ratio
 *  as any other (LATE × SNOW_NIGHT / NIGHT, channel by channel); on a rain day DAY and GOLDEN are
 *  OVERCAST */
const daylightOf = (h, season, weather) => {
    const L = params.LIGHT, { sunrise: R, sunset: S } = params.DAYLIGHT[season], min = 1 / 60;
    const snow  = weather === 'snow', rain = weather === 'rain';
    const NIGHT = snow ? L.SNOW_NIGHT : L.NIGHT;
    const LATE  = snow ? L.LATE.map((v, c) => Math.round(v * L.SNOW_NIGHT[c] / L.NIGHT[c])) : L.LATE;
    // Under cloud there's no golden hour: overcast all day, then dusk
    const DAY = rain ? params.RAIN.OVERCAST : L.DAY, GOLDEN = rain ? params.RAIN.OVERCAST : L.GOLDEN;
    const keys = [
        [R - L.DAWN_BEFORE * min,                       NIGHT,    'dawn'],
        [R + (L.DAWN_AFTER - L.DAWN_BEFORE) / 2 * min,  L.DAWN,   'dawn'],
        [R + L.DAWN_AFTER * min,                        DAY,      'day'],
        [S - L.GOLDEN_FOR * min,                        DAY,      rain ? 'day' : 'golden hour'],
        [S,                                             GOLDEN,   'dusk'],
        [S + L.DUSK_FOR / 2 * min,                      L.DUSK,   'dusk'],
        [S + L.DUSK_FOR * min,                          NIGHT,    'night'],
        [L.LATE_FROM,                                   NIGHT,    'late night'],
        [L.LATE_FROM + L.LATE_RAMP * min,               LATE,     'late night'],
    ];
    const i = keys.findLastIndex(([at]) => at <= h);
    if (i < 0) return { phase: 'night', ambient: NIGHT };
    const [at, from, phase] = keys[i], next = keys[i + 1];
    if (!next) return { phase, ambient: from };
    const t = (h - at) / (next[0] - at);
    return { phase, ambient: from.map((v, c) => Math.round(v + (next[1][c] - v) * t)) };
};

/** A building's hours today, [open, close] in clock hours, or null if it's closed all day: its
 *  `daily` hours, else its `weekends` on Saturday and Sunday and its `weekdays` otherwise */
const hoursToday = (b, clock) => {
    const h = b.hours;
    if (!h) return null;
    if (h.daily) return h.daily;
    return (['Sat', 'Sun'].includes(clock.getDayName()) ? h.weekends : h.weekdays) || null;
};

/** Whether a building is open now, within its hours today */
const buildingOpen = (b, clock) => {
    const today = hoursToday(b, clock), h = clockHour(clock);
    return !!today && h >= today[0] && h < today[1];
};

/** Whether the street lamps are on at clock hour h in a season: a photocell, on from LAMPS_ON
 *  minutes from sunset to LAMPS_OFF minutes from sunrise */
const lampsOn = (h, season) => {
    const L = params.LIGHT, { sunrise, sunset } = params.DAYLIGHT[season];
    return h >= sunset + L.LAMPS_ON / 60 || h < sunrise + L.LAMPS_OFF / 60;
};

/** Character sheet row for a screen-space velocity (y down): 0 S, 1 SE, 2 E, 3 NE, 4 N, 5 NW, 6 W, 7 SW */
const dirIndex8 = (dx, dy) => (Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) + 8) % 8;

/** Tracks per-key edge transitions (just-pressed detection).
 *  Call tap() each frame — returns true only on the first frame the key is down.
 *  Case variants handled automatically (e matches 'e' and 'E'). */
class KeyEdge {
    constructor() { this._prev = {}; }

    tap(key, gameKeys) {
        const isDown = !!(gameKeys &&
            (gameKeys[key] || gameKeys[key.toLowerCase()] || gameKeys[key.toUpperCase()]));
        const was        = !!this._prev[key];
        this._prev[key]  = isDown;
        return isDown && !was;
    }

    held(key, gameKeys) {
        return !!(gameKeys &&
            (gameKeys[key] || gameKeys[key.toLowerCase()] || gameKeys[key.toUpperCase()]));
    }
}

/** Convert a quality-fraction to a letter grade. Used by Task and TaskInteractionSystem. */
function gradeFromPct(pct) {
    if (pct >= 1.30) return 'A+++';
    if (pct >= 1.15) return 'A++';
    if (pct >= 1.00) return 'A+';
    if (pct >= 0.90) return 'A';
    if (pct >= 0.80) return 'B';
    if (pct >= 0.70) return 'C';
    if (pct >= 0.60) return 'D';
    return 'F';
}

/** Convert a hex color string to an "r,g,b" string for use in rgba(). */
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

/** Drives a linear sequence of named phases.
 *  Each phase: { id, onEnter(game,data), condition(game,data), onComplete(game,data) }
 *  onEnter fires once on entry. condition is polled every frame; advance when true.
 *  data is a shared mutable object passed to all callbacks. */
class PhaseRunner {
    constructor(phases) {
        this.phases   = phases;
        this.current  = 0;
        this.data     = {};
        this.done     = false;
        this._entered = false;
    }

    get phase() { return this.phases[this.current] || null; }

    update(game) {
        if (this.done || this.current >= this.phases.length) { this.done = true; return; }
        const phase = this.phases[this.current];
        if (!this._entered) {
            this._entered = true;
            if (phase.onEnter) phase.onEnter(game, this.data);
        }
        if (phase.condition && phase.condition(game, this.data)) {
            if (phase.onComplete) phase.onComplete(game, this.data);
            this.current++;
            this._entered = false;
            if (this.current >= this.phases.length) this.done = true;
        }
    }
}

// Text (formats-font note): every string the game draws goes through drawText in a named style,
// and every width through textWidth, in Campus Terminal 8: an 8 art px bitmap font
// (sprites/ui/font_campus_terminal_8.png), drawn at ART_SCALE like everything else. Its cells run
// 8 to a row in `glyphs` order, black ink on clear; each glyph's ink starts `left` px into its
// cell and it advances its ink width + 1 (tools/font_table.py writes the table from the atlas).
// Capitals stand 6 px on the baseline (row 6); descenders reach row 8; a line is 10 px. A
// character the font lacks draws as `?`, so a gap shows instead of vanishing.
const FONT = {
    image: 'sprites/ui/font_campus_terminal_8.png', cell: 8, columns: 8, baseline: 6, cap: 6, line: 10,
    glyphs:  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?:;\'"-+()0123456789/%*=_$#&<>@[\\]^`{|}~\u2014\u2013\u2026\u00b7\u00e9\u00e1\u2019\u00d7\u2713\u25b6\u25c0\u25b7\u25cb\u2192\u2190\u2191\u2193\u26a0\u2605\u2717',
    left:    { 2: 'Iabcdefghijklnopqrstuvxyz"-1<', 3: '.,!:;\'()' },      // else 1
    advance: { 2: '.,!:;\'|\u00b7', 3: ' ()[]`\u2019', 4: 'Ifijlt"1<>', 5: 'abcdeghknopqrsuvxyz-{}\u2013\u00e9\u00e1', 7: '\u2713', 8: '\u2014' },  // else 6
};
// Each character's { sx, sy, w, advance } in art px (w its ink), built once from FONT
const FONT_METRICS = (() => {
    const of = (table, ch, fallback) => Number(Object.keys(table).find(k => table[k].includes(ch)) ?? fallback);
    const m = new Map();
    [...FONT.glyphs].forEach((ch, i) => {
        const left = of(FONT.left, ch, 1), advance = of(FONT.advance, ch, 6);
        m.set(ch, { sx: (i % FONT.columns) * FONT.cell + left, sy: Math.floor(i / FONT.columns) * FONT.cell, w: advance - 1, advance });
    });
    m.set(' ', { sx: 0, sy: 0, w: 0, advance: 3 });
    return m;
})();
const glyphOf = ch => FONT_METRICS.get(ch) || FONT_METRICS.get('?');
const TEXT_LINE = FONT.line * params.ART_SCALE;    // px from one line of text to the next
const BUBBLE_PAD  = 6;                              // px either side of a speech bubble's text
const BUBBLE_TAIL = 12;                             // px a speech bubble's tail reaches below it

// The styles the sites name. Every style draws the one font at ART_SCALE (no second size: ART.md
// §2); titles (panel and HUD titles, the clock) are set apart by a 1 art px drop shadow, their
// colour coming from the site. The other names are what the sites called their canvas fonts, kept
// so a later pass can tell emphasis apart
const TEXT_SHADOW = 'rgba(0, 0, 0, 0.35)';
const TEXT_STYLES = {
    tiny: {}, micro: {}, small: {}, note: {}, body: {}, text: {}, large: {}, heading: {},
    noteBold: {}, bodyBold: {}, textBold: {}, largeBold: {},
    headingBold: { shadow: true }, title: { shadow: true }, titleLarge: { shadow: true }, clock: { shadow: true },
};

// A copy of an image tinted to a colour, on a canvas of its size: 'source-in' paints its pixels
// flat in the colour (the font's black ink), 'multiply' shades them by it (the name plate, the
// night), keeping their alpha
function tintedCopy(img, color, mode) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const t = c.getContext('2d');
    t.drawImage(img, 0, 0);
    t.globalCompositeOperation = mode;
    t.fillStyle = color;
    t.fillRect(0, 0, c.width, c.height);
    if (mode !== 'source-in') { t.globalCompositeOperation = 'destination-in'; t.drawImage(img, 0, 0); }
    return c;
}

// An asset tinted to a colour, made once per path, colour and mode (tintedCopy)
const TINTS = new Map();
function tintImage(path, color, mode) {
    const key = path + '|' + mode + '|' + color;
    if (!TINTS.has(key)) TINTS.set(key, tintedCopy(ASSET_MANAGER.getAsset(path), color, mode));
    return TINTS.get(key);
}

/** Draws `text` at x, y in a TEXT_STYLES style: y is the line as the context's textBaseline says
 *  (alphabetic: the baseline; middle: the capitals' middle; top: their top), x as its textAlign
 *  says. It takes the colour and alignment it's given, or the context's current ones */
function drawText(ctx, text, x, y, style, color, align) {
    if (color !== undefined) ctx.fillStyle = color;
    if (align !== undefined) ctx.textAlign = align;
    const k = params.ART_SCALE, str = String(text), w = textWidth(str, style);
    const a = ctx.textAlign, b = ctx.textBaseline;
    const left = Math.round(a === 'center' ? x - w / 2 : a === 'right' || a === 'end' ? x - w : x);
    const top  = Math.round(b === 'middle' ? y - FONT.cap / 2 * k : b === 'top' || b === 'hanging' ? y
                          : b === 'bottom' || b === 'ideographic' ? y - FONT.cell * k : y - FONT.baseline * k);
    const run = (tint, dx, dy) => {
        let pen = left + dx;
        for (const ch of str) {
            const g = glyphOf(ch);
            if (g.w > 0) ctx.drawImage(tint, g.sx, g.sy, g.w, FONT.cell, pen, top + dy, g.w * k, FONT.cell * k);
            pen += g.advance * k;
        }
    };
    if (TEXT_STYLES[style].shadow) run(tintImage(FONT.image, TEXT_SHADOW, 'source-in'), k, k);
    run(tintImage(FONT.image, ctx.fillStyle, 'source-in'), 0, 0);
}

/** Width in px of `text` drawn in a TEXT_STYLES style */
function textWidth(text, style) {
    let w = 0;
    for (const ch of String(text)) w += glyphOf(ch).advance;
    return w * params.ART_SCALE;
}

/** `text` broken into lines no wider than maxW px, at spaces */
function wrapText(text, maxW, style) {
    const lines = [];
    let line = '';
    for (const word of String(text).split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (line && textWidth(test, style) > maxW) { lines.push(line); line = word; }
        else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

/** `text` as it fits in maxW px: whole, or cut short with an ellipsis */
function fitText(text, maxW, style) {
    let s = String(text);
    if (textWidth(s, style) <= maxW) return s;
    while (s && textWidth(s + '\u2026', style) > maxW) s = s.slice(0, -1);
    return s.trimEnd() + '\u2026';
}

// UI panels (formats-animation-ui note, design/ui-assets.md): every panel, dialogue box, chip,
// bubble and the HUD bar draws through drawPanel by kind, as a 9-slice of the UI frame sheet
// (UI_FRAMES, sprites/ui/ui_frames.json). A kind is paper (cream in a wood frame: what the player
// reads), dark (slate in a thin rim: what sits over the world, and the dense grids) or the wood
// sign plank (design/ui-assets.md §1).
//
// Each kind also carries its inks, the colours the sites draw on it with: title, text, dim,
// faint, hint and rule (the caller's accent, a speaker's or a shop's, is its own). Colours that
// mean something (status, money, skills, the timeline and calendar entries, task modes) stay at
// the sites

// The frame sheet's pieces in art px: the source rect, how far in each border goes (a 3-slice, the
// HUD strip, has no top or bottom border) and its rim, the frame's width outside the cream or
// slate it holds. A panel's box is that inner area, the one its site lays out on: the rim stands
// outside it, so a site's layout doesn't depend on its frame. The HUD strip lies on the screen's
// top edge, so it has none. A textured piece (`tile`, the sign's wood grain) repeats its edges and
// centre at ART_SCALE instead of stretching them
const UI_FRAMES = {
    image: 'sprites/ui/ui_frames.png',
    // l and t are 11, not the JSON's 10: the 1 px inner shadow on the top and left is edge, not middle
    panel:          { sx: 0, sy: 0, w: 48, h: 48, l: 11, t: 11, r: 10, b: 10, rim: 10 },
    dialogue:       { sx: 48, sy: 0, w: 48, h: 48, l: 11, t: 11, r: 10, b: 10, rim: 10 },   // a ledge top left for the plate
    nameplate:      { sx: 96, sy: 0, w: 32, h: 12, l: 4, t: 0, r: 4, b: 0, rim: 0, tile: true },
    dark:           { sx: 144, sy: 0, w: 48, h: 48, l: 8, t: 8, r: 8, b: 8, rim: 3 },
    hud:            { sx: 192, sy: 0, w: 48, h: 44, l: 8, t: 0, r: 8, b: 0, rim: 0 },
    chip:           { sx: 240, sy: 0, w: 16, h: 16, l: 4, t: 4, r: 4, b: 4, rim: 2 },
    bubble:         { sx: 288, sy: 0, w: 16, h: 16, l: 4, t: 4, r: 4, b: 4, rim: 1 },
    sign:           { sx: 336, sy: 0, w: 24, h: 16, l: 6, t: 6, r: 6, b: 6, rim: 2, tile: true },
    keycap:         { sx: 0, sy: 96, w: 12, h: 12, l: 3, t: 3, r: 3, b: 3, rim: 0 },   // a light face over a darker lip
};

/** Draws a 9-slice `piece` of `img` over x, y, w, h: corners at ART_SCALE, edges and centre
 *  stretched between them, or repeated if the piece tiles. A box smaller than the corners lets
 *  them overlap */
function drawNineSlice(ctx, img, piece, x, y, w, h) {
    const k = params.ART_SCALE, { sx, sy, l, t, r, b } = piece;
    const mw = piece.w - l - r, mh = piece.h - t - b;              // the source middle
    const cols = [[sx, l, x, l * k], [sx + l, mw, x + l * k, w - (l + r) * k], [sx + l + mw, r, x + w - r * k, r * k]];
    const rows = [[sy, t, y, t * k], [sy + t, mh, y + t * k, h - (t + b) * k], [sy + t + mh, b, y + h - b * k, b * k]];
    for (const [rsy, rsh, ry, rh] of rows) for (const [csx, csw, cx, cw] of cols) {
        if (rsh <= 0 || csw <= 0 || rh <= 0 || cw <= 0) continue;
        if (!piece.tile) { ctx.drawImage(img, csx, rsy, csw, rsh, cx, ry, cw, rh); continue; }
        // Repeat the source cell at scale k across the destination, cropping the last one
        for (let dy = 0; dy < rh; dy += rsh * k) for (let dx = 0; dx < cw; dx += csw * k) {
            const dw = Math.min(csw * k, cw - dx), dh = Math.min(rsh * k, rh - dy);
            ctx.drawImage(img, csx, rsy, dw / k, dh / k, cx + dx, ry + dy, dw, dh);
        }
    }
}

// Inks on cream paper, from the frame's own wood and fir colours. On the dark kinds the dim, faint,
// hint and rule inks keep the contrast they had on the old navy, now against the lighter slate
const PAPER_INK = { title: '#5b3628', text: '#2a2119', dim: '#5e4c3a', faint: '#7d6c55', hint: '#8a7860', rule: '#c9bc9f' };
const PANEL_LOOKS = {
    hud:      { frame: 'hud',
                ink: { title: '#e8d5a3', text: '#ccc', dim: '#b7b7cf', faint: '#666666', hint: '#575775', rule: '#5c5c79' } },
    sheet:    { frame: 'panel', ink: PAPER_INK },     // char sheet, inventory
    talk:     { frame: 'dialogue', ink: PAPER_INK },  // drawDialogue: NPC talk and scene lines
    window:   { frame: 'panel', ink: PAPER_INK },     // registration, shop
    alarm:    { frame: 'panel', ink: PAPER_INK },
    summary:  { frame: 'panel', ink: PAPER_INK },
    bubble:   { frame: 'bubble', ink: PAPER_INK },
    calendar: { frame: 'dark',
                ink: { title: '#5b9bd5', text: '#fff', dim: '#7e97a4', faint: '#6e88a1', hint: '#5a7482', rule: '#465667' } },   // rule lifted ~20% in value (audit 2 #15)
    menu:     { frame: 'dark',                         // a station's task menu
                ink: { title: '#f5c842', text: '#c0c0d0', dim: '#a7a7a7', faint: '#5e5e5e', hint: '#707070', rule: '#444460' } },
    list:     { frame: 'dark',                         // the project panel
                ink: { title: '#e8d5a3', text: '#c0c0d0', dim: '#9fa8da', faint: '#505050', hint: '#5e5e7b', rule: '#444460' } },
    chip:     { frame: 'chip', ink: { title: '#e8d5a3', text: '#e8d5a3', dim: '#b5b5b5', faint: '#696969', hint: '#696985', rule: '#50506b' } },  // prompts, notifications
    sign:     { frame: 'sign',                         // "E: Registration Office", a shop's
                ink: { title: '#f0e4c8', text: '#f0e4c8', dim: '#d8c8a8', faint: '#a89070', hint: '#a89070', rule: '#a89070' } },
};

// A colour that means something (a skill, a status, money, a speaker's or a shop's accent) keeps
// its hue on paper but darkens until it reads on the cream: 4.5:1 contrast (WCAG AA), in 5% steps
const PAPER_CREAM = [230, 220, 196];
const PAPER_COLOURS = new Map();
function onPaper(color) {
    if (PAPER_COLOURS.has(color)) return PAPER_COLOURS.get(color);
    const hex = color.length === 4 ? [...color.slice(1)].map(d => d + d) : color.slice(1).match(/../g);
    const rgb = hex.map(h => parseInt(h, 16));
    const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
                       return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const paper = lum(PAPER_CREAM);
    let f = 1;
    while ((paper + 0.05) / (lum(rgb.map(v => v * f)) + 0.05) < 4.5) f -= 0.05;
    const out = '#' + rgb.map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
    PAPER_COLOURS.set(color, out);
    return out;
}

/** Draws a key-cap with `key` on it (the font draws the letter), its top-left at x, y; returns its width */
function drawKeycap(ctx, key, x, y) {
    const k = params.ART_SCALE, piece = UI_FRAMES.keycap;
    const w = Math.max(piece.w * k, textWidth(key, 'note') + 2 * piece.l * k);
    drawNineSlice(ctx, ASSET_MANAGER.getAsset(UI_FRAMES.image), piece, Math.round(x), Math.round(y), w, piece.h * k);
    const a = ctx.textAlign, b = ctx.textBaseline;
    ctx.textBaseline = 'alphabetic';
    drawText(ctx, key, x + w / 2, y + 16, 'note', PAPER_INK.text, 'center');
    ctx.textAlign = a; ctx.textBaseline = b;
    return w;
}

/** A course's code from its label: "CS 101 — Intro to Programming" → "CS 101" */
const courseCode = label => String(label).split(' \u2014 ')[0];

/** Draws a UI panel of `kind` (PANEL_LOOKS) around the box x, y, w, h: its fill over the box, its
 *  rim outside it */
/** A counter's E prompt (registration, a shop) on its sign plank in the HUD's prompt slot, at the
 *  foot of the screen where "E — talk" shows (E has one target, so the two never meet): never over
 *  the counter, the wall behind it, or the player standing at it. Screen space */
function drawPromptSign(game, label, ink) {
    const ctx = game.ctx;
    const sx = ctx.canvas.width / 2, bottom = ctx.canvas.height - 34;   // clear of the key help line
    const tw = textWidth(label, 'large') + 16;
    ctx.save();
    drawPanel(ctx, 'sign', sx - tw / 2, bottom - 20, tw, 20);
    ctx.fillStyle    = ink;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    drawText(ctx, label, sx, bottom - 10, 'large');
    ctx.restore();
}

function drawPanel(ctx, kind, x, y, w, h) {
    const piece = UI_FRAMES[PANEL_LOOKS[kind].frame], o = piece.rim * params.ART_SCALE;
    // Whole pixels, so the art's pixels stay square (a site's box may come from a text width)
    [x, y, w, h] = [x, y, w, h].map(Math.round);
    drawNineSlice(ctx, ASSET_MANAGER.getAsset(UI_FRAMES.image), piece, x - o, y - o, w + 2 * o, h + 2 * o);
}

// UI icons (sprites/ui/ui_icons.png, names from ui_icons.json): 16 art px cells, 8 to a row, drawn
// at ART_SCALE. An animated icon is a run of consecutive cells at its own fps, stepped on
// game.animTime (no phase: one of each kind shows at a time)
const ICONS = {
    image: 'sprites/ui/ui_icons.png', cell: 16, columns: 8,
    cells: {
        money: 0, reputation: 1, clock: 2, calendar: 3, wb_thriving: 4, wb_stable: 5, wb_stressed: 6,
        wb_depleted: 7, wb_burning_out: 8, wb_burned_out: 9, skill_cs: 10, skill_bio: 11,
        skill_physics: 12, skill_chem: 13, skill_stats: 14, m_reading: 15, m_writing: 16, m_coding: 17,
        m_calculating: 18, m_wetlab: 19, m_teaching: 20, it_dorm_key: 21, it_notebook: 22,
        it_used_textbook: 23, it_new_textbook: 24, it_coffee: 25, it_basic_meal: 26, mode_active: 27,
        mode_triggered: 28, mode_passive: 29, mode_submit: 30, st_done: 31, st_running: 32,
        st_conflict: 33, st_locked: 34, shop_cafe: 35, shop_bookstore: 36, sleep_bed: 37,
        sleep_alarm: 38, bubble_tail: 39, arrow_left_normal: 40, arrow_right_normal: 41,
        arrow_left_selected: 42, arrow_right_selected: 43, arrow_left_pressed: 44,
        arrow_right_pressed: 45, now_caret: 46,
        continue: { at: 47, frames: 2, fps: 2 }, marker: { at: 49, frames: 2, fps: 2 }, running: { at: 51, frames: 3, fps: 4 },
    },
};

// The one dialogue box, for NPC talk and scene lines alike (audit #22): bottom centre of the
// screen, the speaker's portrait (frame 0 of their strip, 64 art px) at its left, their name on a
// plate tinted by their colour over its top edge, the line word-wrapped beside the portrait, and
// a footer: the choices on the left, the hint on the right with the continue arrow when there's
// more. `d` is { name, color, text, choices: [{ key, label }], hint, more }
const DIALOGUE = { w: 600, h: 168, margin: 28, pad: 16, portrait: 64 };
function drawDialogue(ctx, W, H, d, time) {
    const k = params.ART_SCALE, ink = PANEL_LOOKS.talk.ink, { pad } = DIALOGUE;
    const rim = UI_FRAMES[PANEL_LOOKS.talk.frame].rim * k;
    const x = Math.round((W - DIALOGUE.w) / 2), y = H - DIALOGUE.h - rim - DIALOGUE.margin;
    drawPanel(ctx, 'talk', x, y, DIALOGUE.w, DIALOGUE.h);

    // Portrait, then the line beside it
    const sheet = CHARACTER_SHEETS[d.name], P = DIALOGUE.portrait * k;
    let tx = x + pad;
    if (sheet && sheet.portrait) {
        ctx.drawImage(ASSET_MANAGER.getAsset(sheet.portrait), 0, 0, DIALOGUE.portrait, DIALOGUE.portrait, x + pad, y + 16, P, P);
        tx += P + pad;
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ink.text;
    wrapText(d.text, x + DIALOGUE.w - pad - tx, 'text').forEach((line, i) => drawText(ctx, line, tx, y + 36 + i * TEXT_LINE, 'text'));

    // Name plate over the top edge, from the frame's ledge
    const plateW = textWidth(d.name, 'headingBold') + 2 * pad, plateH = UI_FRAMES.nameplate.h * k;
    const plateX = x - rim + 2 * k, plateY = y - rim - 5 * k;
    drawNineSlice(ctx, tintImage(UI_FRAMES.image, d.color || '#ffffff', 'multiply'), UI_FRAMES.nameplate, plateX, plateY, plateW, plateH);
    drawText(ctx, d.name, plateX + pad, plateY + plateH - 6, 'headingBold', PANEL_LOOKS.sign.ink.text);   // cream, as on the wood sign

    // Footer
    const fy = y + DIALOGUE.h - 12;
    if (d.choices) {
        ctx.fillStyle = ink.dim;
        drawText(ctx, d.choices.map(c => `[${c.key.toUpperCase()}] ${c.label}`).join('    '), tx, fy, 'text');
    }
    const arrow = d.more ? ICON_SIZE : 0;
    ctx.fillStyle = ink.hint;
    drawText(ctx, d.hint, x + DIALOGUE.w - pad - arrow, fy, 'note', ink.hint, 'right');
    ctx.textAlign = 'left';
    if (d.more) drawIcon(ctx, 'continue', x + DIALOGUE.w - pad - ICON_SIZE + 4, fy - 22, time);
}

// The icon each thing the game shows has: items by id, skills by key, wellbeing by state
const ITEM_ICONS = { 'dorm-key': 'it_dorm_key', notebook: 'it_notebook', 'textbook-used': 'it_used_textbook',
                     'textbook-new': 'it_new_textbook', coffee: 'it_coffee', 'meal-basic': 'it_basic_meal',
                     // Owen's menu, until it has its own icons: the meal plate for the meals and chowder
                     'turkey-swiss': 'it_basic_meal', 'the-cascade': 'it_basic_meal', 'clam-chowder': 'it_basic_meal' };
const SKILL_ICONS = { cs: 'skill_cs', bio: 'skill_bio', physics: 'skill_physics', chem: 'skill_chem', stats: 'skill_stats',
                      reading: 'm_reading', writing: 'm_writing', coding: 'm_coding', calculating: 'm_calculating',
                      wetLab: 'm_wetlab', teaching: 'm_teaching' };
const WELLBEING_ICONS = { thriving: 'wb_thriving', stable: 'wb_stable', stressed: 'wb_stressed', depleted: 'wb_depleted',
                          'burning-out': 'wb_burning_out', 'burned-out': 'wb_burned_out' };
const ICON_SIZE = ICONS.cell * params.ART_SCALE;   // px an icon covers on screen

/** Draws icon `name` with its cell's top-left at x, y; an animated one shows its frame at time t */
function drawIcon(ctx, name, x, y, t = 0) {
    const e = ICONS.cells[name], c = ICONS.cell;
    const i = typeof e === 'number' ? e : e.at + Math.floor(t * e.fps) % e.frames;
    ctx.drawImage(ASSET_MANAGER.getAsset(ICONS.image), (i % ICONS.columns) * c, Math.floor(i / ICONS.columns) * c, c, c,
                  x, y, c * params.ART_SCALE, c * params.ART_SCALE);
}

/** A building's street doors: { cols, row, front } — its front-wall door cells, or for a building
 *  whose only doors are in its back wall (a north-facing one) those (front false); null for a
 *  building without doors */
function streetDoors(level, b) {
    const isDoor = (c, r) => level.tiles[r][c] === params.TILES.DOOR;
    const cols = r => Array.from({ length: b.width }, (_, i) => b.col + i).filter(c => isDoor(c, r));
    const front = cols(b.row + b.height - 1), back = cols(b.row);
    if (front.length) return { cols: front, row: b.row + b.height - 1, front: true };
    return back.length ? { cols: back, row: b.row, front: false } : null;
}

/** Where a building shows its name: { name, x, y, door } with x, y the text's point and door the
 *  door cell's centre: below its street doors (their middle, for double doors), or above a
 *  north-facing one's wall; none for a building without doors */
/** A home's name plate from its residents' names: a doctor by surname, anyone else by first name
 *  unless another character (`everyone`, the player included) shares it, then by surname; in the
 *  possessive ("Marriott's", "Sam & Travis's"). A home no one lives in reads "Vacant" */
function homePlate(names, everyone) {
    if (!names.length) return 'Vacant';
    const first = n => n.split(' ')[0];
    const shared = n => everyone.some(o => o !== n && first(o) === first(n));
    const short = n => n.startsWith('Dr. ') ? n.slice(4) : shared(n) ? n.split(' ').slice(1).join(' ') : first(n);
    return `${names.map(short).join(' & ')}'s`;
}

function buildingSign(level, b, name = b.name) {
    const ts = level.tileSize, d = streetDoors(level, b);
    if (!d) return null;
    const x = (d.cols[0] + d.cols[d.cols.length - 1] + 1) / 2 * ts;
    return { name, x, y: d.front ? (d.row + 1) * ts + 14 : d.row * ts - 6,
             door: { x, y: (d.row + 0.5) * ts } };
}
