// Rain — the rain falling (design/rain.md §2.3, §2.4, §4), drawn by RenderSystem beside its
// Lighting. How hard it rains is worked out each frame (rainOf), and every drop is a pure function
// of its index and the animation clock: nothing is kept, so the clock and the quarter stay the
// owners, and in a break or dry weather nothing is drawn.
// - Streaks fall through the view (screen space), each tested where its foot lands in the world:
//   none over a building (the cutaway rooms are roofed in fiction), so rain stops at their
//   outlines. They're drawn over everything standing, after the overheads.
// - Splashes on paving and rings on open water, at spots that move every SPLASH_TIME s, and two
//   rings at a time in each puddle, are drawn on the ground, after its light, so none draws over
//   anyone's shoes.
// - Rain takes its light: by day pale DAY_STREAK; in the dark the ambient lifted, barely there; in a
//   light's reach its colour, toward LIT_ALPHA. A lamp lights the rain up to its globes (LAMP_UP).
// - A character who carries an umbrella (CHARACTER_SHEETS' `umbrella`) has it up while it's raining
//   on them (outdoors, walking or standing): one canopy over the head, tinted by their light, and
//   their name tag stacks from its top.

class Rain {
    constructor() {
        this.dry = null;   // the cells rain doesn't reach (dryGrid), once the level is known
    }

    // This frame's rain: how hard, the time, and the light to colour it by (the frame's Lighting)
    begin(game, lighting) {
        const R = params.RAIN, L = params.LIGHT;
        this.strength = game.weather === 'rain' && game.quarter && game.clock ? rainOf(game.quarter, game.clock) : 0;
        this.time     = game.animTime || 0;
        this.lighting = lighting;
        this.level    = game.currentLevel;
        if (!this.dry && this.level) this.dry = dryGrid(this.level);
        if (!this.strength) return;
        // Out of the light: between the dark's (the ambient lifted) and the day's, by how bright it is
        const lum = c => c[0] + c[1] + c[2], amb = lighting.ambient;
        const k = Math.max(0, Math.min(1, (lum(amb) - lum(L.NIGHT)) / (lum(R.OVERCAST) - lum(L.NIGHT))));
        this.base      = amb.map((v, c) => Math.round(Math.min(255, v * R.NIGHT_LIFT) * (1 - k) + R.DAY_STREAK[c] * k));
        this.baseAlpha = R.NIGHT_ALPHA * (1 - k) + R.DAY_ALPHA * k;
    }

    // The rain's colour and alpha at world point (x, y): the base, or toward the strongest light
    // whose reach it's in (a lamp's reaches from its pool up LAMP_UP px to its globes), as
    // { color, alpha, key } with `key` naming the rounded look, so drops can be drawn in batches
    shade(x, y) {
        const R = params.RAIN;
        let best = 0, light = null;
        for (const p of this.lighting.pools) {
            const { radius, squash } = p.light;
            const up = p.light === params.LIGHT.LAMP ? R.LAMP_UP : 0;
            const dy = y > p.y ? y - p.y : y < p.y - up ? p.y - up - y : 0;
            const f = 1 - Math.hypot(x - p.x, dy / squash) / radius;
            if (f > best) { best = f; light = p.light; }
        }
        const f = Math.round(best * 6) / 6;
        if (!f) return { color: this.base, alpha: this.baseAlpha, key: 'base' };
        return { color: this.base.map((v, c) => Math.round(v + (light.color[c] - v) * f)),
                 alpha: this.baseAlpha + (R.LIT_ALPHA - this.baseAlpha) * f,
                 key: light.color.join() + '|' + f };
    }

    // Whether world point (x, y) is under a roof (a building's cells)
    sheltered(x, y) {
        const row = this.dry[Math.floor(y / 64)];
        return !row || row[Math.floor(x / 64)] !== false;
    }

    // The ground's rain, over the view: splashes on paving, rings on open water and in puddles
    drawGround(ctx, decals, cam, W, viewH) {
        if (!this.strength) return;
        const R = params.RAIN, T = params.TILES, wet = this.lighting.wetness, ts = 64;
        const spots = Math.round(this.strength * W * viewH * R.SPLASH_DENSITY);
        for (let i = 0; i < spots; i++) {
            const t = this.time / R.SPLASH_TIME + (cellHash(i, 71) % 1000) / 1000;
            const epoch = Math.floor(t), frac = t - epoch, h = cellHash(i * 977 + epoch, 13);
            const x = cam.x + h % W, y = cam.y + (h >>> 12) % viewH;
            const c = Math.floor(x / ts), r = Math.floor(y / ts);
            if (this.sheltered(x, y)) continue;
            if (wet && wet[r] && wet[r][c] === WET.PAVED) this.splash(ctx, x, y, Math.min(2, Math.floor(frac * 3)));
            else if (this.level.tiles[r] && this.level.tiles[r][c] === T.WATER) this.ring(ctx, x, y, frac, 12);
        }
        // Two rings at a time in each puddle in view, at spots inside it, sized by it
        const m = params.CULL_MARGIN;
        for (const d of decals) {
            if (!PROP_TYPES[d.propType].glints) continue;
            const b = spriteBox(d);
            if (b.x + b.w < cam.x - m || b.x > cam.x + W + m || b.y + b.h < cam.y - m || b.y > cam.y + viewH + m) continue;
            for (let k = 0; k < 2; k++) {
                const t = this.time / R.RING_TIME + k / 2 + (cellHash(b.x, b.y) % 100) / 100;
                const epoch = Math.floor(t), h = cellHash(b.x * 31 + epoch * 2 + k, b.y);
                const x = b.x + b.w * (0.25 + (h % 50) / 100), y = b.y + b.h * (0.4 + ((h >>> 8) % 30) / 100);
                this.ring(ctx, x, y, t - epoch, b.w * 0.18);
            }
        }
        ctx.globalAlpha = 1;
    }

    // A splash at (x, y), frame 0-2: the drop; two pixels thrown up and out; two fainter, wider
    splash(ctx, x, y, frame) {
        const { color, alpha } = this.shade(x, y), p = params.ART_SCALE;
        ctx.fillStyle = rgb(...color);
        ctx.globalAlpha = frame === 2 ? alpha * 0.5 : alpha;
        if (frame === 0) ctx.fillRect(x, y, p, p);
        else if (frame === 1) { ctx.fillRect(x - 2 * p, y - 2 * p, p, p); ctx.fillRect(x + 2 * p, y - 2 * p, p, p); }
        else { ctx.fillRect(x - 4 * p, y, p, p); ctx.fillRect(x + 4 * p, y, p, p); }
    }

    // A ring at (x, y), `frac` of the way through its life: growing to `size` px across, squashed for
    // the 3/4 view, fading out
    ring(ctx, x, y, frac, size) {
        const { color, alpha } = this.shade(x, y);
        const rx = 2 + frac * size / 2;
        ctx.strokeStyle = rgb(...color);
        ctx.globalAlpha = alpha * (1 - frac);
        ctx.lineWidth = params.ART_SCALE / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // The streaks over the view, in batches of one look
    drawAir(ctx, cam, W, viewH) {
        if (!this.strength) return;
        const R = params.RAIN, n = Math.round(this.strength * W * viewH * R.DENSITY);
        const batches = new Map();
        for (let i = 0; i < n; i++) {
            const hx = cellHash(i, 17), hy = cellHash(i, 29);
            const speed = R.SPEED * (0.85 + (hx >>> 20) % 30 / 100);
            const span = viewH + R.LEN;
            const sy = ((hy % 4096) + this.time * speed) % span - R.LEN;
            const sx = hx % (W + 40) - 20;
            const x = cam.x + sx, y = cam.y + sy, fx = x + R.SLANT * R.LEN, fy = y + R.LEN;
            if (this.sheltered(fx, fy)) continue;
            const s = this.shade(fx, fy);
            if (!batches.has(s.key)) batches.set(s.key, { s, lines: [] });
            batches.get(s.key).lines.push(x, y, fx, fy);
        }
        ctx.lineWidth = params.ART_SCALE;
        for (const { s, lines } of batches.values()) {
            ctx.strokeStyle = rgb(...s.color);
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            for (let j = 0; j < lines.length; j += 4) { ctx.moveTo(lines[j], lines[j + 1]); ctx.lineTo(lines[j + 2], lines[j + 3]); }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // A character's open umbrella, as the world box its canopy draws in, while it's up (raining, the
    // character carries one, stands outdoors, walking or standing), else null: centred UMBRELLA.y
    // art px above the foot, `lean` px toward the facing, a pixel lower on walk frames 1 and 3
    canopy(e) {
        if (!this.strength || !e.umbrella || !e.animator || !['walk', 'idle'].includes(e.animator.state)) return null;
        const g = groundPoint(e);
        if (roomAt(this.lighting.rooms, g.x, g.y)) return null;
        const { y, lean } = params.RAIN.UMBRELLA, s = params.ART_SCALE, img = e.umbrella;
        const dx = [0, 1, 1, 1, 0, -1, -1, -1][e.animator.row] || 0;
        const bob = e.animator.state === 'walk' && e.animator.frame % 2 === 1 ? 1 : 0;
        const w = img.width * s, h = img.height * s;
        return { x: Math.round(g.x + dx * lean * s - w / 2), y: Math.round(g.y - (y - bob) * s - h / 2), w, h };
    }

    // A character's umbrella, while it's up, in their light
    drawUmbrella(ctx, e) {
        const box = this.canopy(e);
        if (!box) return;
        const L = this.lighting, image = L.on ? L.tinted(e.umbrella, L.lightOf(e)) : e.umbrella;
        ctx.drawImage(image, box.x, box.y, box.w, box.h);
    }
}

// The cells rain doesn't reach, as a grid by [row][col] (true: under a roof): every building's
// footprint, its ring included
function dryGrid(level) {
    const grid = level.tiles.map(row => row.map(() => false));
    for (const b of level.buildings)
        for (let r = b.row; r < b.row + b.height; r++) for (let c = b.col; c < b.col + b.width; c++) grid[r][c] = true;
    return grid;
}
