// RenderSystem - draws the tilemap and all entities, camera-aware, in the hour's light (Lighting):
// the ground is shaded by the light map before the station markers, and every sprite after it is
// drawn from its tinted image; labels are never darkened. The rain (Rain) falls in two passes: on
// the ground after its light, and in the air after the overheads; umbrellas go up over their owners
class RenderSystem {
    constructor() {
        this.lighting = new Lighting();
        this.rain     = new Rain();
        this.wisps    = new Wisps();
    }

    update(deltaTime, game) {
        const ctx = game.ctx;
        const W   = ctx.canvas.width;
        const H   = ctx.canvas.height;
        const cam = game.camera || { x: 0, y: 0 };
        const viewH = H - UI_HEIGHT;

        ctx.clearRect(0, 0, W, H);

        // Clip world draw to the area below the HUD
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, UI_HEIGHT, W, viewH);
        ctx.clip();

        ctx.translate(-cam.x, UI_HEIGHT - cam.y);

        this.lighting.begin(game);
        this.rain.begin(game, this.lighting);
        this.wisps.begin(game, this.lighting);
        if (game.currentLevel) {
            this.drawTilemap(ctx, game, cam, W, viewH);
            this.drawProps(ctx, game.decals, cam, W, viewH);
            this.lighting.shadeGround(ctx, cam, W, viewH);
            this.drawGroundLights(ctx, game.decals, cam, W, viewH);
            this.rain.drawGround(ctx, game.decals, cam, W, viewH);
            this.drawCritterShadows(ctx, game);
            this.drawStationMarkers(ctx, game);
        }

        // Back to front by ground line, characters and props alike; skip what can't reach the view
        const m = params.CULL_MARGIN;
        const drawn = game.entities
            .filter(e => e.position && !(e.critter && e.critter.alt > 0) &&
                e.position.x + e.drawWidth > cam.x - m && e.position.x < cam.x + W + m &&
                footY(e) > cam.y && footY(e) < cam.y + viewH + m)
            .sort((a, b) => footY(a) - footY(b));
        this.fadeTallProps(deltaTime, game);
        for (let entity of drawn) {
            ctx.globalAlpha = entity.alpha ?? 1;
            this.drawEntity(ctx, entity, true);
            for (const mask of this.lighting.masks(entity)) {
                if (mask.add) ctx.globalCompositeOperation = 'lighter';
                this.drawFrame(ctx, entity, mask.image);
                ctx.globalCompositeOperation = 'source-over';
            }
            this.rain.drawUmbrella(ctx, entity);
            ctx.globalAlpha = 1;

            // Debug: draw collider box
            const debugCheckbox = document.getElementById('debugMode');
            if (debugCheckbox && debugCheckbox.checked && entity.collider) {
                ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    entity.position.x + entity.collider.offsetX,
                    entity.position.y + entity.collider.offsetY,
                    entity.collider.width,
                    entity.collider.height
                );
            }
        }

        // Halos round what's lit, in the air over everything standing, with the birds, the steam
        // and the smoke
        this.drawAir(ctx, game, cam, W, viewH);
        if (game.currentLevel) this.wisps.draw(ctx, game, cam, W, viewH);
        this.lighting.drawHalos(ctx);

        // Overhead props (awnings, hanging signs) over everyone who walks under them
        this.drawProps(ctx, game.overheads, cam, W, viewH, true);

        // The rain, falling past everything toward the camera
        this.rain.drawAir(ctx, cam, W, viewH);

        // Labels over everything drawn, so a tall prop in front never buries one
        if (game.currentLevel) this.drawBuildingLabels(ctx, game);
        this.drawLabels(ctx, game, drawn);

        ctx.restore();
    }

    // Over each figure, stacked up from its head: its name tag where it's near the player (spec row
    // 23; the player's own name is the HUD's), then its speech bubble above the tag. Every label is
    // a box laid out nearest figure (lowest on screen) first; one that would overlap a label already
    // placed rises just clear of it, and the bubble then sits on its own tag, so no two labels ever
    // print over each other
    drawLabels(ctx, game, drawn) {
        const people = drawn.filter(e => e.agent).sort((p, q) => footY(q) - footY(p));
        const placed = [];
        const place = b => {
            for (let hit; (hit = placed.find(o => boxesOverlap(b, o))); ) b.y = hit.y - b.h - 2;
            placed.push(b);
            return b;
        };
        for (const e of people) {
            const cx = groundPoint(e).x;
            // from the head, or from an open umbrella's top: in rain the tag carries who it is
            const canopy = this.rain.canopy(e);
            let top = canopy ? Math.min(headTop(e), canopy.y) : headTop(e);
            if (e !== game.player && nearPlayer(game, groundPoint(e), params.NAME_RADIUS)) {
                const w = textWidth(e.agent.name, 'body') + 8, h = TEXT_LINE - 2;
                const tag = place({ x: cx - w / 2, y: top - 2 - h, w, h });
                drawPanel(ctx, 'chip', tag.x, tag.y, w, h);
                drawText(ctx, e.agent.name, cx, tag.y + 16, 'body', PANEL_LOOKS.chip.ink.text, 'center');
                ctx.textAlign = 'left';
                top = tag.y;
            }
            if (e.npc && e.npc.showSpeech && e.npc.speechText) {
                const w = textWidth(e.npc.speechText, 'note') + 2 * BUBBLE_PAD, h = TEXT_LINE + BUBBLE_TAIL;
                const b = place({ x: cx - w / 2, y: top - 2 - h, w, h });
                this.drawSpeechBubble(ctx, cx, b.y + h, e.npc.speechText);
            }
        }
    }

    // Tall things fade while they hide the player (ART.md §5): any prop taller than FADE_HEIGHT whose
    // base is south of the player's feet and whose sprite overlaps the player (head to feet across
    // the box) eases toward FADE_ALPHA, and back to opaque once it doesn't. A building's back wall
    // fades the same way, all of it at once (game.backWalls)
    fadeTallProps(deltaTime, game) {
        const player = game.player;
        if (!player) return;
        const top  = headTop(player);
        const seen = { x: player.position.x, y: top, w: player.drawWidth, h: footY(player) - top };
        const step = deltaTime / params.FADE_TIME * (1 - params.FADE_ALPHA);
        const ease = (e, target) => {
            const a = e.alpha ?? 1;
            e.alpha = a < target ? Math.min(target, a + step) : Math.max(target, a - step);
        };
        for (const e of game.props) {
            if (e.sprite.frameHeight * params.ART_SCALE <= params.FADE_HEIGHT) continue;
            ease(e, footY(e) > footY(player) && boxesOverlap(spriteBox(e), seen) ? params.FADE_ALPHA : 1);
        }
        // A back wall fades as one, with its side strips and what hangs on it, while the player's
        // ground point is in its shadow (design/doors.md §3.2): fading one piece would open a hole,
        // fading the whole wall opens none
        const g = groundPoint(player);
        for (const { shadow: s, members } of game.backWalls || []) {
            const behind = g.x >= s.x && g.x < s.x + s.w && g.y >= s.y && g.y <= s.y + s.h;
            for (const e of members) ease(e, behind ? params.FADE_ALPHA : 1);
        }
    }

    // An entity's sprite, from its image tinted by its light if it's `lit` (the ground's decals
    // aren't: the light map shades them), else its colour box
    drawEntity(ctx, entity, lit) {
        const x = entity.position.x;
        const y = entity.position.y;
        const w = entity.drawWidth;
        const h = entity.drawHeight;

        if (entity.sprite && entity.sprite.image) {
            this.drawFrame(ctx, entity, lit ? this.lighting.image(entity) : entity.sprite.image);
        } else if (entity.color) {
            ctx.fillStyle = entity.color;
            ctx.fillRect(x, y, w, h);

            // Facing dot
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            const cx = x + w / 2;
            const cy = y + h / 2;
            const f  = entity.facing ? entity.facing.direction : 'down';
            const dotOffset = 12;
            const dx = f === 'left' ? -dotOffset : f === 'right' ? dotOffset : 0;
            const dy = f === 'up'   ? -dotOffset : f === 'down'  ? dotOffset : 0;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // An entity's sprite frame drawn from an image laid out like its own (its tinted copy, its glow
    // mask): the frame's ground point stands on the bottom-centre of the box
    drawFrame(ctx, entity, image) {
        const s = entity.sprite, b = spriteBox(entity);
        if (!entity.flip) { ctx.drawImage(image, s.frameX, s.frameY, s.frameWidth, b.h / params.ART_SCALE, b.x, b.y, b.w, b.h); return; }
        // mirrored (a critter heading west: its art faces east), about its own box
        ctx.save();
        ctx.translate(b.x + b.w, b.y);
        ctx.scale(-1, 1);
        ctx.drawImage(image, s.frameX, s.frameY, s.frameWidth, b.h / params.ART_SCALE, 0, 0, b.w, b.h);
        ctx.restore();
    }

    // The air pass (design/ambient-life.md §4): each bird in the air, raised by its altitude over
    // its ground point and lit by the light there; then the crow commute crossing high, in the
    // ambient light
    drawAir(ctx, game, cam, W, viewH) {
        for (const e of game.critters || []) {
            if (!(e.critter.alt > 0)) continue;
            ctx.save();
            ctx.translate(0, -e.critter.alt);
            this.drawEntity(ctx, e, true);
            ctx.restore();
        }
        const birds = game.clock ? crowCommute(game, W, viewH) : [];
        if (!birds.length) return;
        const fly = params.CRITTERS.crow.art.fly, img = ASSET_MANAGER.getAsset(fly.image), fw = fly.w;
        const lit = this.lighting.on ? this.lighting.tinted(img, this.lighting.ambient) : img, k = params.ART_SCALE;
        for (const b of birds)   // eastward, as the art faces
            ctx.drawImage(lit, b.frame * fw, 0, fw, img.height, cam.x + b.x, cam.y + b.y, fw * k, img.height * k);
    }

    // Each bird in the air's shadow on the ground beneath it: a small dark ellipse that shrinks a
    // little with height, on the ground pass, so it never draws over anyone
    drawCritterShadows(ctx, game) {
        const shade = params.CRITTERS.SHADOW;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        for (const e of game.critters || []) {
            const alt = e.critter.alt;
            if (!(alt > 0)) continue;
            const g = groundPoint(e), r = e.sprite.frameWidth * params.ART_SCALE * 0.4 * (1 - alt / 200);
            ctx.globalAlpha = shade;
            ctx.beginPath();
            ctx.ellipse(g.x, g.y - 2, r, r * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawTilemap(ctx, game, cam, viewW, viewH) {
        const { tiles, tileSize } = game.currentLevel;
        const art = params.ART_TILE;

        // Only draw tiles visible in the current viewport
        const startCol = Math.max(0, Math.floor(cam.x / tileSize));
        const endCol   = Math.min(tiles[0].length - 1, Math.ceil((cam.x + viewW) / tileSize));
        const startRow = Math.max(0, Math.floor(cam.y / tileSize));
        const endRow   = Math.min(tiles.length - 1, Math.ceil((cam.y + viewH) / tileSize));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const t = game.tileLayout[row][col];
                const x = col * tileSize, y = row * tileSize;
                // An animated tile (open water) steps along its strip from its phase
                const sx = t.loop ? t.sx + ((Math.floor(game.animTime * t.loop.fps) + t.phase) % t.loop.frames) * art : t.sx;
                if (!t.flip) {
                    ctx.drawImage(game.tileSheets[t.set], sx, t.sy, art, art, x, y, tileSize, tileSize);
                    continue;
                }
                // A mirrored tile draws through a left-right flip about its own cell
                ctx.save();
                ctx.translate(x + tileSize, y);
                ctx.scale(-1, 1);
                ctx.drawImage(game.tileSheets[t.set], sx, t.sy, art, art, 0, 0, tileSize, tileSize);
                ctx.restore();
            }
        }
    }

    // Props drawn in a pass of their own, not sorted: decals under everything, overheads over it
    // (entities/props.js); overheads are `lit`, decals are shaded with the ground, except a decal
    // that's light (its type `lit`), drawn with the ground's lights (drawGroundLights)
    drawProps(ctx, props, cam, W, viewH, lit) {
        const m = params.CULL_MARGIN;
        for (const d of props) {
            if (d.decal && PROP_TYPES[d.propType].lit) continue;
            const b = spriteBox(d);
            if (b.x + b.w < cam.x - m || b.x > cam.x + W + m || b.y + b.h < cam.y - m || b.y > cam.y + viewH + m) continue;
            this.drawEntity(ctx, d, lit);
        }
    }

    // The light on the shaded ground, added over it: each lit decal in view while it's lit (the
    // lamps' reflections on the water), and each puddle that lies in a pool of light outdoors,
    // drawn again as a smear of the pool's colour (Lighting.glint)
    drawGroundLights(ctx, decals, cam, W, viewH) {
        if (!this.lighting.on) return;
        const m = params.CULL_MARGIN;
        ctx.globalCompositeOperation = 'lighter';
        for (const d of decals) {
            const def = PROP_TYPES[d.propType];
            if (!def.glints && !def.lit) continue;
            const b = spriteBox(d);
            if (b.x + b.w < cam.x - m || b.x > cam.x + W + m || b.y + b.h < cam.y - m || b.y > cam.y + viewH + m) continue;
            if (def.lit) { if (this.lighting.shines(d)) this.drawFrame(ctx, d, d.sprite.image); continue; }
            const glint = this.lighting.glint(d);
            if (!glint) continue;
            ctx.globalAlpha = glint.alpha;
            this.drawFrame(ctx, d, tintImage(def.image, rgb(...glint.color), 'source-in'));
            ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    // A station the player can use glints on the floor, under whoever stands there (its name and a
    // running task's dots are overlays: ProjectUISystem.drawStations)
    drawStationMarkers(ctx, game) {
        if (!game.stationMap || !game.player) return;
        const half = ICONS.cell * params.ART_SCALE / 2;
        for (const s of Object.values(game.stationMap))
            if (nearPlayer(game, s, params.INTERACT_RADIUS)) drawIcon(ctx, 'marker', s.x - half, s.y - half, game.animTime);
    }

    drawSpeechBubble(ctx, cx, bottomY, text) {
        const bw  = textWidth(text, 'note') + BUBBLE_PAD * 2;
        const bh  = TEXT_LINE;
        const bx  = cx - bw / 2;
        const by  = bottomY - bh - BUBBLE_TAIL;

        // The tail's top row (row 5 of its icon cell) lies over the bubble's bottom outline
        drawPanel(ctx, 'bubble', bx, by, bw, bh);
        drawIcon(ctx, 'bubble_tail', cx - ICONS.cell * params.ART_SCALE / 2, by + bh - 2 - 5 * params.ART_SCALE);

        ctx.fillStyle = PANEL_LOOKS.bubble.ink.text;
        ctx.textAlign = 'center';
        drawText(ctx, text, cx, by + bh - 4, 'note');
        ctx.textAlign = 'left';
    }

    // A building's name shows by its door while the player is near it (game.buildingSigns; a ruin
    // carries none: it's a shell, not a place yet)
    drawBuildingLabels(ctx, game) {
        if (!game.buildingSigns || !game.player) return;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'center';
        for (const sign of game.buildingSigns) {
            if (nearPlayer(game, sign.door, params.NAME_RADIUS)) drawText(ctx, sign.name, sign.x, sign.y, 'bodyBold');
        }
        ctx.textAlign = 'left';
    }
}
