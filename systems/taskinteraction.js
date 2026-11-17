// TaskInteractionSystem
// Handles: station proximity, task selection menu (Tab / 1-9),
//          chunk-based quality accumulation, skill checks per chunk

class TaskInteractionSystem {
    constructor() {
        this.keys       = new KeyEdge();
        this.prevDigits = new Set();
    }

    update(deltaTime, game) {
        if (!game.projects || !game.clock) return;
        if (game.paused) return;

        const clockDelta     = deltaTime * MINUTES_PER_SECOND;
        const eJustPressed   = this.keys.tap('e',   game.keys);
        const eIsDown        = this.keys.held('e',  game.keys);
        const tabJustPressed = this.keys.tap('Tab', game.keys);

        const currentDigits  = new Set();
        for (const d of '123456789') {
            if (game.keys[d]) currentDigits.add(parseInt(d, 10));
        }
        const justPressedDigits = [...currentDigits].filter(d => !this.prevDigits.has(d));
        this.prevDigits = currentDigits;

        game.interactionPrompt = null;
        const playerNear = game.player ? this.stationsInReach(game, game.player) : null;
        game.interactTarget = interactTarget(game, playerNear);

        // ── 1. Auto-advance all running triggered tasks ───────────────────────
        for (let project of game.projects) {
            for (let task of project.tasks) {
                if (task.mode !== 'triggered' || !task.running) continue;

                // Auto-stop when chunk quota reached or quality maxed
                if (task.chunksRun >= task.chunks || task.quality >= task.maxQuality) {
                    task.running = false;
                    continue;
                }

                task.chunkProgress += clockDelta;
                if (task.chunkProgress >= CHUNK_DURATION) {
                    task.chunkProgress = 0;
                    task.chunksRun++;

                    const entity = task._runner;
                    if (entity) {
                        this.resolveChunk(game, entity, task, project);
                    } else {
                        // No entity reference — auto-succeed
                        task.quality = Math.min(task.maxQuality, task.quality + task.chunkQuality);
                    }

                    // Notify on completion
                    if (task.chunksRun >= task.chunks || task.quality >= task.maxQuality) {
                        task.running = false;
                        this.pushNotification(game, `✓ ${task.label} — ${task.getGrade()}`);
                    }
                }
            }
        }

        // ── 2. Proximity detection + interaction per entity ───────────────────
        for (let entity of game.entities) {
            if (!entity.position || !entity.agent || !entity.skills) continue;
            const isPlayer = !!entity.playercontrolled;
            entity.workingAt = this.runningAt(game, entity);

            const nearestData = isPlayer ? playerNear : this.stationsInReach(game, entity);
            if (!nearestData) {
                if (isPlayer) game.stationMenu = null;
                continue;
            }
            const { station, entries: choices } = nearestData;

            // The player's menu, prompt and E are for this station only while it is E's target;
            // a passive task (attending) runs on regardless
            const aimed = !isPlayer || (game.interactTarget && game.interactTarget.station === station);
            if (isPlayer && !aimed) game.stationMenu = null;

            // ── Player-only: manage selection menu ────────────────────────────
            if (isPlayer && aimed) {
                if (choices.length > 1) {
                    if (!game.stationMenu || game.stationMenu.stationId !== station.id) {
                        game.stationMenu = { stationId: station.id, choices, selectedIdx: 0 };
                    } else {
                        game.stationMenu.choices = choices;
                        if (game.stationMenu.selectedIdx >= choices.length) {
                            game.stationMenu.selectedIdx = 0;
                        }
                    }

                    if (tabJustPressed) {
                        game.stationMenu.selectedIdx =
                            (game.stationMenu.selectedIdx + 1) % choices.length;
                    }

                    for (const d of justPressedDigits) {
                        const idx = d - 1;
                        if (idx >= 0 && idx < choices.length) {
                            game.stationMenu.selectedIdx = idx;
                            const c = choices[idx];
                            if (c.task.mode === 'triggered' &&
                                !c.task.running &&
                                c.task.chunksRun < c.task.chunks) {
                                this.startTriggeredTask(game, entity, c.task);
                            }
                        }
                    }
                } else {
                    game.stationMenu = null;
                }

                const selectedIdx = (game.stationMenu && game.stationMenu.stationId === station.id)
                    ? game.stationMenu.selectedIdx : 0;
                const sel = choices[selectedIdx];
                game.interactionPrompt = {
                    task:    sel.task,
                    project: sel.project,
                    station,
                    x:       groundPoint(entity).x,    // over the figure as drawn, seated or standing
                    headY:   headTop(entity),
                };
            }

            // ── Determine which task to work ──────────────────────────────────
            let workChoice;
            if (isPlayer && aimed && game.stationMenu && game.stationMenu.stationId === station.id) {
                workChoice = choices[game.stationMenu.selectedIdx];
            } else {
                workChoice = choices[0];
            }
            if (!workChoice) continue;

            const { task, project } = workChoice;

            // Determine whether to work this frame
            let working = false;
            if (task.mode === 'triggered' || task.mode === 'submit') {
                working = isPlayer && aimed ? eJustPressed : false;
            } else if (task.mode === 'passive') {
                working = true;
            } else {
                working = isPlayer && aimed ? eIsDown : false;
            }
            if (!working) continue;
            entity.workingAt = station;

            // ── Execute ───────────────────────────────────────────────────────
            if (task.mode === 'triggered') {
                if (!task.running && task.chunksRun < task.chunks) {
                    this.startTriggeredTask(game, entity, task);
                }
                continue;
            }

            if (task.mode === 'submit') {
                if (!task.submitted) {
                    this.resolveChunk(game, entity, task, project);
                }
                continue;
            }

            // Active / passive — advance chunk progress
            const before = task.chunkProgress;
            task.chunkProgress += clockDelta;

            if (task.chunkProgress >= CHUNK_DURATION && before < CHUNK_DURATION) {
                task.chunkProgress = 0;
                this.resolveChunk(game, entity, task, project);
            }
        }
    }

    // The nearest station in an entity's reach with tasks it can work now, and those tasks:
    // { station, dist, entries: [{ task, project }] }, or null
    stationsInReach(game, entity) {
        const cx = entity.position.x + (entity.drawWidth  || 48) / 2;
        const cy = entity.position.y + (entity.drawHeight || 48) / 2;
        const byStation = new Map();
        for (let project of game.projects) {
            if (project.isComplete()) continue;
            for (let task of project.getWorkableTasks()) {
                if (task.mode === 'triggered' && task.running) continue;
                if (task.requiredSkills.some(req => entity.skills.get(req.skill) < req.level)) continue;
                const candidates = task.stationType
                    ? Object.values(game.stationMap).filter(s => s.type === task.stationType)
                    : task.stationId && game.stationMap[task.stationId]
                        ? [game.stationMap[task.stationId]]
                        : [];
                for (const station of candidates) {
                    const dist = getDistance({ x: cx, y: cy }, station);
                    if (dist >= params.INTERACT_RADIUS) continue;
                    if (!byStation.has(station.id)) byStation.set(station.id, { station, dist, entries: [] });
                    byStation.get(station.id).entries.push({ task, project });
                }
            }
        }
        let nearest = null;
        for (const data of byStation.values()) if (!nearest || data.dist < nearest.dist) nearest = data;
        return nearest;
    }

    // The station an entity's running triggered task is worked at, if it is still within reach of
    // it (it can walk off; the task runs on), else null. With the per-frame `working` above, this
    // sets entity.workingAt, which only this system writes: the station an entity works at now
    runningAt(game, entity) {
        const cx = entity.position.x + (entity.drawWidth  || 48) / 2;
        const cy = entity.position.y + (entity.drawHeight || 48) / 2;
        for (const project of game.projects) for (const task of project.tasks) {
            if (!task.running || task._runner !== entity) continue;
            const station = Object.values(game.stationMap).find(s =>
                (task.stationId ? s.id === task.stationId : s.type === task.stationType) &&
                getDistance({ x: cx, y: cy }, s) < params.INTERACT_RADIUS);
            if (station) return station;
        }
        return null;
    }

    // ── Chunk probability functions ───────────────────────────────────────────

    chunkProbabilities(skillLevel, difficulty) {
        const gap = skillLevel - difficulty;   // both 0–1000, no conversion needed
        const x   = gap / 100;                 // in "levels" for the weight functions

        const wCritFail    = Math.max(0, -x - 0.5) ** 1.5;
        const wFail        = Math.max(0, 0.2 - x * 0.4);
        const wSuccess     = 1.0;
        const wCritSuccess = Math.max(0, x + 0.3) ** 1.3 * 0.7;

        const total = wCritFail + wFail + wSuccess + wCritSuccess;
        return {
            critFail:    wCritFail    / total,
            fail:        wFail        / total,
            success:     wSuccess     / total,
            critSuccess: wCritSuccess / total,
        };
    }

    rollChunk(skillLevel, difficulty) {
        const p = this.chunkProbabilities(skillLevel, difficulty);
        const r = Math.random();
        if (r < p.critFail)                      return 'critFail';
        if (r < p.critFail + p.fail)             return 'fail';
        if (r < p.critFail + p.fail + p.success) return 'success';
        return 'critSuccess';
    }

    // ── Chunk resolution ──────────────────────────────────────────────────────

    resolveChunk(game, entity, task, project) {
        // Submit task — close the project
        if (task.mode === 'submit') {
            task.submitted  = true;
            project.submitted = true;
            this.handleProjectSubmit(game, project, entity);
            return;
        }

        // Quality accumulation via skill check
        const outcome = task.methodSkill
            ? this.rollChunk(entity.skills.get(task.methodSkill), task.difficulty)
            : 'success';   // no method skill = auto-success (passive, etc.)

        const multipliers = { critFail: 0, fail: 0.5, success: 1.0, critSuccess: 1.5 };
        const rawGain     = task.chunkQuality * multipliers[outcome];

        const oldQuality  = task.quality;
        task.quality      = Math.min(task.maxQuality, task.quality + rawGain);
        const actualGain  = task.quality - oldQuality;

        // Skill rewards — proportional to quality gained vs one full A chunk
        if (actualGain > 0 && task.skillRewards.length > 0 && entity.skills) {
            const rewardFraction = actualGain / task.qualityTarget;
            const parts = [];

            for (const reward of task.skillRewards) {
                const amount = reward.amount * rewardFraction;
                const prev   = entity.skills.get(reward.skill);
                entity.skills.add(reward.skill, amount);
                const next   = entity.skills.get(reward.skill);

                parts.push(`+${reward.skill} ${Math.round(amount * 10) / 10}`);

                if (entity.playercontrolled && game.dayStats) {
                    game.dayStats.skillsGained[reward.skill] =
                        (game.dayStats.skillsGained[reward.skill] || 0) + amount;
                }

                if (Math.floor(next / 100) > Math.floor(prev / 100)) {
                    this.pushNotification(game,
                        `${reward.skill} — level ${Math.floor(next / 100)}!`);
                }
            }

            if (!task.contributors.includes(entity.agent.name)) {
                task.contributors.push(entity.agent.name);
            }
        }

        // Notify unlock of newly available tasks
        if (oldQuality < task.unlockThreshold && task.quality >= task.unlockThreshold) {
            const unlocked = project.tasks.filter(t => t.dependsOn.includes(task.id));
            for (const next of unlocked) {
                this.pushNotification(game, `Unlocked: ${next.label}`);
            }
        }

        // Grade notification
        const grade = task.getGrade();
        const icon  = outcome === 'critSuccess' ? '★'
                    : outcome === 'critFail'    ? '✗'
                    : '';
        const msg   = icon
            ? `${icon} ${task.label} — ${grade}`
            : `${task.label} — ${grade}`;
        this.pushNotification(game, msg);

        if (task.quality >= task.maxQuality) {
            this.pushNotification(game, `${task.label} — maxed`);
        }
    }

    // ── Project submission ────────────────────────────────────────────────────

    handleProjectSubmit(game, project, entity) {
        if (project.rewarded) return;
        project.rewarded = true;

        const grade = this.getProjectGrade(project);

        if (game.dayStats && !project.isAttendance) {
            game.dayStats.projectsCompleted.push(`${project.label} (${grade})`);
        }

        const owner = game.entities.find(e => e.agent && e.agent.name === project.ownerName);
        if (owner) {
            const repGain = project.reputationReward * Project.repGainByStage(owner.agent.stage);
            owner.agent.reputation = Math.min(100, owner.agent.reputation + repGain);
            owner.agent.updateWellbeingState();
        }

        this.pushNotification(game, `✓ "${project.label}" submitted — ${grade}`);
    }

    getProjectGrade(project) {
        const tasks = project.tasks.filter(t => t.mode !== 'submit');
        if (tasks.length === 0) return '—';
        const total       = tasks.reduce((sum, t) => sum + t.quality,       0);
        const targetTotal = tasks.reduce((sum, t) => sum + t.qualityTarget, 0);
        if (targetTotal === 0) return '—';
        return gradeFromPct(total / targetTotal);
    }

    // ── Supporting methods ────────────────────────────────────────────────────

    startTriggeredTask(game, entity, task) {
        task.running  = true;
        task._runner  = entity;   // stored for auto-advance quality resolution
        if (!task.contributors.includes(entity.agent.name)) {
            task.contributors.push(entity.agent.name);
        }
        this.pushNotification(game, `▶ ${task.label} — started`);
    }

    pushNotification(game, message) {
        if (!game.notifications) game.notifications = [];
        game.notifications.unshift({ message, timer: 3.5 });
        if (game.notifications.length > 5) game.notifications.pop();
    }
}
