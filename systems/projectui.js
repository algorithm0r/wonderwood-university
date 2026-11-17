// ProjectUISystem
// World-space: station rings/dots, interaction prompt + task selection menu
// Screen-space: project panel, notification stack

const SKILL_ABBR = {
    cs: 'CS', bio: 'Bio', physics: 'Phy', chem: 'Chem', stats: 'Sta',
    reading: 'Rdg', writing: 'Wrt', coding: 'Cod', calculating: 'Cal',
    wetLab: 'Lab', teaching: 'Tch',
};

const STATUS_COLORS = {
    'complete':    '#4caf50',
    'running':     '#29b6f6',
    'in-progress': '#ffc107',
    'available':   '#ffffff',
    'locked':      '#444466',
};

const STATUS_ICONS = {
    'complete':    '✓',
    'running':     '▶',
    'in-progress': '▷',
    'available':   '!',
    'locked':      '○',
};

class ProjectUISystem {
    update(deltaTime, game) {
        const ctx = game.ctx;
        const cam = game.camera || { x: 0, y: 0 };
        const W   = ctx.canvas.width;
        const H   = ctx.canvas.height;

        // Tick notifications
        if (game.notifications) {
            game.notifications.forEach(n => n.timer -= deltaTime);
            game.notifications = game.notifications.filter(n => n.timer > 0);
        }

        // ── World-space elements (camera-transformed) ────────────────────────
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, UI_HEIGHT, W, H - UI_HEIGHT);
        ctx.clip();
        ctx.translate(-cam.x, UI_HEIGHT - cam.y);

        this.drawStations(ctx, game);
        this.drawInteractionPrompt(ctx, game);

        ctx.restore();

        // ── Screen-space elements (fixed to canvas) ──────────────────────────
        ctx.save();
        ctx.translate(0, UI_HEIGHT);

        this.drawProjectPanel(ctx, game);
        this.drawNotifications(ctx, game);

        ctx.restore();
    }

    // ── World-space ───────────────────────────────────────────────────────────

    // A station shows itself only while the player can use it (its name, over the floor marker
    // RenderSystem draws) or a task runs there (the running dots over it): design/ui-assets.md row 21
    drawStations(ctx, game) {
        if (!game.stationMap) return;

        const runningStations = new Set();
        if (game.projects) {
            for (let project of game.projects) {
                for (let task of project.tasks) {
                    if (task.running) runningStations.add(task.stationId);
                }
            }
        }

        for (let station of Object.values(game.stationMap)) {
            const isRunning = runningStations.has(station.id);
            if (nearPlayer(game, station, params.INTERACT_RADIUS)) {
                ctx.fillStyle = station.color;
                ctx.textAlign = 'center';
                drawText(ctx, station.name, station.x, station.y + 24, 'note');
                ctx.textAlign = 'left';
            }
            // The dots float over the station, above a desk's monitor (they're the icon's rows 6-9)
            const half = ICONS.cell * params.ART_SCALE / 2;
            if (isRunning) drawIcon(ctx, 'running', station.x - half, station.y - 120, game.animTime);
        }
    }

    drawInteractionPrompt(ctx, game) {
        if (!game.interactionPrompt) return;
        const p    = game.interactionPrompt;
        const menu = game.stationMenu;

        // ── Multi-choice menu mode ──────────────────────────────────────────
        if (menu && menu.choices.length > 1) {
            const choices = menu.choices;
            const lineH   = TEXT_LINE + 4;
            const padX    = 10;
            const padTop  = 2 * TEXT_LINE + 12;   // title and hint
            // As wide as its hint, or its widest row: a number, the task, and the project's name
            // where two tasks share a name
            const dup = c => choices.filter(o => o.task.label === c.task.label).length > 1;
            const rowW = c => 28 + textWidth(c.task.label, 'bodyBold') + (dup(c) ? 16 + textWidth(c.project.label, 'small') : 0);
            const panelW  = Math.min(440, Math.max(textWidth('Tab / 1\u20139 select   E confirm', 'note') + 24,
                                                   ...choices.map(c => padX * 2 + rowW(c))));
            const panelH  = padTop + choices.length * lineH + 6;

            const bx = p.x - panelW / 2;
            const by = p.headY - panelH - 4;

            drawPanel(ctx, 'menu', bx, by, panelW, panelH);
            const ink = PANEL_LOOKS.menu.ink;

            // Header
            ctx.textAlign = 'center';
            drawText(ctx, 'Choose a task', bx + panelW / 2, by + 18, 'bodyBold', ink.title);
            drawText(ctx, 'Tab / 1\u20139 select   E confirm', bx + panelW / 2, by + 18 + TEXT_LINE, 'note', ink.dim);

            // Separator
            ctx.strokeStyle = ink.rule;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + 4, by + padTop - 4);
            ctx.lineTo(bx + panelW - 4, by + padTop - 4);
            ctx.stroke();

            // Choice rows: number, task, and as much of its project's name as fits
            choices.forEach((c, i) => {
                const ty        = by + padTop + i * lineH;
                const base      = ty + lineH - 7;
                const isSelected = i === menu.selectedIdx;

                // Row highlight
                if (isSelected) {
                    ctx.fillStyle = 'rgba(245,200,66,0.12)';
                    ctx.fillRect(bx + 2, ty, panelW - 4, lineH);
                }

                // Number badge
                ctx.fillStyle = isSelected ? ink.title : ink.hint;
                ctx.textAlign = 'left';
                drawText(ctx, `${i + 1}.`, bx + padX, base, 'noteBold');

                // Task label
                const labelX = bx + padX + 28;
                ctx.fillStyle = isSelected ? ink.title : ink.text;
                drawText(ctx, c.task.label, labelX, base, (isSelected ? 'bodyBold' : 'body'));

                // Project name (right-aligned, cut to the room left), only where two choices
                // share a task name and it tells them apart
                if (dup(c)) {
                    const room = bx + panelW - padX - (labelX + textWidth(c.task.label, 'body') + 16);
                    ctx.fillStyle = isSelected ? '#f5c84299' : ink.faint;
                    ctx.textAlign = 'right';
                    drawText(ctx, fitText(c.project.label, room, 'small'), bx + panelW - padX, base, 'small');
                }
            });

            ctx.textAlign = 'left';
            return;
        }

        // ── Single-task prompt (original behavior) ──────────────────────────
        const task   = p.task;
        const status = task.getStatus(p.project.tasks);
        const grade  = task.getGrade();
        const gradeTag = grade !== '—' && grade !== '' ? ` [${grade}]` : '';

        let label;
        if (task.mode === 'submit') {
            label = `E: Submit — ${p.project.label}`;
        } else if (task.mode === 'passive') {
            const pct = Math.round(task.getProgressFraction() * 100);
            label = pct > 0 ? `${task.label} — ${pct}%${gradeTag}` : task.label;
        } else if (task.mode === 'triggered') {
            label = task.running
                ? `${task.label} — running…${gradeTag}`
                : `E: Start — ${task.label}`;
        } else {
            label = status === 'in-progress'
                ? `E: Continue — ${task.label}${gradeTag}`
                : `E: Start — ${task.label}`;
        }

        // Above the head, so the figure (seated or standing) stays in view
        const tw = ICON_SIZE + 4 + textWidth(label, 'textBold') + 12;
        const cx = p.x - tw / 2, cy = p.headY - 4 - ICON_SIZE;

        drawPanel(ctx, 'chip', cx, cy, tw, ICON_SIZE);
        drawIcon(ctx, `mode_${task.mode}`, cx, cy);
        ctx.fillStyle = task.mode === 'submit'    ? '#a78bfa'
                      : task.mode === 'triggered' ? '#29b6f6'
                      : '#f5c842';
        ctx.textAlign = 'left';
        drawText(ctx, label, cx + ICON_SIZE + 4, cy + 23, 'textBold');
    }

    // ── Screen-space ──────────────────────────────────────────────────────────

    // The project list, top right: each project's name and reward, then one line per task (its
    // status, name, skill rewards, progress and grade). A Submit row shows once it unlocks
    drawProjectPanel(ctx, game) {
        if (!game.projects || game.projects.length === 0) return;

        const panelW  = game.projectListCollapsed ? 260 : 340;   // narrower collapsed (P): titles only
        const margin  = 10;
        const lineH   = TEXT_LINE + 2;       // a task's line
        const headH   = 2 * TEXT_LINE + 4;   // a project's name and its reward
        const projPad = 10;
        const rows = project => project.tasks.filter(t => !(t.mode === 'submit' && t.getStatus(project.tasks) === 'locked'));

        // Collapsed (P): a line per project, its name and a dot where one of its tasks can be done now
        const collapsed = !!game.projectListCollapsed;
        const actionable = project => project.tasks.some(t => ['available', 'in-progress'].includes(t.getStatus(project.tasks)));

        let totalH = margin;
        for (let project of game.projects) {
            totalH += collapsed ? lineH : headH + rows(project).length * lineH + projPad;
        }
        if (collapsed) totalH += margin;

        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height - UI_HEIGHT;
        const px = canvasW - panelW - margin;
        const py = margin;
        const panelH = Math.min(totalH, canvasH - margin * 2);

        drawPanel(ctx, 'list', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.list.ink;

        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, panelW, panelH);
        ctx.clip();

        let curY = py + margin;
        if (collapsed) {
            for (const project of game.projects) {
                const done = project.isComplete();
                ctx.fillStyle = done ? '#4caf50' : project.isAttendance ? '#a0c4ff' : ink.title;
                drawText(ctx, fitText(project.label, panelW - 36, 'textBold'), px + 8, curY + 14, 'textBold');
                if (!done && actionable(project)) {
                    ctx.fillStyle = '#f5c842';
                    ctx.beginPath();
                    ctx.arc(px + panelW - 14, curY + 9, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                curY += lineH;
            }
            ctx.restore();
            return;
        }
        // The right of a task's line: its progress bar, then its grade
        const gradeX = px + panelW - 8, barW = 44, barX = gradeX - 16 - 6 - barW;

        for (let project of game.projects) {
            const done = project.isComplete();
            const isClass = !!project.isAttendance;

            ctx.fillStyle = done ? '#4caf50' : isClass ? '#a0c4ff' : ink.title;
            drawText(ctx, fitText(project.label, panelW - 16, 'textBold'), px + 8, curY + 14, 'textBold');

            ctx.fillStyle = done ? '#4caf50' : isClass ? '#5a7aaa' : '#7986cb';
            if (isClass) {
                // Show attendance fraction instead of rep
                const t = project.tasks[0];
                const pct = t ? Math.round(t.getProgressFraction() * 100) : 0;
                drawText(ctx, `attending — ${pct}%`, px + 8, curY + 14 + TEXT_LINE, 'note');
            } else {
                drawText(ctx, done ? 'COMPLETE' : `${project.reputationReward} rep`, px + 8, curY + 14 + TEXT_LINE, 'note');
            }
            curY += headH;

            for (let task of rows(project)) {
                const status = task.getStatus(project.tasks);
                const base = curY + 14;
                if (task.mode === 'submit') {
                    ctx.fillStyle = '#a78bfa';
                    drawText(ctx, status === 'complete' ? '✓ Submitted' : '! Submit at Office', px + 8, base, 'note');
                    curY += lineH;
                    continue;
                }
                const grade = task.getGrade();
                const graded = grade !== '—' && grade !== '';
                const barred = status === 'in-progress' || status === 'running';
                // The rewards end before the bar if there is one, else before the grade, else at the edge
                const rewardEnd = barred ? barX - 8 : graded ? gradeX - 24 : gradeX;

                // Skill rewards, right-aligned
                let rewardW = 0;
                if (task.skillRewards && task.skillRewards.length > 0) {
                    const rewardText = task.skillRewards.map(r => `+${SKILL_ABBR[r.skill] || r.skill} ${r.amount}`).join(' ');
                    rewardW = textWidth(rewardText, 'small');
                    ctx.fillStyle = status === 'complete' ? '#3a5a3a' : '#5a8a5a';
                    drawText(ctx, rewardText, rewardEnd, base, 'small', undefined, 'right');
                    ctx.textAlign = 'left';
                }

                // Status icon + as much of the task's name as fits before the rewards
                ctx.fillStyle = STATUS_COLORS[status] || '#888';
                drawText(ctx, STATUS_ICONS[status], px + 8, base, 'body');
                drawText(ctx, fitText(task.label, rewardEnd - rewardW - 8 - (px + 26), 'body'), px + 26, base, 'body');

                // Grade letter (right side)
                if (graded) {
                    const gradeColor = grade.startsWith('A') ? '#f5c842'
                                     : grade === 'B'        ? '#81c784'
                                     : grade === 'C'        ? '#ffc107'
                                     : grade === 'D'        ? '#ff9800'
                                     : '#ef5350';
                    ctx.fillStyle = gradeColor;
                    drawText(ctx, grade, gradeX, base, 'bodyBold', undefined, 'right');
                    ctx.textAlign = 'left';
                }

                // Progress bar (toward A grade)
                if (barred) {
                    const frac = task.getProgressFraction();
                    ctx.fillStyle = '#333';
                    ctx.fillRect(barX, base - 9, barW, 8);
                    ctx.fillStyle = STATUS_COLORS[status];
                    ctx.fillRect(barX, base - 9, barW * frac, 8);
                }

                curY += lineH;
            }

            curY += projPad;
            if (project !== game.projects[game.projects.length - 1]) {
                ctx.strokeStyle = ink.rule;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px + 4, curY - projPad / 2);
                ctx.lineTo(px + panelW - 4, curY - projPad / 2);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawNotifications(ctx, game) {
        if (!game.notifications || game.notifications.length === 0) return;

        const canvasW = ctx.canvas.width;

        let ny = 16;
        for (let n of game.notifications.slice(0, 4)) {
            const alpha = Math.min(n.timer, 1.0);
            const tw    = textWidth(n.message, 'large') + 20;
            const nx    = (canvasW - tw) / 2;

            ctx.globalAlpha = alpha;
            drawPanel(ctx, 'chip', nx, ny, tw, TEXT_LINE + 4);
            ctx.fillStyle = PANEL_LOOKS.chip.ink.text;
            drawText(ctx, n.message, nx + 10, ny + 18, 'large');
            ctx.globalAlpha = 1;
            ny += TEXT_LINE + 16;
        }
    }
}
