// NPCSystem — goal-directed movement with BFS pathfinding
// NPCs with home + work navigate on a daily schedule, and each day starts where the schedule
// puts them (placeOnSchedule). NPCs without home/work fall back to random wander.

const NPC_ARRIVE_DIST = 40;   // px — how close counts as "arrived at waypoint"
const SPEECH_RADIUS   = 220;  // px — max distance to show ambient speech bubble

class NPCSystem {
    update(deltaTime, game) {
        if (!game.clock || !game.currentLevel) return;
        const minute = game.clock.gameMinute;

        // A new day (the first included): every scheduled NPC starts where its schedule has it now
        const day = game.clock.week * 7 + game.clock.day;
        if (this.day !== day) {
            this.day = day;
            for (const e of game.entities) if (e.npc && e.npc.home && e.npc.work) placeOnSchedule(game, e, minute);
        }

        const player = game.player;

        for (let entity of game.entities) {
            if (!entity.npc || !entity.velocity || !entity.facing) continue;
            const npc = entity.npc;

            if (npc.escort) {
                this.updateEscort(entity, npc, game);
            } else if (npc.home && npc.work) {
                this.updateScheduled(entity, npc, minute, game);
            } else {
                this.updateWander(deltaTime, entity, npc);
            }

            // Speech bubble flag — read by RenderSystem
            npc.showSpeech = false;
            if (player && npc.speechText) {
                const dx = (entity.position.x + 24) - (player.position.x + 24);
                const dy = (entity.position.y + 24) - (player.position.y + 24);
                if (dx * dx + dy * dy < SPEECH_RADIUS * SPEECH_RADIUS) {
                    npc.showSpeech = true;
                }
            }
        }
    }

    // An escort walks at the player's pace and holds at its target until the scene clears it
    updateEscort(entity, npc, game) {
        const target  = npc.escort;
        const goalKey = `${target.x},${target.y}`;

        if (npc.lastTarget !== goalKey) {
            const cx   = entity.position.x + 24;
            const cy   = entity.position.y + 24;
            const path = findPath(game.walkable, game.currentLevel.tileSize, cx, cy, target.x, target.y);
            npc.path       = path || [];
            npc.pathIndex  = 0;
            npc.lastTarget = goalKey;
            npc.state      = 'escorting';
        }

        if (npc.pathIndex < npc.path.length) {
            this.followPath(entity, npc, game.player.playercontrolled.speed);
        } else {
            npc.state          = 'escort-waiting';
            entity.velocity.dx = 0;
            entity.velocity.dy = 0;
        }
    }

    updateScheduled(entity, npc, minute, game) {
        // Set out early by the length of the walk, so the NPC arrives as work starts
        const shouldWork  = minute >= npc.workHours.arrive - npc.commute && minute < npc.workHours.depart;
        // A gig running now takes the work spot (npc.gig: read by AnimationSystem for its pose)
        npc.gig = shouldWork && npc.gigs &&
            npc.gigs.find(g => g.day === game.clock.day && minute >= g.from && minute < g.to) || null;
        const targetState = shouldWork ? 'at-work'     : 'at-home';
        const movingState = shouldWork ? 'going-work'  : 'going-home';
        const targetPos   = shouldWork ? (npc.gig ? npc.gig.at : npc.work) : npc.home;
        const goalKey     = `${targetPos.x},${targetPos.y}`;

        // Already at destination (the state, and the spot: a gig moves an NPC already at work)
        if (npc.state === targetState && npc.at === goalKey) {
            entity.velocity.dx = 0;
            entity.velocity.dy = 0;
            return;
        }

        // Need to move — compute path if not already heading there
        if (npc.state !== movingState || npc.path.length === 0) {
            if (npc.lastTarget !== goalKey) {
                const cx   = entity.position.x + 24;
                const cy   = entity.position.y + 24;
                const path = findPath(game.walkable, game.currentLevel.tileSize, cx, cy,
                                      targetPos.x + 32, targetPos.y + 32);
                npc.path       = path || [];
                npc.pathIndex  = 0;
                npc.lastTarget = goalKey;
            }
            npc.state = movingState;
        }

        // Follow path
        if (npc.path.length > 0 && npc.pathIndex < npc.path.length) {
            this.followPath(entity, npc);
        } else {
            // Arrived (or no path found — snap to destination state)
            npc.state      = targetState;
            npc.at         = goalKey;
            npc.path       = [];
            npc.lastTarget = null;
            entity.velocity.dx = 0;
            entity.velocity.dy = 0;
        }
    }

    followPath(entity, npc, speed = npc.speed) {
        const wp   = npc.path[npc.pathIndex];
        const cx   = entity.position.x + 24;
        const cy   = entity.position.y + 24;
        const dx   = wp.x - cx;
        const dy   = wp.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < NPC_ARRIVE_DIST) {
            npc.pathIndex++;
            if (npc.pathIndex >= npc.path.length) {
                entity.velocity.dx = 0;
                entity.velocity.dy = 0;
            }
            return;
        }

        entity.velocity.dx = (dx / dist) * speed;
        entity.velocity.dy = (dy / dist) * speed;

        if (Math.abs(dx) >= Math.abs(dy)) {
            entity.facing.direction = dx > 0 ? 'right' : 'left';
        } else {
            entity.facing.direction = dy > 0 ? 'down' : 'up';
        }
    }

    updateWander(deltaTime, entity, npc) {
        npc.wanderTimer -= deltaTime;
        if (npc.wanderTimer <= 0) {
            const choices = ['up', 'down', 'left', 'right', 'idle', 'idle'];
            const choice  = choices[Math.floor(Math.random() * choices.length)];
            const speed   = npc.speed;

            entity.velocity.dx = 0;
            entity.velocity.dy = 0;

            if (choice === 'up')    { entity.velocity.dy = -speed; entity.facing.direction = 'up'; }
            if (choice === 'down')  { entity.velocity.dy =  speed; entity.facing.direction = 'down'; }
            if (choice === 'left')  { entity.velocity.dx = -speed; entity.facing.direction = 'left'; }
            if (choice === 'right') { entity.velocity.dx =  speed; entity.facing.direction = 'right'; }

            npc.wanderTimer = 1 + Math.random() * 2;
        }
    }
}

// Game-minutes an NPC takes to walk from home to work: the path's length at its speed
function commuteMinutes(game, npc) {
    const ts   = game.currentLevel.tileSize;
    const path = findPath(game.walkable, ts, npc.home.x + ts / 2, npc.home.y + ts / 2,
                          npc.work.x + ts / 2, npc.work.y + ts / 2);
    return path ? path.length * ts / npc.speed * params.MINUTES_PER_SECOND : 0;
}

// Put a scheduled NPC where its schedule has it at `minute`, in the state updateScheduled expects:
// it sets out for work `commute` minutes before it's due and for home when it departs, so between
// those it's partway along the walk (one set out before the day began is already on the road)
// and walks on from there; otherwise it's at work or at home
function placeOnSchedule(game, entity, minute) {
    const npc = entity.npc, ts = game.currentLevel.tileSize;
    if (npc.commute === null) npc.commute = commuteMinutes(game, npc);
    const { arrive, depart } = npc.workHours;
    const working = minute >= arrive - npc.commute && minute < depart;
    const [from, to]  = working ? [npc.home, npc.work] : [npc.work, npc.home];
    const walked      = minute - (working ? arrive - npc.commute : depart);
    const path        = findPath(game.walkable, ts, from.x + ts / 2, from.y + ts / 2, to.x + ts / 2, to.y + ts / 2) || [];
    const along       = walked / params.MINUTES_PER_SECOND * npc.speed / ts;   // cells walked

    npc.path = [];
    npc.lastTarget = null;
    if (walked < 0 || along >= path.length) {
        // Not on the road: at the end of the last walk
        npc.state = working ? 'at-work' : 'at-home';
        entity.position.x = to.x;
        entity.position.y = to.y;
        return;
    }
    // Between waypoint i - 1 (the start cell for i = 0) and waypoint i, heading for i
    const pts = [{ x: from.x + ts / 2, y: from.y + ts / 2 }, ...path];
    const i = Math.floor(along), f = along - i;
    npc.state      = working ? 'going-work' : 'going-home';
    npc.path       = path;
    npc.pathIndex  = i;
    npc.lastTarget = `${to.x},${to.y}`;
    entity.position.x = pts[i].x + (pts[i + 1].x - pts[i].x) * f - 24;
    entity.position.y = pts[i].y + (pts[i + 1].y - pts[i].y) * f - 24;
}
