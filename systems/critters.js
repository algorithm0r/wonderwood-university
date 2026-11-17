// CritterSystem — the animals (design/ambient-life.md). One state machine for every kind:
// - idle: its loop plays for a while, then (if it walks) it steps to a nearby spot of its habitat;
// - flee: any agent (the player or an NPC) within its `flee` radius sends it off: a bird takes off,
//   flies away from the threat and lands on a spot of its habitat 8 to 14 cells off, or leaves the
//   view if there's none that way; a perched gull on a perch over the water (`safe`) stays put, and
//   no gull flies at night;
// - a kind with cover (COVERS) goes to the nearest: a squirrel runs to a trunk and climbs into the
//   crown, a cat walks off and hides under a car or by its porch; it's gone there, and comes out
//   `back` s later once no one's near. Ducks paddle out to open water; the heron flies off along
//   the waterway;
// - leave: it flies off the view (its hours are over), and is retired there; a kind with cover
//   goes to it and stays.
// Spawning: animals are never placed by hand. Each kind's habitat is a named rule over the tiles
// (HABITATS), its spots ordered by cellHash with the day, so they're fixed for a playthrough. The
// system keeps each kind's count near the view up to its cap for the season, hour and weather
// (params.CRITTERS), at most VIEW_MAX in view: it adds one only off the view, or into it the way it
// would come (a bird flying in, a squirrel down its trunk, a cat out of its cover), and retires one
// only off the view, so nothing appears or vanishes on screen. On the first frame, or when the view
// jumps, it fills the view's spots at once (there's no frame before to pop in on).
// game.critters is its list; an animal is an entity (no collider: it never blocks), drawn in the
// sorted pass on the ground, and in the air pass with its shadow on the ground beneath while it's up.

class CritterSystem {
    constructor() {
        this.habitats = null;   // kind → its spots [{ x, y, seed?, safe? }], once the level is known
        this.covers   = null;   // kind → its cover points [{ x, y, tree? }] (COVERS)
        this.open     = null;   // the open water a duck flees to (FLEE_TO.openWater)
        this.list     = [];
        this.lastCam  = null;
        this.wait     = {};     // kind → s until it may add another
        this.forced   = null;   // a kind seeCritters brought in, whatever the hour
    }

    update(dt, game) {
        if (!game.currentLevel || !game.clock || !game.quarter || !game.camera || !game.ctx) return;
        game.critters = this.list;
        if (game.paused) return;
        const C = params.CRITTERS;
        if (!this.habitats) {
            this.habitats = critterHabitats(game);
            this.covers = Object.fromEntries(Object.entries(C).filter(([, d]) => d && d.art && d.cover).map(([k, d]) => [k, COVERS[d.cover](game, d)]));
        }
        this.agents = this.agents || game.entities.filter(e => e.agent);
        const view = viewBox(game), m = C.MARGIN * 64;
        const near = { x: view.x - m, y: view.y - m, w: view.w + 2 * m, h: view.h + 2 * m };
        const jumped = !this.lastCam || Math.hypot(game.camera.x - this.lastCam.x, game.camera.y - this.lastCam.y) > view.w / 2;
        this.lastCam = { ...game.camera };

        // who's in view, by kind and in all: a walk doesn't step into a full view
        this.inView = { all: 0 };
        for (const e of this.list) if (inBox(groundPoint(e), view)) { this.inView[e.critter.kind] = (this.inView[e.critter.kind] || 0) + 1; this.inView.all++; }
        for (const e of this.list) this.step(e, dt, game, view);
        // Retire what's off the view and far out, or flown off it
        this.list = this.list.filter(e => {
            const out = !inBox(groundPoint(e), { x: near.x - m, y: near.y - m, w: near.w + 2 * m, h: near.h + 2 * m }) ||
                        e.critter.state === 'leave' && !inBox(groundPoint(e), near);
            if (out) { e.removeFromWorld = true; if (e.critter.perch) e.critter.perch.taken = null; }
            return !out;
        });
        game.critters = this.list;

        let inView = this.list.filter(e => inBox(groundPoint(e), view)).length;
        for (const kind of Object.keys(C)) {
            const def = C[kind];
            if (!def || !def.art) continue;
            this.wait[kind] = (this.wait[kind] || 0) - dt;
            const share = this.forced === kind ? 1 : about(def, game);
            const mine = this.list.filter(e => e.critter.kind === kind);
            if (!share) {   // its hours are over: whoever's in view flies off or goes to cover, the rest go when out of sight
                for (const e of mine) {
                    const k = e.critter;
                    if (def.flies && k.state !== 'leave') this.leave(e, view);
                    else if (def.cover && !k.home) { k.home = true; if (['idle', 'walk'].includes(k.state)) this.toCover(e); }
                }
                continue;
            }
            const cap = Math.round(def.map * share), viewCap = Math.min(def.view, Math.max(1, Math.round(def.view * share)));
            const mineIn = mine.filter(e => inBox(groundPoint(e), view)).length;
            if (mine.length >= cap || (!jumped && this.wait[kind] > 0)) continue;
            const group = def.group ? def.group[0] + cellHash(game.clock.day, mine.length + 7) % (def.group[1] - def.group[0] + 1) : 1;
            const room = Math.min(cap - mine.length, group);
            const spots = this.freeSpots(kind, near);
            if (!spots.length) continue;
            // one comes into the view only the way it would: flying in, or out of its cover
            const toView = (jumped || def.flies || def.cover) && inView < C.VIEW_MAX && mineIn < viewCap;
            // Where they go: in the view if there's room (and on a jump, straight there), else off it
            const pool = toView ? spots.filter(s => inBox(s, view)) : spots.filter(s => !inBox(s, view));
            if (!pool.length) continue;
            const first = pool[0], flock = [first, ...pool.slice(1).filter(s => Math.hypot(s.x - first.x, s.y - first.y) < 3 * 64)]
                .slice(0, Math.min(room, toView ? Math.min(viewCap - mineIn, C.VIEW_MAX - inView) : room));
            for (const spot of flock) {
                const e = createCritter(game, kind, spot);
                this.list.push(e);
                if (spot.seed) spot.taken = e;
                if (toView && !jumped && def.flies) this.arrive(e, spot, view);
                else if (toView && !jumped && def.cover) this.fromCover(e, spot);
                if (toView) inView++;
            }
            this.wait[kind] = 1 + (cellHash(this.list.length, kind.length) % 30) / 10;
        }
        if (this.forced) this.forced = null;
    }

    // A habitat's spots near the view not held by anyone, in the day's order
    freeSpots(kind, near) {
        const held = new Set(this.list.filter(e => e.critter.kind === kind).map(e => e.critter.to || groundPoint(e)).map(p => `${Math.floor(p.x / 64)},${Math.floor(p.y / 64)}`));
        return this.habitats[kind].filter(s => inBox(s, near) && !s.taken && !held.has(`${Math.floor(s.x / 64)},${Math.floor(s.y / 64)}`));
    }

    // The agent nearest a point within r px, if any
    threat(p, r) {
        return this.agents.find(a => Math.hypot(groundPoint(a).x - p.x, groundPoint(a).y - p.y) < r);
    }

    // One animal's tick: flee if someone's near, else carry on with what it's doing
    step(e, dt, game, view) {
        const k = e.critter, def = params.CRITTERS[k.kind], g = groundPoint(e), C = params.CRITTERS;
        k.clock += dt;
        if (['idle', 'walk'].includes(k.state) && canFlee(k, def, game)) {
            const threat = this.threat(g, def.flee);
            if (threat) this.flee(e, groundPoint(threat), view);
        }
        if (k.state === 'idle') {
            k.timer -= dt;
            const anim = def.art.anims[restAnim(k, def)];
            if (anim && anim.once && (k.clock - k.animAt) * anim.fps >= anim.frames) k.anim = null;   // played through
            if (k.timer <= 0 && k.to && !k.home) { k.state = 'walk'; k.timer = 0; }   // out of cover, off to where it was going
            else if (k.timer <= 0) {
                const full = (this.inView[k.kind] || 0) >= def.view || this.inView.all >= C.VIEW_MAX, out = !inBox(g, view);
                const next = def.walk && this.habitats[k.kind].find(s => !s.taken && Math.hypot(s.x - g.x, s.y - g.y) < 2.5 * 64 &&
                    Math.hypot(s.x - g.x, s.y - g.y) > 16 && !(out && full && inBox(s, view)) &&
                    cellHash(Math.round(s.x) + Math.floor(k.clock), Math.round(s.y)) % 3 === 0);
                if (next) { k.state = 'walk'; k.to = { x: next.x, y: next.y }; }
                else if (def.idles) { k.anim = hashPick(def.idles, Math.round(g.x) + Math.floor(k.clock), Math.round(g.y)); k.animAt = k.clock; }
                const [a, b] = def.rest || [2, 6];
                k.timer = a + cellHash(Math.round(g.x), Math.floor(k.clock * 10)) % ((b - a) * 10) / 10;
            }
        } else if (k.state === 'walk') {
            if (this.move(e, def.walk, dt)) { k.state = 'idle'; k.to = null; }
        }
        const alt0 = k.alt;
        if (def.flies && ['flee', 'leave', 'arrive'].includes(k.state)) {   // in flight
            const d = this.move(e, def.run, dt, true, def.climb);
            if (d === true) {
                k.alt = 0; k.to = null; k.state = 'idle'; k.timer = 1 + Math.random() * 2;
            }
        } else if (k.state === 'flee') {   // on foot or paddling, to its cover or open water
            if (this.move(e, def.run, dt)) {
                k.to = null;
                if (k.cover) { k.state = def.cover === 'trunk' ? 'climb' : 'hide'; e.position.x = k.cover.x; e.position.y = k.cover.y; }
                else { k.state = 'idle'; k.timer = 1 + Math.random() * 2; }
            }
        } else if (k.state === 'climb' || k.state === 'hide') {   // into its cover
            if (this.conceal(e, def, dt, 1)) { k.state = 'gone'; k.timer = def.back; }
        } else if (k.state === 'gone') {   // in its cover: out again once its time's up and no one's near
            k.timer -= dt;
            if (k.timer <= 0 && !k.home && !this.threat(k.cover, def.flee)) k.state = 'emerge';
        } else if (k.state === 'emerge') {
            if (this.conceal(e, def, dt, -1)) { k.state = 'idle'; k.cover = null; k.timer = 0.5 + Math.random(); }
        }
        critterFrame(e, def, k, k.alt - alt0);
    }

    // Into its cover (dir 1) or out of it (-1): a squirrel climbs its trunk to the crown, fading
    // into it over its last TRUNK.fade px; anyone else fades over HIDE s. True once it's done
    conceal(e, def, dt, dir) {
        const k = e.critter, C = params.CRITTERS;
        if (def.cover === 'trunk') {
            const top = C.TRUNK.crown[k.cover.tree] || 40;
            k.up = Math.max(0, Math.min(top, k.up + dir * C.TRUNK.speed * dt));
            e.alpha = Math.max(0, Math.min(1, (top - k.up) / C.TRUNK.fade));
            return dir > 0 ? k.up >= top : k.up <= 0;
        }
        e.alpha = Math.max(0, Math.min(1, (e.alpha ?? 1) - dir * dt / C.HIDE));
        return dir > 0 ? e.alpha <= 0 : e.alpha >= 1;
    }

    // Off to its nearest cover, unhurried (its hours are over)
    toCover(e) {
        const k = e.critter, g = groundPoint(e);
        k.cover = nearest(this.covers[k.kind], g);
        if (k.cover) { k.state = 'flee'; k.to = { x: k.cover.x, y: k.cover.y }; }
    }

    // Comes into the view out of its cover (the cover nearest its spot), then goes to the spot
    fromCover(e, spot) {
        const k = e.critter, def = params.CRITTERS[k.kind];
        k.cover = nearest(this.covers[k.kind], spot);
        if (!k.cover) return;
        e.position.x = k.cover.x; e.position.y = k.cover.y;
        k.state = 'gone'; k.timer = 0; k.to = { x: spot.x, y: spot.y };
        if (def.cover === 'trunk') k.up = params.CRITTERS.TRUNK.crown[k.cover.tree] || 40;
        e.alpha = 0;
    }

    // Moves toward k.to at `speed` px/s (a flight climbing to CLIMB_ALT and settling over its last
    // CLIMB s, or its kind's `climb`); true once it's there. It faces its way: east or west (the art
    // faces east, so west is mirrored), or south or north where it's going more that way than across
    move(e, speed, dt, flying = false, climb = params.CRITTERS.CLIMB) {
        const k = e.critter, C = params.CRITTERS, p = e.position;
        const dx = k.to.x - p.x, dy = k.to.y - p.y, d = Math.hypot(dx, dy), stepLen = speed * dt;
        if (Math.abs(dx) > 1) k.west = dx < 0;
        if (d > 1) k.facing = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 'S' : 'N') : 'E';
        if (flying) {
            const settle = speed * climb;
            const up = Math.min(C.CLIMB_ALT, k.alt + C.CLIMB_ALT / climb * dt);
            k.alt = d < settle ? Math.min(up, C.CLIMB_ALT * d / settle) : up;
        }
        if (d <= stepLen) { p.x = k.to.x; p.y = k.to.y; return true; }
        p.x += dx / d * stepLen; p.y += dy / d * stepLen;
        return false;
    }

    // Off from a threat at (tx, ty): to its cover (the nearest); ducks to open water away from it
    // (the nearest to 4 cells off); the heron along the waterway, off the view; any other bird to a
    // spot of its habitat 8 to 14 cells away, on the far side, else off the view
    flee(e, t, view) {
        const k = e.critter, g = groundPoint(e), def = params.CRITTERS[k.kind];
        let ax = g.x - t.x, ay = g.y - t.y;
        const len = Math.hypot(ax, ay) || 1; ax /= len; ay /= len;
        if (k.perch) { k.perch.taken = null; k.perch = null; }
        k.anim = null;
        if (def.cover) return this.toCover(e);
        if (def.fleeTo === 'openWater') {
            this.open = this.open || FLEE_TO.openWater(gameEngine);
            const to = nearest(this.open, { x: g.x + ax * 4 * 64, y: g.y + ay * 4 * 64 });
            if (to) { k.state = 'flee'; k.to = { x: to.x, y: to.y }; }
            return;
        }
        if (def.fleeTo === 'away') {
            k.state = 'leave'; k.to = { x: g.x + Math.sign(ax || 1) * (view.w + view.h), y: g.y };
            return;
        }
        const away = this.habitats[k.kind].filter(s => {
            const dx = s.x - g.x, dy = s.y - g.y, d = Math.hypot(dx, dy);
            return !s.taken && d >= 8 * 64 && d <= 14 * 64 && (dx * ax + dy * ay) / d > 0.5;
        });
        const ideal = { x: g.x + ax * 11 * 64, y: g.y + ay * 11 * 64 };
        const spot = away.sort((a, b) => Math.hypot(a.x - ideal.x, a.y - ideal.y) - Math.hypot(b.x - ideal.x, b.y - ideal.y))[0];
        if (spot) {
            k.state = 'flee'; k.to = { x: spot.x, y: spot.y };
            if (spot.seed) { spot.taken = e; k.perch = spot; }
        } else {
            k.state = 'leave'; k.to = { x: g.x + ax * (view.w + view.h), y: g.y + ay * (view.w + view.h) };
        }
    }

    // Off the view, by the nearest edge
    leave(e, view) {
        const k = e.critter, g = groundPoint(e);
        if (k.perch) { k.perch.taken = null; k.perch = null; }
        const dx = g.x - (view.x + view.w / 2), dy = g.y - (view.y + view.h / 2), len = Math.hypot(dx, dy) || 1;
        k.state = 'leave'; k.to = { x: g.x + dx / len * (view.w + view.h), y: g.y + dy / len * (view.w + view.h) };
    }

    // A bird flies in to its spot from just off the view's nearest edge, already up
    arrive(e, spot, view) {
        const k = e.critter, C = params.CRITTERS;
        const left = spot.x - view.x, right = view.x + view.w - spot.x, top = spot.y - view.y, bottom = view.y + view.h - spot.y;
        const edge = Math.min(left, right, top, bottom), pad = 48;
        const from = edge === left ? { x: view.x - pad, y: spot.y } : edge === right ? { x: view.x + view.w + pad, y: spot.y }
                   : edge === top ? { x: spot.x, y: view.y - pad } : { x: spot.x, y: view.y + view.h + pad + C.CLIMB_ALT };
        e.position.x = from.x; e.position.y = from.y;
        k.alt = C.CLIMB_ALT; k.state = 'arrive'; k.to = { x: spot.x, y: spot.y };
    }
}

// The view, world px: the canvas below the HUD, at the camera
function viewBox(game) {
    const cv = game.ctx.canvas;
    return { x: game.camera.x, y: game.camera.y, w: cv.width, h: cv.height - UI_HEIGHT };
}

const inBox = (p, b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;

// Whether a critter may flee now: on the ground, not a gull at night (gulls fly by day) or on a safe perch
function canFlee(k, def, game) {
    if (k.alt > 0) return false;
    if (k.perch && k.perch.safe) return false;
    if (def.fly === 'day') { const h = clockHour(game.clock), { sunrise, sunset } = params.DAYLIGHT[game.season]; if (h < sunrise || h >= sunset) return false; }
    return true;
}

// A kind's share of its count now (0: not about): its season, hours and weather (params.CRITTERS)
function about(def, game) {
    const why = notAbout(def, game);
    if (why) return 0;
    let share = 1;
    if (def.winter !== undefined && game.season === 'winter') share *= def.winter;
    return share * rainShare(def, game);
}

// A kind's share in the rain falling now: drizzle, steady rain, a downpour (`rain`), else all of it
function rainShare(def, game) {
    if (!def.rain || game.weather !== 'rain') return 1;
    const s = rainOf(game.quarter, game.clock);
    return s > 0 ? def.rain[s >= 1 ? 2 : s >= 0.7 ? 1 : 0] : 1;
}

// Why a kind isn't about now, or '' if it is
function notAbout(def, game) {
    if (!def.art) return 'no art yet';
    if (def.snow === 0 && game.weather === 'snow') return 'the snow day';
    const h = clockHour(game.clock), { sunrise, sunset } = params.DAYLIGHT[game.season];
    const hours = def.hours && typeof def.hours === 'object' && !Array.isArray(def.hours) ? def.hours[game.season] : def.hours;
    if (hours === 'day' && (h < sunrise || h >= sunset)) return 'outside its hours (sunrise to sunset)';
    if (Array.isArray(hours)) {
        const phase = daylightOf(h, game.season, game.weather).phase;
        const named = { 'golden hour': 'day', 'late night': 'night' }[phase] || phase;
        if (!hours.includes(named)) return `outside its hours (${hours.join(', ')})`;
    }
    if (!rainShare(def, game)) return 'the rain';
    return '';
}

// Each kind's spots, by its habitat's rule (HABITATS), in the day's order (cellHash with the day),
// its seeds first
function critterHabitats(game) {
    const out = {};
    for (const [kind, def] of Object.entries(params.CRITTERS)) {
        if (!def || !def.art) continue;
        out[kind] = HABITATS[def.habitat](game, def);
    }
    return out;
}

// The open ground: grass and path cells in the open, off every building and anything solid, as
// spots (a foot point in the cell, nudged within it by cellHash so a flock doesn't stand in a grid)
// in the day's order, those `first` holds first
function openGround(game, keep = () => true, first = () => false) {
    const L = game.currentLevel, T = params.TILES, dry = dryGrid(L), day = game.clock.week * 7 + game.clock.day;
    const spots = [];
    L.tiles.forEach((row, r) => row.forEach((t, c) => {
        if ((t !== T.GRASS && t !== T.PATH) || dry[r][c] || !game.walkable[r][c] || c === 0 || c === row.length - 1 || !keep(c, r)) return;
        const h = cellHash(c, r);
        spots.push({ x: c * 64 + 16 + h % 32, y: r * 64 + 24 + (h >>> 8) % 28, order: first(c, r) ? -1 : cellHash(c * 31 + day, r) });
    }));
    return spots.sort((a, b) => a.order - b.order);
}

// Water cells by a rule over (c, r, the rows to the seawall above), off anything standing in the
// water (floats, boats, the quay's pieces: their drawn boxes), as spots in the day's order
function waterCells(game, keep) {
    const L = game.currentLevel, T = params.TILES, ts = L.tileSize, day = game.clock.week * 7 + game.clock.day;
    const boxes = game.props.filter(p => !p.decal && L.tiles[Math.floor((footY(p) - 1) / ts)] &&
        [T.WATER, T.SEAWALL, T.SEAWALL_SIDE].includes(L.tiles[Math.floor((footY(p) - 1) / ts)][Math.floor(groundPoint(p).x / ts)])).map(spriteBox);
    const spots = [];
    L.tiles.forEach((row, r) => row.forEach((t, c) => {
        if (t !== T.WATER) return;
        let wall = 1;
        while (L.tiles[r - wall] && L.tiles[r - wall][c] === T.WATER) wall++;
        if (!L.tiles[r - wall] || ![T.SEAWALL, T.SEAWALL_SIDE].includes(L.tiles[r - wall][c]) || !keep(c, r, wall)) return;
        const h = cellHash(c, r), x = c * ts + 12 + h % 40, y = r * ts + 24 + (h >>> 8) % 24;
        if (boxes.some(b => x >= b.x - 16 && x < b.x + b.w + 16 && y >= b.y && y < b.y + b.h + 16)) return;
        spots.push({ x, y, order: cellHash(c * 31 + day, r) });
    }));
    return spots.sort((a, b) => a.order - b.order);
}

// The deciduous trees a squirrel lives under and climbs (TRUNK.crown's kinds)
const deciduous = game => game.props.filter(p => params.CRITTERS.TRUNK.crown[p.propType]);

const HABITATS = {
    // The open ground; the crows' seed cells first
    lawn: game => {
        const seeds = new Set((game.currentLevel.critterSeeds.crow || []).map(([c, r]) => `${c},${r}`));
        return openGround(game, undefined, (c, r) => seeds.has(`${c},${r}`));
    },
    // The open ground within 3 cells of a deciduous tree
    underTrees: game => {
        const trees = deciduous(game).map(p => groundPoint(p));
        return openGround(game, (c, r) => trees.some(t => Math.abs(t.x / 64 - c - 0.5) <= 3 && Math.abs(t.y / 64 - r - 0.5) <= 3));
    },
    // The open ground within 2 cells of the porch of the house its kind lives at (`porch`: its kit)
    porch: (game, def) => {
        const p = COVERS.porch(game, def)[0];
        return p ? openGround(game, (c, r) => Math.abs(p.x / 64 - c - 0.5) <= 2.5 && Math.abs(p.y / 64 - r - 0.5) <= 2.5) : [];
    },
    // The vacant lot's gravel, off its cars
    ballastLot: game => {
        const L = game.currentLevel, T = params.TILES, day = game.clock.week * 7 + game.clock.day, spots = [];
        for (const { c: c0, r: r0, w, h } of L.vacantLots) for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) {
            if (L.tiles[r][c] !== T.GRAVEL || !game.walkable[r][c]) continue;
            const hh = cellHash(c, r);
            spots.push({ x: c * 64 + 16 + hh % 32, y: r * 64 + 24 + (hh >>> 8) % 28, order: cellHash(c * 31 + day, r) });
        }
        return spots.sort((a, b) => a.order - b.order);
    },
    // Open water in the first three rows off the seawall (the ducks)
    seawallWater: game => waterCells(game, (c, r, wall) => wall <= 3),
    // The shallows: the water right at the seawall's foot (the heron)
    shallows: game => waterCells(game, (c, r, wall) => wall === 1),
    // The gulls' seed perches (pilings, railing posts, the quay), then the open water
    perch: game => {
        const L = game.currentLevel, T = params.TILES, day = game.clock.week * 7 + game.clock.day;
        const seeds = (L.critterSeeds.gull || []).map(p => ({ ...p, seed: true, order: -1 }));
        const water = [];
        L.tiles.forEach((row, r) => row.forEach((t, c) => {
            if (t !== T.WATER || !L.tiles[r - 1] || L.tiles[r - 1][c] === T.SEAWALL) return;
            const h = cellHash(c, r);
            water.push({ x: c * 64 + 12 + h % 40, y: r * 64 + 24 + (h >>> 8) % 24, order: cellHash(c * 31 + day, r) });
        }));
        return [...seeds, ...water.sort((a, b) => a.order - b.order)];
    },
};

// Where a kind takes cover (its `cover`), as points it goes to: a deciduous tree's trunk (its
// ground point, just in front of it, so it draws over the trunk and fades into the crown); its
// house's porch (beside it); the parked cars in the vacant lot (just behind each car's base, so
// the car draws over it)
const COVERS = {
    trunk: game => deciduous(game).map(p => { const g = groundPoint(p); return { x: g.x, y: g.y + 1, tree: p.propType }; }),
    porch: (game, def) => {
        const L = game.currentLevel, b = L.buildings.find(b => b.kit === def.porch);
        const porch = b && game.props.find(p => p.propType === 'porch' && groundPoint(p).x >= b.col * 64 && groundPoint(p).x < (b.col + b.width) * 64);
        return porch ? [{ x: groundPoint(porch).x + 40, y: groundPoint(porch).y - 6 }] : [];
    },
    cars: game => game.props.filter(p => ['carWagon', 'carHatchback', 'carPickup', 'carSedan'].includes(p.propType))
                            .map(p => ({ x: groundPoint(p).x, y: groundPoint(p).y - 10 })),
};

// Where a kind flees to when it has no cover (its `fleeTo`): open water four rows or more off the
// seawall, out of reach of anyone on it
const FLEE_TO = {
    openWater: game => waterCells(game, (c, r, wall) => wall >= 4),
};

// The point of a list nearest p, or null
const nearest = (list, p) => (list || []).reduce((best, q) =>
    !best || Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best, null);

// The animation a critter rests in: the one it picked from its kind's `idles`, else the first
const restAnim = (k, def) => k.anim || (def.idles || ['idle'])[0];

// A critter's frame for what it's doing (CRITTERS' `anims`): in the air, its flight frames
// (flightFrame) from its fly sheet, or its rest's first frame without one; climbing its trunk, the
// climb, raised `up`; on the move, its walk, or its run when fleeing; at rest, its rest animation,
// played through once if it's `once`. An animation with `rows` by facing faces S or N straight on,
// else east, mirrored heading west
function critterFrame(e, def, k, climbing) {
    const art = def.art, fly = art.fly && k.alt > 0;
    e.sprite = fly ? e.sprites.fly : e.sprites.ground;
    const s = e.sprite;
    if (fly) { s.frameX = flightFrame(art.fly, k.clock, k.alt, climbing) * s.frameWidth; s.frameY = 0; e.flip = !!k.west; return; }
    const moving = { walk: 'walk', flee: 'run', leave: 'run', arrive: 'run' }[k.state];
    const onFoot = moving && (art.anims[moving] ? moving : art.anims.walk ? 'walk' : null);
    const name = k.up > 0 && art.anims.climb ? 'climb' : onFoot || restAnim(k, def);
    const anim = art.anims[name] || art.anims[restAnim({}, def)];
    const t = anim.once && !moving ? k.clock - k.animAt : k.clock;
    const frame = anim.once && !moving ? Math.min(anim.frames - 1, Math.floor(t * anim.fps)) : Math.floor(t * anim.fps) % anim.frames;
    const facing = anim.rows && anim.rows[k.facing] !== undefined ? k.facing : 'E';
    s.frameX = frame * s.frameWidth;
    s.frameY = (anim.rows ? anim.rows[facing] : anim.row || 0) * s.frameHeight;
    s.footY  = (art.foot || art.h) + k.up;
    e.flip = facing === 'E' && !!k.west;
}

// A sheet's sprite, its cells w × h art px, based at the bottom centre of a cell (or its `foot` row)
function sheetSprite(sheet, image = sheet.image) {
    return new Sprite(ASSET_MANAGER.getAsset(image), 0, 0, sheet.w, sheet.h, sheet.foot || sheet.h, sheet.w / 2);
}

// A bird's frame in its fly sheet (params.CRITTERS.FLIGHT): the take-off while it lifts off (the
// lower half of its climb), the glide while it comes down to land, else the flap at the sheet's fps
function flightFrame(fly, clock, alt, climb) {
    const F = params.CRITTERS.FLIGHT;
    if (climb > 0 && alt < params.CRITTERS.CLIMB_ALT / 2) return F.takeoff;
    if (climb < 0) return F.glide;
    return F.flap[0] + Math.floor(clock * fly.fps) % (F.flap[1] - F.flap[0] + 1);
}

// An animal entity of a kind at a spot: no collider, its frames from its art (facing east; a
// bird's in the air from its fly sheet, e.sprites.fly), in one of its colourways if it has more
function createCritter(game, kind, spot) {
    const def = params.CRITTERS[kind], art = def.art, x = Math.round(spot.x), y = Math.round(spot.y);
    const ground = sheetSprite(art, art.images ? hashPick(art.images, x, y) : art.image);
    const entity = {
        removeFromWorld: false,
        drawWidth: 0, drawHeight: 0,
        position: new Position(spot.x, spot.y),
        sprite:   ground,
        sprites:  { ground, fly: art.fly ? sheetSprite(art.fly) : null },
        critter:  new Critter(kind, spot.seed ? spot : null),
    };
    const k = entity.critter;
    k.west   = cellHash(x, y) % 2 === 1;
    k.facing = 'E';
    k.clock  = (cellHash(y, x) % 100) / 25;
    k.timer  = 1 + (cellHash(x, 3) % 40) / 10;
    game.addEntity(entity);
    critterFrame(entity, def, k, 0);
    return entity;
}

// The crow commute (design/ambient-life.md §3): at dusk in fall and winter, from COMMUTE.after
// minutes past sunset for COMMUTE.minutes game minutes, a stream of crows crosses the view eastward,
// high, each on its own line, flapping and gliding by turns: as screen points { x, y, frame } (no
// shadows: they're high)
function crowCommute(game, W, viewH) {
    const C = params.CRITTERS, M = C.COMMUTE;
    if (!C.crow.art || !['fall', 'winter'].includes(game.season)) return [];
    const { sunset } = params.DAYLIGHT[game.season], clock = game.clock;
    const t = (clock.gameMinute + clock.accumulator) - ((sunset - DAY_START_HOUR) * 60 + M.after);   // game minutes in
    if (t < 0 || t > M.minutes + 10) return [];
    const day = (clock.week - 1) * 7 + clock.day, n = M.birds[0] + cellHash(day, 41) % (M.birds[1] - M.birds[0] + 1);
    const secs = t / params.MINUTES_PER_SECOND, birds = [];
    for (let i = 0; i < n; i++) {
        const h = cellHash(day * 97 + i, 13), start = (h % 1000) / 1000 * M.minutes / params.MINUTES_PER_SECOND;
        const x = -24 + (secs - start) * M.speed * (0.85 + (h >>> 12) % 30 / 100);
        if (x < -24 || x > W + 24) continue;
        const y = viewH * (M.alt[0] + ((h >>> 20) % 100) / 100 * (M.alt[1] - M.alt[0])) + Math.sin(secs * 2 + i) * 4;
        const beat = (secs + (h >>> 4) % 100 / 100 * M.beat) % M.beat, F = C.FLIGHT;
        birds.push({ x, y, frame: beat >= M.flap ? F.glide : flightFrame(C.crow.art.fly, secs + (h >>> 8) % 100 / 100, 1, 0) });
    }
    return birds;
}

// Debug (console): each kind near the view and in it, and why not, if not; seeCritters('crow')
// brings that kind in at the view's edge whatever the hour, for review
function seeCritters(kind) {
    const game = gameEngine, sys = game.systems.find(s => s instanceof CritterSystem);
    if (!sys) return 'no CritterSystem';
    if (kind) {
        if (!params.CRITTERS[kind] || !params.CRITTERS[kind].art) return `${kind}: no art yet`;
        sys.forced = kind; sys.wait[kind] = 0;
        return `${kind}: coming in`;
    }
    const view = viewBox(game);
    return Object.entries(params.CRITTERS).filter(([, d]) => d && d.habitat).map(([k, d]) => {
        const mine = sys.list.filter(e => e.critter.kind === k), why = notAbout(d, game);
        return `${k}: ${mine.length} near, ${mine.filter(e => inBox(groundPoint(e), view)).length} in view` + (why ? ` (not about: ${why})` : '');
    }).join('\n');
}
