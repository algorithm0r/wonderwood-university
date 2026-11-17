// CalendarSystem
// Draws the weekly calendar overlay (F to toggle).
// Shows commitments as colored blocks on a 7-day grid.
// ← → navigate weeks, Esc closes.
// Sets game.activePanel = 'calendar' while open so other panel systems pause input.

// Grid covers 6am–10pm (DAY_START_HOUR to DAY_START_HOUR + 16h)
const CAL_START_MINUTE = 0;        // 6am = minute 0 (relative to DAY_START_HOUR)
const CAL_END_MINUTE   = 960;      // 10pm = minute 960
const CAL_RANGE        = CAL_END_MINUTE - CAL_START_MINUTE;
// The grid's day columns and odd hours: a shade above the dark panel's slate, as they were above
// the old navy (even hours draw in the panel's rule ink); both lifted ~20% in value so the empty
// grid reads (audit 2 #15)
const CAL_GRID_MINOR   = '#3c4853';

// Sun=1, Mon=2 … Sat=7  (column index = dayOfWeek - 1)
// DAY_NAMES — global from util.js

class CalendarSystem {
    constructor() {
        this.keys      = new KeyEdge();
        this.viewWeek  = 1;
        this._wasOpen  = false;
    }

    update(deltaTime, game) {
        if (game.activePanel !== 'calendar') { this._wasOpen = false; return; }

        // Snap to current week on open
        if (!this._wasOpen) {
            this.viewWeek = (game.clock && game.clock.week) || 1;
            this._wasOpen = true;
        }

        const escTap   = this.keys.tap('Escape',    game.keys);
        const leftTap  = this.keys.tap('ArrowLeft', game.keys);
        const rightTap = this.keys.tap('ArrowRight',game.keys);

        if (escTap) {
            game.activePanel = null;
            return;
        }

        const quarterLen = (game.quarter && game.quarter.length) || 6;
        if (leftTap)  this.viewWeek = Math.max(1, this.viewWeek - 1);
        if (rightTap) this.viewWeek = Math.min(quarterLen, this.viewWeek + 1);

        this._draw(game);
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    _draw(game) {
        const ctx = game.ctx;
        const cw  = ctx.canvas.width;
        const ch  = ctx.canvas.height;

        // Panel geometry
        const PW       = Math.min(740, cw - 40);
        const PH       = 510;
        const px       = Math.round((cw - PW) / 2);
        const py       = Math.round((ch - PH) / 2);

        const HEADER_H   = 2 * TEXT_LINE + 16;    // the week, and 'current' under it
        const DAY_HDR_H  = TEXT_LINE + 8;
        const FOOTER_H   = TEXT_LINE + 16;
        const GRID_H     = PH - HEADER_H - DAY_HDR_H - FOOTER_H;  // ~390
        const TIME_COL_W = textWidth('10am', 'small') + 12;
        const GRID_W     = PW - TIME_COL_W - 8;
        const COL_W      = Math.floor(GRID_W / 7);

        const gridLeft = px + TIME_COL_W;
        const gridTop  = py + HEADER_H + DAY_HDR_H;

        ctx.save();

        drawPanel(ctx, 'calendar', px, py, PW, PH);
        const ink = PANEL_LOOKS.calendar.ink;

        // ── Header ───────────────────────────────────────────────────────────
        const quarter    = game.quarter;
        const weekLabel  = quarter ? quarter.weekLabel(this.viewWeek) : `Week ${this.viewWeek}`;
        const weekType   = quarter ? quarter.weekType(this.viewWeek)  : 'active';
        const typeAccent = weekType === 'finals' ? '#e05555'
                         : weekType === 'break'  ? '#81c784'
                         :                         '#5b9bd5';

        ctx.fillStyle    = typeAccent;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, weekLabel, px + PW / 2, py + 18, 'title');

        // Nav arrows
        const quarterLen = (quarter && quarter.length) || 6;
        const arrowColor = '#4a6a8a';

        if (this.viewWeek > 1) {
            ctx.fillStyle = arrowColor;
            drawText(ctx, '◀', px + 24, py + 18, 'titleLarge');
        }
        if (this.viewWeek < quarterLen) {
            ctx.fillStyle = arrowColor;
            drawText(ctx, '▶', px + PW - 24, py + 18, 'titleLarge');
        }

        // Current week indicator
        const currentWeek = game.clock ? game.clock.week : 1;
        if (this.viewWeek === currentWeek) {
            ctx.fillStyle = ink.faint;
            drawText(ctx, 'current', px + PW / 2, py + 18 + TEXT_LINE, 'note');
        }

        // ── Header divider ───────────────────────────────────────────────────
        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + HEADER_H);
        ctx.lineTo(px + PW - 8, py + HEADER_H);
        ctx.stroke();

        // ── Day header row ────────────────────────────────────────────────────
        ctx.textBaseline = 'middle';
        const today = (game.clock && this.viewWeek === currentWeek) ? game.clock.day : -1;

        for (let d = 0; d < 7; d++) {
            const cx   = gridLeft + d * COL_W + COL_W / 2;
            const cy   = py + HEADER_H + DAY_HDR_H / 2;
            const isToday = (d + 1) === today;
            ctx.fillStyle = isToday ? typeAccent : ink.dim;
            ctx.textAlign = 'center';
            drawText(ctx, DAY_NAMES[d], cx, cy, 'bodyBold');
        }

        // ── Grid area ────────────────────────────────────────────────────────

        // Clip to grid
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py + HEADER_H + DAY_HDR_H, PW, GRID_H + 1);
        ctx.clip();

        // Column backgrounds + vertical lines
        for (let d = 0; d < 7; d++) {
            const colX = gridLeft + d * COL_W;
            const isToday = (d + 1) === today;
            if (isToday) {
                ctx.fillStyle = 'rgba(91,155,213,0.04)';
                ctx.fillRect(colX, gridTop, COL_W, GRID_H);
            }
            ctx.strokeStyle = CAL_GRID_MINOR;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(colX, gridTop);
            ctx.lineTo(colX, gridTop + GRID_H);
            ctx.stroke();
        }

        // Horizontal hour lines + time labels
        const HOURS_VISIBLE = CAL_RANGE / 60;  // 16
        for (let h = 0; h <= HOURS_VISIBLE; h++) {
            const minute = CAL_START_MINUTE + h * 60;
            const y      = gridTop + (minute / CAL_RANGE) * GRID_H;

            ctx.strokeStyle = (h % 2 === 0) ? ink.rule : CAL_GRID_MINOR;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(gridLeft, y);
            ctx.lineTo(gridLeft + GRID_W, y);
            ctx.stroke();

            // Label every 2 hours, just under its line (the last line closes the grid)
            if (h % 2 === 0 && h < HOURS_VISIBLE) {
                const absHour = DAY_START_HOUR + h;
                const label   = this._formatHour(absHour);
                ctx.fillStyle    = ink.hint;
                ctx.textAlign    = 'right';
                ctx.textBaseline = 'top';
                drawText(ctx, label, gridLeft - 6, y + 3, 'small');
            }
        }

        // Commitment blocks
        const commitments = (game.commitments || []).filter(c => {
            if (c.recurring) return true;
            return c.week === this.viewWeek;  // one-off: only show on its week
        });

        for (const c of commitments) {
            if (c.dayOfWeek < 1 || c.dayOfWeek > 7) continue;
            if (c.startMinute < CAL_START_MINUTE || c.startMinute >= CAL_END_MINUTE) continue;

            const colX  = gridLeft + (c.dayOfWeek - 1) * COL_W;
            const blockY = gridTop + ((c.startMinute - CAL_START_MINUTE) / CAL_RANGE) * GRID_H;
            const blockH = Math.max(6, (c.duration / CAL_RANGE) * GRID_H);

            // Block fill
            ctx.fillStyle = c.color + 'cc';
            ctx.fillRect(colX + 2, blockY, COL_W - 4, blockH);

            // Block border
            ctx.strokeStyle = c.color;
            ctx.lineWidth   = 1;
            ctx.strokeRect(colX + 2, blockY, COL_W - 4, blockH);

            // Label: the course's code
            if (blockH >= TEXT_LINE - 2) {
                const tx = colX + 4;
                ctx.save();
                ctx.beginPath();
                ctx.rect(colX + 2, blockY, COL_W - 4, blockH);
                ctx.clip();
                ctx.fillStyle    = ink.text;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'top';
                drawText(ctx, fitText(courseCode(c.label), colX + COL_W - 6 - tx, 'small'), tx, blockY + 2, 'small');
                ctx.restore();
            }
        }

        ctx.restore(); // end grid clip

        // ── Footer ───────────────────────────────────────────────────────────
        const footerY = py + PH - FOOTER_H;
        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 8, footerY);
        ctx.lineTo(px + PW - 8, footerY);
        ctx.stroke();

        ctx.fillStyle    = ink.hint;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, '← → week   F / Esc close', px + PW / 2, footerY + FOOTER_H / 2, 'body');

        ctx.restore();
    }

    _formatHour(h24) {
        const ampm = h24 < 12 ? 'am' : 'pm';
        const h    = h24 % 12 || 12;
        return `${h}${ampm}`;
    }
}
