// AnimationSystem — picks each character's state (charState) and steps its frames. A state the
// character has no sheet for falls back (params.CHAR_STATES); falling back to walk shows walk
// frame 0, standing. Outdoors, a character dressed for the look draws from that look's set
// (charSheets: a coat in winter), and a state falls back inside the set, so the coat never
// flickers off. Walking takes its row from velocity; other 8-row states keep the facing.
// It keeps the one animation clock, game.animTime (its only writer; it stops while the game is
// paused), and steps the looping props (game.loopingProps) on it, each from its phase. Animated
// tiles and icons read the same clock where they draw
class AnimationSystem {
    constructor() {
        this.time = 0;
    }

    update(deltaTime, game) {
        this.time += deltaTime;
        game.animTime = this.time;
        for (const prop of game.loopingProps) {
            const { frames, fps, phase } = prop.loop;
            prop.sprite.frameX = (Math.floor(this.time * fps + phase) % frames) * prop.sprite.frameWidth;
        }

        const look = lookOf(game);
        for (const entity of game.entities) {
            const { animator, sprite, velocity } = entity;
            if (!animator || !sprite || !velocity) continue;
            const sheets = charSheets(entity, look, game);

            const wanted = charState(entity, game);
            const seat   = SEATED_STATES.includes(wanted) && game.seats.get(workCell(entity)) || null;
            animator.seat = seat || null;
            animator.stand = wanted === 'perform' && game.stands.get(workCell(entity)) || null;
            let state = wanted;
            while (!sheets[state]) state = params.CHAR_STATES[state].fallback;
            const fmt   = params.CHAR_STATES[state];
            const still = state === 'walk' && wanted !== 'walk';
            if (state !== animator.state) {
                animator.state = state;
                animator.frame = state === 'walk' ? 0 : animator.phase % fmt.frames;
                animator.frameTimer = 0;
            }

            if (state === 'walk' && !still) animator.row = dirIndex8(velocity.dx, velocity.dy);
            if (state === 'talk') {
                const other = talkPartner(entity, game);
                if (other) animator.row = dirIndex8(other.position.x - entity.position.x,
                                                    other.position.y - entity.position.y);
            }
            if (still) {
                animator.frame = 0;
                animator.frameTimer = 0;
            } else {
                animator.frameTimer += deltaTime;
                while (animator.frameTimer >= 1 / fmt.fps) {
                    animator.frameTimer -= 1 / fmt.fps;
                    animator.frame = (animator.frame + 1) % fmt.frames;
                }
            }

            sprite.image  = sheets[state];
            sprite.frameX = animator.frame * sprite.frameWidth;
            sprite.frameY = (fmt.rows === 1 ? 0 : animator.row) * sprite.frameHeight;
        }
    }
}

// The set of sheets a character draws from: outdoors (on no room's floor, as the rain tests), the
// first key of the look ([night, weather, season]) it's dressed for, so a snow day falls through
// to winter; indoors, or undressed for the look, its own
function charSheets(entity, look, game) {
    const { looks, sheets } = entity.animator, g = groundPoint(entity);
    const key = look.find(k => looks[k]);
    return key && !roomAt(game.rooms, g.x, g.y) ? looks[key] : sheets;
}

// Posture at work, by station type; a station not listed is worked standing
// The states drawn in a station's seat when it has one
const SEATED_STATES = ['sit', 'type', 'write'];

const STATION_POSES = {
    'computer-lab': 'type', 'office-desk': 'type', 'library-terminal': 'type',
    'classroom-desk': 'sit', 'cafe-seating': 'sit',
    'lab-bench': 'work', 'cafe-counter': 'work', 'bookstore-register': 'work', 'sandwich-counter': 'work',
};

// What a character is doing: walking if it moves; talking if it's in the open dialogue (an NPC's
// or a scene's: the speaker, and the player listening); working at a station (workStation);
// else idle. Sitting or typing at a station with a seat, it's drawn in the seat
function charState(entity, game) {
    const v = entity.velocity;
    if (v.dx !== 0 || v.dy !== 0) return 'walk';
    if (talkPartner(entity, game)) return 'talk';
    // At work: the NPC's own pose where its work has no station (npc.workPose: Nair's table, the
    // bench behind Webb), else its station's
    const npc = entity.npc;
    if (npc && npc.state === 'at-work' && npc.gig) return npc.gig.pose;
    if (npc && npc.state === 'at-work' && npc.workPose) return npc.workPose;
    const station = workStation(entity);
    if (station) return STATION_POSES[station.type] || 'idle';
    return 'idle';
}

// The cell a character works in now ("c,r"): its station's, or for an NPC at work, its work cell;
// else null. A seat whose base is in that cell is where it's drawn sitting (game.seats)
function workCell(entity) {
    const station = workStation(entity);
    if (station) return `${Math.floor(station.x / 64)},${Math.floor(station.y / 64)}`;
    const npc = entity.npc;
    const spot = npc && npc.state === 'at-work' && (npc.gig ? npc.gig.at : npc.work);
    if (spot) return `${Math.floor(spot.x / 64)},${Math.floor(spot.y / 64)}`;
    return null;
}

// The station a character works at now: entity.workingAt, or for an NPC at work, the station at
// its work cell; else null
function workStation(entity) {
    return entity.workingAt || (entity.npc && entity.npc.state === 'at-work' && !entity.npc.gig && entity.npc.workStation) || null;
}

// The other party to the open dialogue, for its speaker or the player; else null
function talkPartner(entity, game) {
    const scene   = game.activeScene;
    const speaker = game.npcDialogue ? game.npcDialogue.name
                  : scene && scene.index < scene.nodes.length ? scene.nodes[scene.index].speaker : null;
    if (!speaker) return null;
    if (entity === game.player) return game.entities.find(e => e.agent && e.agent.name === speaker) || null;
    return entity.agent && entity.agent.name === speaker ? game.player : null;
}
