// SleepSystem
// Handles: bed proximity prompt, alarm-select UI, day summary overlay, day transition
//
// States:
//   idle         — normal play; shows "E — Sleep" prompt when near bed
//   alarm-select — modal overlay; player chooses wake time with ↑↓, confirms with E
//   summary      — day summary overlay; E advances to new day

const ALARM_HOURS = [6, 7, 8, 9, 10, 11, 12]; // selectable wake times (24h)

class SleepSystem {
    constructor() {
        this.keys     = new KeyEdge();
        this.state    = 'idle';
        this.alarmIdx = 2;    // default: 8am
        this.summary  = null;
    }

    update(deltaTime, game) {
        const ctx = game.ctx;
        const eTap   = this.keys.tap('e',         game.keys);
        const upTap  = this.keys.tap('ArrowUp',   game.keys) || this.keys.tap('w', game.keys);
        const dwnTap = this.keys.tap('ArrowDown',  game.keys) || this.keys.tap('s', game.keys);
        const escTap = this.keys.tap('Escape',     game.keys);

        // ── Alarm-select overlay ───────────────────────────────────────────────
        if (this.state === 'alarm-select') {
            game.paused = true;
            if (escTap) {
                this.state = 'idle';
                game.paused = false;
                return;
            }
            if (upTap)  this.alarmIdx = Math.max(0, this.alarmIdx - 1);
            if (dwnTap) this.alarmIdx = Math.min(ALARM_HOURS.length - 1, this.alarmIdx + 1);
            if (eTap) {
                this.summary = this.collectSummary(game);
                this.state = 'summary';
            }
            this.drawAlarmSelect(ctx, game);
            return;
        }

        // ── Summary overlay ────────────────────────────────────────────────────
        if (this.state === 'summary') {
            game.paused = true;
            if (eTap) {
                const wakeHour = ALARM_HOURS[this.alarmIdx];
                game.clock.advanceDay(wakeHour);
                game.dayStats = { skillsGained: {}, projectsCompleted: [] };
                this.state = 'idle';
                game.paused = false;
            }
            this.drawSummary(ctx, game);
            return;
        }

        // ── Idle — check bed proximity ─────────────────────────────────────────
        game.paused = false;

        const bedStation = game.stationMap && game.stationMap['bed'];
        if (!bedStation) return;

        const player = game.player;
        if (!player) return;

        // The bed while it is E's target (interactTarget)
        if (game.interactTarget && game.interactTarget.kind === 'bed') {
            this.drawBedPrompt(ctx, game, bedStation);
            if (eTap) {
                this.state = 'alarm-select';
            }
        }
    }

    // ── Day data collection ────────────────────────────────────────────────────

    collectSummary(game) {
        const wakeHour = ALARM_HOURS[this.alarmIdx];
        return {
            dayName:           game.clock.getDayName(),
            week:              game.clock.week,
            timeSlept:         game.clock.getTimeString(),
            hoursSlept:        this.hoursUntilWake(game.clock, wakeHour),
            wakeLabel:         timeOfDay(wakeHour),
            skillsGained:      { ...(game.dayStats?.skillsGained || {}) },
            projectsCompleted: [ ...(game.dayStats?.projectsCompleted || []) ],
        };
    }

    hoursUntilWake(clock, wakeHour) {
        const curHour = clock.getHour();
        const curMin  = clock.getMinute();
        let hours;
        if (wakeHour > curHour) {
            hours = wakeHour - curHour - curMin / 60;
        } else {
            // Wake is next day
            hours = (24 - curHour) + wakeHour - curMin / 60;
        }
        return Math.round(hours * 10) / 10;
    }

    // ── Draw helpers ──────────────────────────────────────────────────────────

    drawBedPrompt(ctx, game, bedStation) {
        const cam = game.camera || { x: 0, y: 0 };
        const W   = ctx.canvas.width;
        const H   = ctx.canvas.height;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, UI_HEIGHT, W, H - UI_HEIGHT);
        ctx.clip();
        ctx.translate(-cam.x, UI_HEIGHT - cam.y);

        const label = 'E — Sleep';
        const bx = bedStation.x;
        const by = bedStation.y - 18;

        // A chip with the bed's icon at its left, like a station's prompt
        const tw = ICON_SIZE + 4 + textWidth(label, 'textBold') + 12;
        const cx = bx - tw / 2, cy = by - ICON_SIZE;
        drawPanel(ctx, 'chip', cx, cy, tw, ICON_SIZE);
        drawIcon(ctx, 'sleep_bed', cx, cy);
        ctx.fillStyle = '#a78bfa';
        ctx.textAlign = 'left';
        drawText(ctx, label, cx + ICON_SIZE + 4, cy + 23, 'textBold');

        ctx.restore();
    }

    drawAlarmSelect(ctx, game) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // Dim the world
        ctx.fillStyle = 'rgba(5, 5, 15, 0.88)';
        ctx.fillRect(0, 0, W, H);

        const panelW = 380;
        const lineH  = TEXT_LINE + 4;
        const panelH = 76 + ALARM_HOURS.length * lineH + 12;
        const px = Math.floor((W - panelW) / 2);
        const py = Math.floor((H - panelH) / 2);

        drawPanel(ctx, 'alarm', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.alarm.ink;

        ctx.fillStyle = ink.title;
        ctx.textAlign = 'center';
        drawText(ctx, 'Set Alarm', px + panelW / 2, py + 28, 'headingBold');
        drawIcon(ctx, 'sleep_alarm', px + panelW / 2 - textWidth('Set Alarm', 'headingBold') / 2 - ICON_SIZE - 8, py + 6);

        ctx.fillStyle = ink.hint;
        drawText(ctx, '↑↓ change   E confirm   Esc cancel', px + panelW / 2, py + 52, 'note');

        ctx.strokeStyle = ink.rule;
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 64);
        ctx.lineTo(px + panelW - 12, py + 64);
        ctx.stroke();

        ALARM_HOURS.forEach((hour, i) => {
            const ey = py + 72 + i * lineH;
            const isSelected = i === this.alarmIdx;

            if (isSelected) {
                ctx.fillStyle = 'rgba(167,139,250,0.15)';
                ctx.fillRect(px + 8, ey, panelW - 16, lineH);
            }

            ctx.fillStyle = isSelected ? onPaper('#a78bfa') : ink.hint;
            ctx.textAlign = 'center';
            drawText(ctx, (isSelected ? '▶  ' : '   ') + timeOfDay(hour),
                         px + panelW / 2, ey + lineH - 6, (isSelected ? 'textBold' : 'body'));
        });

        ctx.textAlign = 'left';
    }

    drawSummary(ctx, game) {
        const s = this.summary;
        if (!s) return;

        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        ctx.fillStyle = 'rgba(5, 5, 15, 0.94)';
        ctx.fillRect(0, 0, W, H);

        const panelW = 480;
        const panelH = 300;
        const px = Math.floor((W - panelW) / 2);
        const py = Math.floor((H - panelH) / 2);

        drawPanel(ctx, 'summary', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.summary.ink;

        // Header
        ctx.fillStyle = ink.title;
        ctx.textAlign = 'center';
        drawText(ctx, `End of ${s.dayName}  —  Week ${s.week}`, px + panelW / 2, py + 28, 'headingBold');

        ctx.fillStyle = ink.hint;
        drawText(ctx,
            `Slept at ${s.timeSlept}  ·  ${s.hoursSlept}h  ·  Alarm: ${s.wakeLabel}`,
            px + panelW / 2, py + 50
        , 'note');

        ctx.strokeStyle = ink.rule;
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 62);
        ctx.lineTo(px + panelW - 12, py + 62);
        ctx.stroke();

        let curY = py + 88;

        // Projects completed
        ctx.fillStyle = ink.dim;
        ctx.textAlign = 'left';
        drawText(ctx, 'PROJECTS COMPLETED', px + 16, curY, 'noteBold');
        curY += TEXT_LINE + 2;

        if (s.projectsCompleted.length === 0) {
            ctx.fillStyle = ink.faint;
            drawText(ctx, 'none today', px + 16, curY, 'body');
            curY += TEXT_LINE;
        } else {
            for (const label of s.projectsCompleted) {
                ctx.fillStyle = onPaper('#4caf50');
                drawText(ctx, `✓ ${label}`, px + 16, curY, 'body');
                curY += TEXT_LINE;
            }
        }

        curY += 12;

        // Skills gained: each skill's icon and its gain, four to a row
        ctx.fillStyle = ink.dim;
        drawText(ctx, 'SKILLS GAINED', px + 16, curY, 'noteBold');
        curY += 8;

        const skillEntries = Object.entries(s.skillsGained).filter(([, v]) => v > 0);
        if (skillEntries.length === 0) {
            ctx.fillStyle = ink.faint;
            drawText(ctx, 'none today', px + 16, curY + TEXT_LINE, 'body');
        } else {
            const cellW = (panelW - 32) / 4;
            skillEntries.forEach(([k, v], i) => {
                const ex = px + 16 + (i % 4) * cellW, ey = curY + Math.floor(i / 4) * (ICON_SIZE + 4);
                if (SKILL_ICONS[k]) drawIcon(ctx, SKILL_ICONS[k], ex, ey);
                ctx.fillStyle = onPaper('#5a8a5a');
                drawText(ctx, SKILL_ICONS[k] ? `+${v}` : `+${k} ${v}`, ex + ICON_SIZE + 4, ey + 22, 'body');
            });
        }

        // Footer
        ctx.fillStyle = ink.hint;
        ctx.textAlign = 'center';
        drawText(ctx, 'E — begin new day', px + panelW / 2, py + panelH - 14, 'note');
        ctx.textAlign = 'left';
    }

}
