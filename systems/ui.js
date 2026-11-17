// UISystem - renders the HUD bar and optional overlays
// C key toggles the character sheet

const WELLBEING_COLORS = {
    'thriving':    '#4caf50',
    'stable':      '#8bc34a',
    'stressed':    '#ffc107',
    'depleted':    '#ff9800',
    'burning-out': '#f44336',
    'burned-out':  '#9c27b0',
};

class UISystem {
    update(deltaTime, game) {
        const ctx = game.ctx;
        const W = ctx.canvas.width;

        drawPanel(ctx, 'hud', 0, 0, W, UI_HEIGHT);
        const ink = PANEL_LOOKS.hud.ink;

        if (!game.clock) return;

        // --- LEFT: Time and day ---
        drawIcon(ctx, 'clock', 12, 6);
        ctx.fillStyle = ink.title;
        drawText(ctx, game.clock.getTimeString(), 48, 28, 'clock');
        drawIcon(ctx, 'calendar', 12, 32);
        ctx.fillStyle = ink.dim;
        drawText(ctx, `${game.clock.getDayName()}  Week ${game.clock.week}`, 48, 54, 'large');
        const player = game.player;
        if (player) {
            drawIcon(ctx, 'money', 196, 32);
            ctx.fillStyle = '#81c784';
            drawText(ctx, `$${player.agent.money}`, 196 + ICON_SIZE + 4, 54, 'large');
        }

        // --- CENTER: Player agent info ---
        if (player) {
            const agent = player.agent;

            ctx.fillStyle = ink.title;
            ctx.textAlign = 'center';
            drawText(ctx, agent.name, W / 2, 20, 'headingBold');

            ctx.fillStyle = ink.dim;
            drawText(ctx, agent.stage.charAt(0).toUpperCase() + agent.stage.slice(1), W / 2, 39, 'text');

            // C / I hints: a key-cap and what it opens, centred as a pair
            ctx.textAlign = 'left';
            const hints = [['C', 'skills'], ['I', 'items']], gap = 16;
            const hintW = hints.reduce((w, [, word]) => w + 24 + 6 + textWidth(word, 'note'), 0) + gap;
            let hx = W / 2 - hintW / 2;
            for (const [key, word] of hints) {
                hx += drawKeycap(ctx, key, hx, 42) + 6;
                drawText(ctx, word, hx, 58, 'note', ink.dim);
                hx += textWidth(word, 'note') + gap;
            }

            // --- RIGHT: Wellbeing and reputation: icon, bar, value (the icon names the measure) ---
            const labelW = textWidth('burning-out', 'body');
            const barW = 96, barH = 10;
            const barX = W - 16 - labelW - 8 - barW;
            const iconX = barX - ICON_SIZE - 4;
            const row = (y, icon, fill, share, label) => {
                drawIcon(ctx, icon, iconX, y - 22);
                ctx.fillStyle = ink.faint;
                ctx.fillRect(barX, y - 10, barW, barH);
                ctx.fillStyle = fill;
                ctx.fillRect(barX, y - 10, barW * share, barH);
                ctx.fillStyle = ink.text;
                drawText(ctx, label, barX + barW + 8, y, 'body');
            };
            row(24, WELLBEING_ICONS[agent.wellbeingState] || 'wb_stable', WELLBEING_COLORS[agent.wellbeingState] || '#888',
                agent.wellbeing / 100, agent.wellbeingState);
            row(52, 'reputation', '#7986cb', agent.reputation / 100, `${Math.floor(agent.reputation)}`);
        }

        // --- Timeline bar ---
        this.drawTimeline(ctx, game, W);

        // --- Character sheet overlay ---
        if (game.activePanel === 'char-sheet' && player && player.skills) {
            this.drawCharSheet(ctx, player, W, game.ctx.canvas.height);
        }

        // --- Inventory overlay ---
        if (game.activePanel === 'inventory' && player && player.inventory) {
            this.drawInventory(ctx, player, W, game.ctx.canvas.height);
        }

        // --- NPC dialogue panel ---
        if (game.npcDialogue) {
            this.drawNpcDialogue(ctx, game.npcDialogue, W, game.ctx.canvas.height, game);
        }

        // --- Nearby NPC E-hint ---
        if (!game.npcDialogue && !game.interactionPrompt && game.nearbyNpc) {
            ctx.fillStyle = ink.hint;
            ctx.textAlign = 'center';
            drawText(ctx, 'E — talk', W / 2, game.ctx.canvas.height - 30, 'note');
            ctx.textAlign = 'left';
        }
    }

    drawTimeline(ctx, game, W) {
        if (!game.clock) return;

        const stripH = params.TIMELINE_HEIGHT;
        const stripY = UI_HEIGHT - stripH;   // under the main HUD content
        const padX   = 6;
        const barW   = W - padX * 2;
        const textY  = stripY + stripH - 6;  // a line of text's baseline inside the strip

        // Strip background
        ctx.fillStyle = '#0f0f1e';
        ctx.fillRect(0, stripY, W, stripH);

        // Top separator
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, stripY);
        ctx.lineTo(W, stripY);
        ctx.stroke();

        // Map a game-minute to an x pixel
        const toX = (minute) => padX + (minute / DAY_LENGTH_MINUTES) * barW;

        // Today's classes as blocks, each { x, w, event }
        const blocks = (game.scheduledEvents || [])
            .filter(e => e.dayOfWeek === game.clock.day && e.duration)
            .map(e => ({ x: toX(e.startMinute), w: Math.max(3, (e.duration / DAY_LENGTH_MINUTES) * barW), event: e }));

        // Hour tick marks, and a label every 2 hours where no block covers it
        for (let h = 0; h <= 20; h += 2) {
            const x = toX(h * 60);
            ctx.fillStyle = '#252540';
            ctx.fillRect(Math.floor(x), stripY + 1, 1, stripH - 2);

            if (h < 20) {
                const hour24 = (DAY_START_HOUR + h) % 24;
                const label  = hour24 < 12
                    ? `${hour24 || 12}a`
                    : `${hour24 === 12 ? 12 : hour24 - 12}p`;
                const lx = x + 4, lw = textWidth(label, 'tiny');
                if (blocks.some(b => lx < b.x + b.w && b.x < lx + lw)) continue;
                ctx.fillStyle = '#4a4a70';
                ctx.textAlign = 'left';
                drawText(ctx, label, lx, textY, 'tiny');
            }
        }

        // The blocks, each labelled with its course's code, or its department's icon where the
        // code doesn't fit (an icon is 32 px, so it stands a little proud of the 24 px strip)
        for (const { x, w, event } of blocks) {
            ctx.fillStyle = event.action === 'start-class' ? '#2a5a88' : '#5a4a78';
            ctx.fillRect(x, stripY + 2, w, stripH - 4);
            const code = courseCode(event.classLabel || event.label || '');
            const icon = SKILL_ICONS[event.domainSkill];
            if (textWidth(code, 'tiny') <= w - 8) {
                ctx.fillStyle = '#9ccaf0';
                ctx.textAlign = 'left';
                drawText(ctx, code, x + 4, textY, 'tiny');
            } else if (icon && w >= ICON_SIZE - 8) {
                drawIcon(ctx, icon, x + w / 2 - ICON_SIZE / 2, stripY + stripH / 2 - ICON_SIZE / 2);
            }
        }

        // Current-time cursor
        const curX = Math.floor(toX(game.clock.getGameMinute()));
        ctx.fillStyle = '#f5c842';
        ctx.fillRect(curX, stripY + 1, 2, stripH - 2);

        ctx.textAlign = 'left';
    }

    drawCharSheet(ctx, player, W, H) {
        const skills = player.skills;
        const agent  = player.agent;

        // Two columns of skill rows (icon, name, bar, value); the method column is a row longer
        const rowH = ICON_SIZE + 2, barW = 110;
        const colW = ICON_SIZE + 8 + 48 + 6 + barW + 8 + 48;
        const panelW = 16 + colW + 24 + colW + 16;
        const panelH = 96 + 6 * rowH + 44;
        const px = Math.floor((W - panelW) / 2);
        const py = Math.floor((H - panelH) / 2);

        drawPanel(ctx, 'sheet', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.sheet.ink;

        // Title
        ctx.fillStyle = ink.title;
        ctx.textAlign = 'center';
        drawText(ctx, `${agent.name}`, px + panelW / 2, py + 24, 'headingBold');
        ctx.fillStyle = ink.dim;
        drawText(ctx, agent.stage.charAt(0).toUpperCase() + agent.stage.slice(1), px + panelW / 2, py + 44, 'body');
        ctx.textAlign = 'left';

        // Separator
        ctx.strokeStyle = ink.rule;
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 56);
        ctx.lineTo(px + panelW - 12, py + 56);
        ctx.stroke();

        // ── Domain Knowledge ────────────────────────────────────────────────
        const domainEntries = [
            { key: 'cs',      label: 'CS' },
            { key: 'bio',     label: 'Bio' },
            { key: 'physics', label: 'Phy' },
            { key: 'chem',    label: 'Chem' },
            { key: 'stats',   label: 'Sta' },
        ];

        ctx.fillStyle = onPaper('#a0c4ff');
        drawText(ctx, 'DOMAIN KNOWLEDGE', px + 16, py + 82, 'noteBold');

        domainEntries.forEach((entry, i) => {
            const val = skills.domain[entry.key] || 0;
            this.drawSkillRow(ctx, px + 16, py + 92 + i * rowH, SKILL_ICONS[entry.key], entry.label, val, barW, '#4a7aaa');
        });

        // ── Method Skills ───────────────────────────────────────────────────
        const methodEntries = [
            { key: 'reading',     label: 'Read' },
            { key: 'writing',     label: 'Wrt' },
            { key: 'coding',      label: 'Code' },
            { key: 'calculating', label: 'Calc' },
            { key: 'wetLab',      label: 'Lab' },
            { key: 'teaching',    label: 'Tch' },
        ];

        const col2x = px + 16 + colW + 24;
        ctx.fillStyle = onPaper('#b9f6ca');
        drawText(ctx, 'METHOD SKILLS', col2x, py + 82, 'noteBold');

        methodEntries.forEach((entry, i) => {
            const val = skills.method[entry.key] || 0;
            this.drawSkillRow(ctx, col2x, py + 92 + i * rowH, SKILL_ICONS[entry.key], entry.label, val, barW, '#4a8a5a');
        });

        // Close hint
        ctx.fillStyle = ink.hint;
        ctx.textAlign = 'center';
        drawText(ctx, 'C \u2014 close', px + panelW / 2, py + panelH - 12, 'note');
        ctx.textAlign = 'left';
    }

    drawInventory(ctx, player, W, H) {
        const agent     = player.agent;
        const inventory = player.inventory;

        const rowH   = ICON_SIZE + 4;
        const panelW = 440;
        const panelH = 340;
        const px = Math.floor((W - panelW) / 2);
        const py = Math.floor((H - panelH) / 2);

        drawPanel(ctx, 'sheet', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.sheet.ink;

        // Title
        ctx.fillStyle = ink.title;
        ctx.textAlign = 'center';
        drawText(ctx, agent.name, px + panelW / 2, py + 24, 'headingBold');

        // Money
        ctx.fillStyle = onPaper('#81c784');
        drawText(ctx, `$${agent.money}`, px + panelW / 2, py + 46, 'text');
        ctx.textAlign = 'left';

        // Separator
        ctx.strokeStyle = ink.rule;
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 58);
        ctx.lineTo(px + panelW - 12, py + 58);
        ctx.stroke();

        // Section header
        ctx.fillStyle = onPaper('#a0c4ff');
        drawText(ctx, 'ITEMS', px + 16, py + 84, 'noteBold');

        // Item rows: the item's icon (or its type, for an item without one), name and quantity
        const items = inventory.items;
        if (items.length === 0) {
            ctx.fillStyle = ink.faint;
            drawText(ctx, 'No items.', px + 16, py + 110, 'body');
        } else {
            const typeColors = {
                key:        '#f5c842',
                book:       '#7ab4e8',
                food:       '#81c784',
                consumable: '#f0a87a',
                equipment:  '#c8a2c8',
            };
            items.forEach((item, i) => {
                const ey = py + 94 + i * rowH;
                const icon = ITEM_ICONS[item.id];
                if (icon) drawIcon(ctx, icon, px + 16, ey);
                else {
                    ctx.fillStyle = onPaper(typeColors[item.type] || '#888');
                    drawText(ctx, `[${item.type}]`, px + 16, ey + 22, 'small');
                }

                // Name
                ctx.fillStyle = ink.text;
                drawText(ctx, item.name, px + 16 + ICON_SIZE + 12, ey + 22, 'body');

                // Quantity (skip for keys — always 1)
                if (item.type !== 'key') {
                    ctx.fillStyle = ink.dim;
                    ctx.textAlign = 'right';
                    drawText(ctx, `\u00d7${item.quantity}`, px + panelW - 16, ey + 22, 'note');
                    ctx.textAlign = 'left';
                }
            });
        }

        // Close hint
        ctx.fillStyle = ink.hint;
        ctx.textAlign = 'center';
        drawText(ctx, 'I \u2014 close', px + panelW / 2, py + panelH - 12, 'note');
        ctx.textAlign = 'left';
    }

    drawNpcDialogue(ctx, dialogue, W, H, game) {
        const more = dialogue.lineIndex < dialogue.lines.length - 1;
        drawDialogue(ctx, W, H, { name: dialogue.name, color: dialogue.color, text: dialogue.lines[dialogue.lineIndex] || '',
                                  hint: more ? 'E \u2014 continue' : 'E \u2014 close', more }, game.animTime);
    }

    // One skill: its icon at x, y (the row's top), its name, a bar and its value
    drawSkillRow(ctx, x, y, icon, label, value, barW, barColor) {
        const ink  = PANEL_LOOKS.sheet.ink;
        const base = y + 22;                         // the text's baseline, level with the icon
        const barX = x + ICON_SIZE + 8 + 48 + 6;
        const barH = 10;

        drawIcon(ctx, icon, x, y);
        ctx.fillStyle = ink.dim;
        drawText(ctx, label, x + ICON_SIZE + 8, base, 'note');

        // Bar track, then the fill
        ctx.fillStyle = ink.rule;
        ctx.fillRect(barX, base - 10, barW, barH);
        if (value > 0) {
            ctx.fillStyle = barColor;
            ctx.fillRect(barX, base - 10, (value / 1000) * barW, barH);
        }

        // Value label
        ctx.fillStyle = value > 0 ? ink.text : ink.faint;
        drawText(ctx, Math.floor(value), barX + barW + 8, base, 'note');
    }
}
