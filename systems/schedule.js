// ScheduleSystem - fires time-anchored events and spawns projects
//
// ScheduledEvent shapes:
//
// 'spawn-project' — immediately spawns a project when time arrives
// {
//   label, dayOfWeek, startMinute, recurring, lastFiredWeek,
//   action: 'spawn-project',
//   payload: (game) → Project
// }
//
// 'start-class' — spawns a passive attendance task; resolves at class end
// {
//   label, classLabel, dayOfWeek, startMinute, duration,
//   location,            // stationType for attendance (e.g. 'classroom-desk')
//   domainSkill,         // small lecture-presence XP skill (e.g. 'cs')
//   attendanceThreshold, // fraction of class needed for assignment (default 0.8)
//   recurring, lastFiredWeek,
//   action: 'start-class',
//   payload: (game) → Project   // the assignment project to spawn on attendance
// }

class ScheduleSystem {
    update(deltaTime, game) {
        if (!game.clock || !game.scheduledEvents) return;
        const clock = game.clock;

        // ── Fire scheduled events ────────────────────────────────────────────
        for (let event of game.scheduledEvents) {
            const alreadyFiredThisWeek = event.lastFiredWeek >= clock.week;
            if (alreadyFiredThisWeek) continue;

            const rightDay  = clock.day === event.dayOfWeek;
            const rightTime = clock.getGameMinute() >= event.startMinute;

            if (rightDay && rightTime) {
                event.lastFiredWeek = clock.week;
                this.fire(event, game);
            }
        }

        // ── Resolve pending class ends ───────────────────────────────────────
        if (game.pendingClassEnds) {
            for (let i = game.pendingClassEnds.length - 1; i >= 0; i--) {
                const check = game.pendingClassEnds[i];
                const timeUp = clock.week  >= check.week
                            && clock.day   === check.dayOfWeek
                            && clock.getGameMinute() >= check.endMinute;
                if (timeUp) {
                    this.resolveClassEnd(check, game);
                    game.pendingClassEnds.splice(i, 1);
                }
            }
        }
    }

    fire(event, game) {
        if (!game.notifications) game.notifications = [];

        if (event.action === 'spawn-project') {
            const project = event.payload(game);
            if (!project) return;

            const exists = game.projects.some(p => p.id === project.id);
            if (exists) return;

            game.projects.push(project);
            game.notifications.unshift({ message: `New: "${project.label}"`, timer: 5 });
        }

        if (event.action === 'start-class') {
            const player = game.player;
            if (!player) return;

            const attendId = `attend-${event.classLabel}-w${game.clock.week}-d${event.dayOfWeek}`;
            if (game.projects.some(p => p.id === attendId)) return;

            // Passive attendance task — quality accumulates while seated at a desk
            const attendChunks = Math.max(1, Math.round(event.duration / CHUNK_DURATION));
            const attendTask = new Task(`${attendId}-t1`, `Attend ${event.classLabel}`, null, {
                stationType:     event.location,
                methodSkill:     null,
                difficulty:      100,
                skillRewards:    [{ skill: event.domainSkill, amount: 3 }],
                qualityTarget:   attendChunks * 100,
                chunks:          attendChunks,
                unlockThreshold: 0,
                mode:            'passive',
            });

            const attendProj = new Project(
                attendId,
                `In Class: ${event.classLabel}`,
                [attendTask], null,
                { type: 'attendance', label: 'Class Session' },
                player.agent.name, 0
            );
            attendProj.isAttendance = true;

            game.projects.push(attendProj);

            // Record end-of-class check
            game.pendingClassEnds.push({
                dayOfWeek:           event.dayOfWeek,
                endMinute:           event.startMinute + event.duration,
                week:                game.clock.week,
                attendanceProjectId: attendId,
                threshold:           event.attendanceThreshold || 0.8,
                projectFactory:      event.payload,
                classLabel:          event.classLabel,
            });

            game.notifications.unshift({
                message: `${event.classLabel} — class starting`,
                timer: 4
            });
        }
    }

    resolveClassEnd(check, game) {
        const proj = game.projects.find(p => p.id === check.attendanceProjectId);
        const task = proj ? proj.tasks[0] : null;
        const fraction = task ? (task.quality / task.qualityTarget) : 0;

        // Remove attendance project regardless of outcome
        game.projects = game.projects.filter(p => p.id !== check.attendanceProjectId);

        if (fraction >= check.threshold) {
            // Spawn the assignment
            const assignment = check.projectFactory(game);
            if (assignment && !game.projects.some(p => p.id === assignment.id)) {
                game.projects.push(assignment);
                game.notifications.unshift({
                    message: `Attended ${check.classLabel} — assignment ready`,
                    timer: 5
                });
            }
        } else {
            const pct = Math.round(fraction * 100);
            game.notifications.unshift({
                message: `Missed ${check.classLabel} (${pct}% attended) — no assignment`,
                timer: 5
            });
        }
    }
}
