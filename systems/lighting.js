// Lighting — the light by clock hour on the campus (design/day-night.md §1, §2, §4), drawn by
// RenderSystem. The light is worked out each frame from the clock, the season and where everyone
// is, never kept, so the clock, the quarter and the NPCs stay its owners. Two halves:
// - the ground (tiles, then decals) is multiplied by a light map the size of the view: the
//   ambient, with each light laid on it: the lit rooms' floors, their doors' spill, and the pools
//   of the lit things that throw one (lamps, the neon, the shelter, a gig's spot);
// - every sprite in the sorted pass, and every overhead, is drawn from a copy of its image tinted
//   by the one light where it stands: a building's pieces, and anything on a room's floor (its
//   wall-hung props, its furniture, whoever is in it), take the room's light if it's lit, the rest
//   the ambient; either way with each pool it stands in by that light's spriteGain. No character
//   is drawn darker than CHAR_MIN.
// A building is lit while it's open (buildingOpen), a home only while someone who lives there is
// home; a lit room takes ROOM light where that's brighter than the ambient, so by day nothing
// changes. While a gig runs (an NPC's `gig`) its building is lit with the house lights down
// (GIG_ROOM, at any hour) and a SPOT on the stage it's played from.
// A prop type that's `lit` is lit `when` it's dark (the lamps are on), while the room it stands in
// is lit ('room'), or while a building is (its name). Then its masks are drawn right after it,
// untinted, so whatever stands in front still covers them; it throws its `light`'s pool (from its
// ground point, or `at`, art px in its frame); and after the sorted pass a halo is added at each of
// its `halos` (art px in its frame; a part's in the whole image, drawn by the part that holds it).
// The ground outdoors is wet: a pool there is WET_GAIN strong in its season (never on a snow day,
// whose night is SNOW_NIGHT), and a puddle (`glints`) lying in one is drawn again in its colour. On
// a rain day, all day, the ground outdoors is shaded wet (RAIN.WET_PAVED on paving, the lighter
// WET_GRASS on grass), pools there take the larger of the season's and the rain's WET_GAIN, and
// halos swell HALO_GAIN in the mist.
// Tinted copies are kept per image, by the light rounded to TINT_STEP. At most TINT_BUDGET new
// copies are made a frame; past it an image draws its last copy, so a moving light (dusk) never
// stalls a frame. In full daylight, with no gig on, nothing is drawn and every image draws as
// itself.

const NO_MASKS = [];

class Lighting {
    constructor() {
        this.map     = document.createElement('canvas');   // the ground's light map, over the view
        this.copies  = new WeakMap();                       // image → { byKey: Map(light → copy), last }
        this.spills  = null;                                // every door's spill, once the level is known
        this.wetness = null;                                // each cell's wet shade class (wetGrid), once the level is known
        this.sources = null;                                // every lit prop (litSource), once the props are made
    }

    // This frame's light: the ambient, which buildings are lit and how, which lit props are lit, the
    // pools on the ground, and whether there is any light to draw
    begin(game) {
        const L = params.LIGHT, level = game.currentLevel;
        this.ambient = daylightOf(clockHour(game.clock), game.season, game.weather).ambient;
        const rain   = game.weather === 'rain';
        this.wet     = game.weather === 'snow' ? 1 : Math.max(L.WET_GAIN[game.season] || 1, rain ? params.RAIN.WET_GAIN : 1);
        this.rainy   = rain;
        this.haloGain = rain ? params.RAIN.HALO_GAIN : 1;
        this.budget  = L.TINT_BUDGET;
        this.rooms   = game.rooms;
        this.room    = this.ambient.map((v, c) => Math.max(v, L.ROOM[c]));
        this.lampsOn = !!game.dark;
        this.lit = new Set(); this.gigs = new Set(); this.shining = new Set(); this.pools = [];
        if (level) {
            const home = b => game.entities.some(e => livesIn(e, b) && e.npc.state === 'at-home');
            this.lit = new Set(level.buildings.filter(b =>
                buildingOpen(b, game.clock) && (!b.hours.residents || home(b))));
            if (!this.spills)  this.spills  = level.buildings.flatMap(b => doorSpills(level, b));
            if (!this.wetness) this.wetness = wetGrid(level);
            if (!this.sources) {
                this.sources  = game.props.filter(p => PROP_TYPES[p.propType].lit).map(p => litSource(level, game.rooms, p));
                this.sourceOf = new Map(this.sources.map(s => [s.prop, s]));
            }
            for (const e of game.entities) {
                const gig = e.npc && e.npc.gig, ts = level.tileSize;
                const b = gig && roomAt(game.rooms, gig.at.x + ts / 2, gig.at.y + ts / 2);
                if (!b) continue;
                this.gigs.add(b);
                this.lit.add(b);
                const stand = game.stands.get(`${gig.at.x / ts},${gig.at.y / ts}`);
                if (stand) this.pools.push({ x: stand.x, y: stand.y, light: L.SPOT, outdoors: false });
            }
            for (const s of this.sources) if (this.isLit(s)) {
                this.shining.add(s);
                if (s.light && s.light.radius) this.pools.push({ x: s.at.x, y: s.at.y, light: s.light, outdoors: !s.room });
            }
        }
        this.on = this.ambient.some(v => v < 255) || this.gigs.size > 0;
    }

    // Whether a lit prop is lit now: by its `when`
    isLit(s) {
        if (s.when === 'dark') return this.lampsOn;
        return this.lit.has(s.when === 'room' ? s.room : s.building);
    }

    // A lit building's room light: the house lights down while a gig runs, else ROOM where it's
    // brighter than the ambient
    roomLight(b) {
        return this.gigs.has(b) ? params.LIGHT.GIG_ROOM : this.room;
    }

    // Multiplies everything drawn so far (the ground) by the light map, over the view: W x viewH
    // with its top-left at the camera, in world px (a view with no area, a hidden window, has
    // nothing to shade, and a canvas of no area can't be drawn). A lit room's floor takes its room
    // light, its doors' spill lightens the ground outside (each channel takes the brighter), and
    // the pools add
    shadeGround(ctx, cam, W, viewH) {
        if (!this.on || W <= 0 || viewH <= 0) return;
        const map = this.map, ts = 64;
        if (map.width !== W || map.height !== viewH) { map.width = W; map.height = viewH; }
        const m = map.getContext('2d');
        m.globalCompositeOperation = 'source-over';
        m.fillStyle = rgb(...this.ambient);
        m.fillRect(0, 0, W, viewH);
        m.save();
        m.translate(-cam.x, -cam.y);
        if (this.rainy) this.shadeWet(m, cam, W, viewH);
        for (const b of this.lit) {
            const f = roomRect(b);
            m.fillStyle = rgb(...this.roomLight(b));
            m.fillRect(f.c * ts, f.r * ts, f.w * ts, f.h * ts);
        }
        m.globalCompositeOperation = 'lighten';
        for (const s of this.spills) if (this.lit.has(s.building)) drawSpill(m, s);
        m.globalCompositeOperation = 'lighter';
        for (const p of this.pools) drawPool(m, p, p.outdoors ? this.wet : 1);
        m.restore();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(map, cam.x, cam.y);
        ctx.globalCompositeOperation = 'source-over';
    }

    // On a rain day, the wet ground outdoors in view on the light map: each paved cell the ambient
    // times WET_PAVED, each grass cell times WET_GRASS (one path a shade)
    shadeWet(m, cam, W, viewH) {
        const R = params.RAIN, ts = 64, grid = this.wetness;
        const c0 = Math.max(0, Math.floor(cam.x / ts)), c1 = Math.min(grid[0].length - 1, Math.floor((cam.x + W) / ts));
        const r0 = Math.max(0, Math.floor(cam.y / ts)), r1 = Math.min(grid.length - 1, Math.floor((cam.y + viewH) / ts));
        for (const [kind, shade] of [[WET.PAVED, R.WET_PAVED], [WET.GRASS, R.WET_GRASS]]) {
            m.beginPath();
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (grid[r][c] === kind) m.rect(c * ts, r * ts, ts, ts);
            m.fillStyle = rgb(...this.ambient.map((v, i) => Math.round(v * shade[i] / 255)));
            m.fill();
        }
    }

    // The light an entity's sprite is drawn in: its room's light, if it's a lit building's piece or
    // stands on a lit room's floor, else the ambient; with each pool at its ground point by that
    // light's spriteGain (the pool's falloff: full at its centre, nothing at its squashed edge); a
    // character's never below CHAR_MIN
    lightOf(entity) {
        const g = groundPoint(entity), building = entity.building || roomAt(this.rooms, g.x, g.y);
        let light = building && this.lit.has(building) ? this.roomLight(building) : this.ambient;
        for (const { x, y, light: { color, radius, squash, spriteGain } } of this.pools) {
            const d = Math.hypot(g.x - x, (g.y - y) / squash) / radius;
            if (d < 1) light = light.map((v, c) => v + spriteGain * (1 - d) * color[c]);
        }
        if (!entity.agent) return light;
        return light.map((v, c) => Math.max(v, params.LIGHT.CHAR_MIN[c]));
    }

    // A puddle's glint: the strongest pool outdoors it lies in, as { color, alpha } (GLINT of the
    // pool's strength there, by its falloff), else null
    glint(decal) {
        const g = groundPoint(decal);
        let best = null;
        for (const p of this.pools) {
            if (!p.outdoors) continue;
            const { color, radius, squash } = p.light;
            const d = Math.hypot(g.x - p.x, (g.y - p.y) / squash) / radius;
            if (d < 1 && (!best || 1 - d > best.strength)) best = { color, strength: 1 - d };
        }
        return best && { color: best.color, alpha: params.LIGHT.GLINT * best.strength };
    }

    // Whether a lit prop is lit this frame (and there's any light drawn)
    shines(entity) {
        const s = this.on && this.sourceOf && this.sourceOf.get(entity);
        return !!s && this.shining.has(s);
    }

    // An entity's masks while it's lit (a mask still to come, its art not in yet, is none)
    masks(entity) {
        return this.shines(entity) ? this.sourceOf.get(entity).masks : NO_MASKS;
    }

    // A halo at each halo point of everything lit, added over whatever stands in front
    drawHalos(ctx) {
        if (!this.on) return;
        const k = params.ART_SCALE;
        ctx.globalCompositeOperation = 'lighter';
        for (const s of this.shining) {
            if (!s.halos || !s.light || !s.light.halo) continue;
            const sp = s.prop.sprite, b = spriteBox(s.prop), ox = PROP_TYPES[s.prop.propType].parts ? sp.frameX : 0;
            for (const [hx, hy] of s.halos) {
                const x = hx - ox;
                if (x < 0 || x >= sp.frameWidth) continue;
                drawGlow(ctx, b.x + (x + 0.5) * k, b.y + (hy + 0.5) * k, s.light.halo * this.haloGain, s.light.color, s.light.haloStrength);
            }
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    // The image to draw an entity's sprite from: its own in full light, else its tinted copy
    image(entity) {
        const image = entity.sprite.image;
        return this.on ? this.tinted(image, this.lightOf(entity)) : image;
    }

    // An image's copy tinted by a light, rounded to TINT_STEP. The oldest copy past TINT_KEEP is
    // dropped; past the frame's budget the image draws its last copy, if it has one
    tinted(image, light) {
        const L = params.LIGHT;
        const q = light.map(v => Math.min(255, Math.round(v / L.TINT_STEP) * L.TINT_STEP));
        if (q.every(v => v === 255)) return image;
        let entry = this.copies.get(image);
        if (!entry) this.copies.set(image, entry = { byKey: new Map(), last: null });
        const key = q.join(',');
        let copy = entry.byKey.get(key);
        if (!copy) {
            if (this.budget <= 0 && entry.last) return entry.last;
            this.budget--;
            copy = tintedCopy(image, rgb(...q), 'multiply');
            entry.byKey.set(key, copy);
            if (entry.byKey.size > L.TINT_KEEP) entry.byKey.delete(entry.byKey.keys().next().value);
        }
        return entry.last = copy;
    }
}

// A lit prop as a light source: when it's lit, the room it stands in and the building its `when`
// names, its light (params.LIGHT), its pool's centre (world px), its masks (those whose art is
// in: { image, add }, a wash added over the sprite, a glow laid on it) and its halo points
function litSource(level, rooms, p) {
    const def = PROP_TYPES[p.propType], lit = def.lit, g = groundPoint(p), b = spriteBox(p);
    const at = lit.at ? { x: b.x + lit.at[0] * params.ART_SCALE, y: b.y + lit.at[1] * params.ART_SCALE } : g;
    return {
        prop: p, when: lit.when, at, halos: lit.halos,
        room: roomAt(rooms, g.x, g.y),
        building: level.buildings.find(bd => bd.name === lit.when) || null,
        light: lit.light ? params.LIGHT[lit.light] : null,
        masks: (lit.masks || []).map(m => ({ image: ASSET_MANAGER.getAsset(maskImage(def, m)), add: m === 'wash' }))
                                .filter(m => m.image),
    };
}

// A cell's wet shade class: paving (path, pavers, stair, asphalt, the rail bed, gravel) darkens
// when wet, grass (and the grass under trees) a little; water, walls and floors don't
const WET = { NONE: 0, PAVED: 1, GRASS: 2 };
function wetGrid(level) {
    const T = params.TILES;
    const paved = [T.PATH, T.PAVERS, T.STAIR, T.ASPHALT, T.RAIL, T.GRAVEL], grass = [T.GRASS, T.TREE];
    return level.tiles.map(row => row.map(t => paved.includes(t) ? WET.PAVED : grass.includes(t) ? WET.GRASS : WET.NONE));
}

// A soft round glow at (x, y): `color` at `strength` in the middle, nothing at `radius`
function drawGlow(ctx, x, y, radius, color, strength) {
    const fade = ctx.createRadialGradient(x, y, 0, x, y, radius);
    fade.addColorStop(0, rgba(...color, strength));
    fade.addColorStop(1, rgba(...color, 0));
    ctx.fillStyle = fade;
    ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
}

// A pool { x, y, light } on a light map's context: the light's round glow, `gain` strong in the
// middle (1 is full; more is laid again on top), squashed for the 3/4 view
function drawPool(m, { x, y, light }, gain) {
    m.save();
    m.translate(x, y);
    m.scale(1, light.squash);
    for (let left = gain; left > 0; left -= 1) drawGlow(m, 0, 0, light.radius, light.color, Math.min(1, left));
    m.restore();
}

// A door's spill (SPILL) on a light map's context: a wedge from the wall, the door's width there
// and `spread` wider each side at its reach (a back door's `northReach`, across its back strip),
// fading from `strength` to nothing
function drawSpill(m, s) {
    const { reach, northReach, spread, strength } = params.LIGHT.SPILL, ts = 64;
    const far = s.y + s.dir * (s.dir < 0 ? northReach : reach);
    const fade = m.createLinearGradient(0, s.y, 0, far);
    fade.addColorStop(0, rgba(...params.LIGHT.ROOM, strength));
    fade.addColorStop(1, rgba(...params.LIGHT.ROOM, 0));
    m.fillStyle = fade;
    m.beginPath();
    m.moveTo(s.x, s.y);
    m.lineTo(s.x + ts, s.y);
    m.lineTo(s.x + ts + spread, far);
    m.lineTo(s.x - spread, far);
    m.closePath();
    m.fill();
}

// Every door of building b as a spill { building, x, y, dir }: x the doorway's west edge and y the
// line the light leaves from, world px; a front door throws it south from the building's outer
// edge, a back door north from its back wall's top, where the ground behind the wall shows
function doorSpills(level, b) {
    const ts = level.tileSize, back = (b.row + 1) * ts - KIT_FACE.N.h * params.ART_SCALE;
    return [
        ...kitDoors(level, b, b.row + b.height - 1).map(c => ({ building: b, x: c * ts, y: (b.row + b.height) * ts, dir: 1 })),
        ...kitDoors(level, b, b.row).map(c => ({ building: b, x: c * ts, y: back, dir: -1 })),
    ];
}
