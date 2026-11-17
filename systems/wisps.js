// Wisps — steam from the street and smoke from the houses (design/ambient-life.md §3), drawn by
// RenderSystem beside its Lighting, in the air pass. Like the rain, every puff is a pure function
// of its source and the animation clock: nothing is kept, so the clock, the quarter and the
// lighting stay the owners.
// - Steam: on a winter morning (before params.WISPS.STEAM.until), a thin wisp off each manhole and
//   storm drain in view, a few pale pixels rising and fading.
// - Smoke: on fall and winter evenings (from params.WISPS.SMOKE.from hours before sunset), from a
//   point on each Larch Hill house's back wall top, while the house is lit, which is while someone
//   who lives there is home (Lighting); a grey plume leaning east and widening as it rises.
// Each puff is a soft disc (a core over a fainter rim), overlapping its neighbours, with its own
// sideways wander each time round, so a source reads as a body of steam or smoke, not a line.
// A puff takes the hour's light: its colour times the ambient, but never darker than a character
// is lit (LIGHT.CHAR_MIN), so it reads at night.

class Wisps {
    // This frame's wisps: which kinds are on, the time, and the light (the frame's Lighting)
    begin(game, lighting) {
        const W = params.WISPS, h = game.clock ? clockHour(game.clock) : 12;
        this.time     = game.animTime || 0;
        this.lighting = lighting;
        this.steam    = game.season === 'winter' && h < W.STEAM.until;
        this.smoke    = ['fall', 'winter'].includes(game.season) && h >= params.DAYLIGHT[game.season].sunset - W.SMOKE.from;
        if (this.smoke && !this.chimneys && game.currentLevel) this.chimneys = chimneys(game.currentLevel);
    }

    // The wisps in view: steam off the street's decals, smoke off the lit houses
    draw(ctx, game, cam, W, viewH) {
        const P = params.WISPS, m = params.CULL_MARGIN;
        const seen = (x, y) => x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + viewH + m;
        if (this.steam) for (const d of game.decals) {
            if (d.propType !== 'manhole' && d.propType !== 'stormDrain') continue;
            const g = groundPoint(d), b = spriteBox(d), x = b.x + b.w / 2, y = b.y + b.h / 2;
            if (seen(x, y)) this.puffs(ctx, P.STEAM, x, y, cellHash(Math.round(g.x), Math.round(g.y)));
        }
        if (this.smoke) for (const c of this.chimneys) {
            if (this.lighting.lit.has(c.building) && seen(c.x, c.y)) this.puffs(ctx, P.SMOKE, c.x, c.y, c.hash);
        }
        ctx.globalAlpha = 1;
    }

    // A source's puffs at (x, y): `puffs` of them spaced along a `life` s cycle (`gaps` of them
    // skipped each time round), each rising `rise` art px, drifting `drift` east and wandering its
    // own way up to `wander`, growing from size[0] to size[1] art px across, fading in over its
    // first FADE_IN of life and out to nothing
    puffs(ctx, kind, x, y, hash) {
        const s = params.ART_SCALE, amb = this.lighting.ambient, min = params.LIGHT.CHAR_MIN;
        ctx.fillStyle = rgb(...kind.color.map((v, c) => Math.round(v * Math.max(amb[c], min[c]) / 255)));
        for (let k = 0; k < kind.puffs; k++) {
            const t = this.time / kind.life + k / kind.puffs + (hash % 1000) / 1000, round = Math.floor(t), f = t - round;
            const h = cellHash(hash + k * 131, round);
            if (kind.gaps && h % 100 < kind.gaps * 100) continue;
            const way = ((h >>> 8) % 201) / 100 - 1;   // its wander, -1 to 1
            const px = x + (f * kind.drift + way * kind.wander * f) * s, py = y - f * kind.rise * s;
            const r = (kind.size[0] + (kind.size[1] - kind.size[0]) * f) * s / 2;
            const a = kind.alpha * Math.min(1, f / params.WISPS.FADE_IN) * (1 - f);
            ctx.globalAlpha = a * 0.5;   // the rim
            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = a * 0.6;   // the core
            ctx.beginPath(); ctx.arc(px, py - r * 0.1, r * 0.6, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// Each house's chimney point: on its back wall's top, at a column picked by cellHash, so the six
// don't line up
function chimneys(level) {
    const ts = level.tileSize, s = params.ART_SCALE;
    return level.buildings.filter(b => b.name === 'House').map(b => {
        const hash = cellHash(b.col, b.row);
        return { building: b, hash, x: (b.col + 2 + hash % (b.width - 4)) * ts + ts / 2, y: (b.row + 1) * ts - KIT_FACE.N.h * s + 2 * s };
    });
}
