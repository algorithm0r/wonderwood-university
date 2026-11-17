// RegistrationSystem
// Handles the Registration Office interaction:
//   - Proximity prompt at registration-desk station
//   - Course selection panel (↑↓ navigate, E enroll, Esc close)
//   - On enroll: deducts money, adds commitment, generates ScheduledEvents
//
// Active during registration window (week 1, or break week per Quarter).
// Sets game.activePanel = 'registration' while panel is visible.

class RegistrationSystem {
    constructor() {
        this.open          = false;
        this.selectedIndex = 0;
        this.keys          = new KeyEdge();
    }

    update(deltaTime, game) {
        if (!game.ctx) return;
        if (game.paused) return;
        if (game.activePanel === 'scene') return;

        const player = game.player;
        if (!player) return;

        const desk = game.stationMap && game.stationMap['registration-terminal'];
        if (!desk) return;

        // ── Key state ────────────────────────────────────────────────────────
        const eTap   = this.keys.tap('e',         game.keys);
        const escTap = this.keys.tap('Escape',     game.keys);
        const upTap  = this.keys.tap('ArrowUp',   game.keys) || this.keys.tap('w', game.keys);
        const dwnTap = this.keys.tap('ArrowDown',  game.keys) || this.keys.tap('s', game.keys);

        // ── Reach: E opens the desk while it is E's target (interactTarget); an open panel
        // stays until the player walks off (LEAVE_RADIUS) ──────────────────────
        const cx = player.position.x + player.drawWidth / 2, cy = player.position.y + player.drawHeight / 2;
        const near = this.open ? getDistance({ x: cx, y: cy }, desk) < params.LEAVE_RADIUS
                               : !!game.interactTarget && game.interactTarget.station === desk;

        // ── Registration window ──────────────────────────────────────────────
        const inWindow = !game.clock || !game.quarter ||
                         game.quarter.isRegistrationOpen(game.clock.week);

        const courses = game.availableCourses || [];

        // ── Panel open ───────────────────────────────────────────────────────
        if (this.open) {
            // Close if player walks away, presses Esc, or week has passed
            if (!near || escTap || !inWindow) {
                this._close(game);
            } else {
                if (upTap)  this.selectedIndex = (this.selectedIndex - 1 + courses.length) % Math.max(1, courses.length);
                if (dwnTap) this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, courses.length);
                if (eTap)   this._tryEnroll(game, player, courses[this.selectedIndex]);
            }

            game.activePanel = 'registration';
            this._drawPanel(game, player, courses);
            return;
        }

        // ── Panel closed ─────────────────────────────────────────────────────
        // Only clear activePanel if we own it — don't clobber other panels.
        if (game.activePanel === 'registration') game.activePanel = null;
        if (game.activePanel) return;

        if (near && inWindow) {
            if (eTap) {
                this.open          = true;
                this.selectedIndex = 0;
                game.activePanel = 'registration';
            } else {
                this._drawPrompt(game, desk, inWindow);
            }
        }
    }

    // ── Enrollment ───────────────────────────────────────────────────────────

    _tryEnroll(game, player, course) {
        if (!course) return;
        if (!game.notifications) game.notifications = [];
        if (!game.commitments)   game.commitments   = [];

        if (game.commitments.some(c => c.courseId === course.id)) {
            game.notifications.unshift({ message: `Already enrolled: ${course.label}`, timer: 3 });
            return;
        }

        const agent = player.agent;
        if (agent.money < course.cost) {
            game.notifications.unshift({ message: `Not enough funds (need $${course.cost})`, timer: 3 });
            return;
        }

        // Build Commitment objects and check for conflicts
        const newCommitments = this._buildCommitments(course);
        for (const nc of newCommitments) {
            for (const existing of game.commitments) {
                if (nc.conflictsWith(existing)) {
                    game.notifications.unshift({
                        message: `Conflict: ${nc.label} overlaps ${existing.label}`,
                        timer: 4,
                    });
                    return;
                }
            }
        }

        agent.money -= course.cost;
        for (const c of newCommitments) game.commitments.push(c);
        this._generateEvents(game, player, course);
        game.notifications.unshift({ message: `Enrolled in ${course.label}`, timer: 5 });
    }

    _buildCommitments(course) {
        return course.sessions.map((s, i) => new Commitment({
            id:          `${course.id}-s${i}`,
            label:       course.label,
            type:        s.type === 'exam' ? 'exam' : 'class',
            location:    course.location,
            dayOfWeek:   s.dayOfWeek,
            startMinute: s.startMinute,
            duration:    s.duration || 50,
            recurring:   true,
            reward:      { text: course.rewardText },
            penalty:     null,
            courseId:    course.id,
        }));
    }

    _generateEvents(game, player, course) {
        if (!game.scheduledEvents) game.scheduledEvents = [];

        for (const session of course.sessions) {
            if (session.type === 'exam') {
                game.scheduledEvents.push({
                    label:         `${course.label} — Exam`,
                    dayOfWeek:     session.dayOfWeek,
                    startMinute:   session.startMinute,
                    recurring:     true,
                    lastFiredWeek: 0,
                    action:        'spawn-project',
                    payload: (g) => {
                        const p = g.player;
                        if (!p) return null;
                        return course.examFactory(p.agent.name, g.clock.week);
                    },
                });
            } else {
                const dayLabel  = DAY_NAMES[(session.dayOfWeek - 1) % 7];
                game.scheduledEvents.push({
                    label:               `${course.label} — ${dayLabel}`,
                    classLabel:          course.label,
                    dayOfWeek:           session.dayOfWeek,
                    startMinute:         session.startMinute,
                    duration:            session.duration,
                    location:            course.location,
                    domainSkill:         course.domainSkill,
                    attendanceThreshold: course.attendanceThreshold,
                    recurring:           true,
                    lastFiredWeek:       0,
                    action:              'start-class',
                    payload: (g) => {
                        const p = g.player;
                        if (!p) return null;
                        return course.assignmentFactory(p.agent.name, g.clock.week, session.sessionDay);
                    },
                });
            }
        }
    }

    _hasConflict(game, course) {
        const newCommitments = this._buildCommitments(course);
        for (const nc of newCommitments) {
            for (const existing of (game.commitments || [])) {
                if (nc.conflictsWith(existing)) return true;
            }
        }
        return false;
    }

    _close(game) {
        this.open        = false;
        game.activePanel = null;
        if (game.storyFlags) game.storyFlags.registrationExited = true;
    }

    // ── Drawing ──────────────────────────────────────────────────────────────

    // Open in the plank's ink, closed in its dim
    _drawPrompt(game, desk, inWindow) {
        drawPromptSign(game, inWindow ? 'E: Registration Office' : 'Registration Closed',
                       inWindow ? PANEL_LOOKS.sign.ink.text : PANEL_LOOKS.sign.ink.dim);
    }

    _drawPanel(game, player, courses) {
        const ctx = game.ctx;
        const cw  = ctx.canvas.width;
        const ch  = ctx.canvas.height;

        const panelW  = 560;
        const rowH    = 3 * TEXT_LINE + 20;   // name, instructor and times, rewards
        const headerH = 64;
        const footerH = 44;
        const panelH  = headerH + courses.length * rowH + footerH;
        const px      = Math.round((cw - panelW) / 2);
        const py      = Math.round((ch - panelH) / 2);

        ctx.save();

        drawPanel(ctx, 'window', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.window.ink;

        // Header
        ctx.fillStyle    = onPaper('#f5c842');
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, 'Registration Office', px + panelW / 2, py + 22, 'title');

        ctx.fillStyle = ink.dim;
        drawText(ctx, `Available funds: $${player.agent.money}`, px + panelW / 2, py + 46, 'text');

        // Divider
        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + headerH);
        ctx.lineTo(px + panelW - 16, py + headerH);
        ctx.stroke();

        // Course rows
        for (let i = 0; i < courses.length; i++) {
            const course   = courses[i];
            const rowY     = py + headerH + i * rowH;
            const selected = i === this.selectedIndex;
            const enrolled = game.commitments && game.commitments.some(c => c.courseId === course.id);
            const canAfford = player.agent.money >= course.cost;

            if (selected) {
                ctx.fillStyle = 'rgba(245,200,66,0.10)';
                ctx.fillRect(px + 6, rowY + 4, panelW - 12, rowH - 8);
            }

            // The department's icon, then the course name
            const textX = px + 16 + ICON_SIZE + 12;
            if (SKILL_ICONS[course.domainSkill]) drawIcon(ctx, SKILL_ICONS[course.domainSkill], px + 16, rowY + 10);
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = enrolled ? onPaper('#81c784') : (selected ? onPaper('#f5c842') : ink.text);
            drawText(ctx, course.label, textX, rowY + 20, 'largeBold');

            // Schedule + rewards
            ctx.fillStyle = ink.faint;
            const instrLabel = course.instructor ? `${course.instructor}  \u00b7  ` : '';
            drawText(ctx, `${instrLabel}${course.scheduleText}`, textX, rowY + 20 + TEXT_LINE, 'body');
            ctx.fillStyle = ink.hint;
            drawText(ctx, course.rewardText, textX, rowY + 20 + 2 * TEXT_LINE, 'body');

            // Cost / status / conflict (right side)
            const hasConflict = !enrolled && this._hasConflict(game, course);
            ctx.textAlign = 'right';
            if (enrolled) {
                ctx.fillStyle = onPaper('#81c784');
                drawText(ctx, '✓ Enrolled', px + panelW - 20, rowY + 20, 'largeBold');
            } else if (hasConflict) {
                ctx.fillStyle = onPaper('#e05555');
                drawText(ctx, '⚠ Conflict', px + panelW - 20, rowY + 20, 'largeBold');
            } else {
                ctx.fillStyle = onPaper(canAfford ? '#f5c842' : '#c0392b');
                drawText(ctx, `$${course.cost}`, px + panelW - 20, rowY + 20, 'largeBold');
            }
        }

        if (courses.length === 0) {
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = ink.hint;
            drawText(ctx, 'No courses available', px + panelW / 2, py + headerH + 30, 'large');
        }

        // Footer
        const footerY = py + headerH + courses.length * rowH;
        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 16, footerY + 6);
        ctx.lineTo(px + panelW - 16, footerY + 6);
        ctx.stroke();

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = ink.hint;
        drawText(ctx, '↑↓ select   E enroll   F calendar   Esc close', px + panelW / 2, footerY + 26, 'body');

        ctx.restore();
    }

}
