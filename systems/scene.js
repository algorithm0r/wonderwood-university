// SceneSystem — manages scripted scene panels and narrative tutorial sequences.
//
// game.activeScene = { nodes, index, onDone? } | null
// game.activePanel = 'scene' while a scene is active.
//
// Node formats:
//   { speaker, color, line }
//   { speaker, color, line, choices: [{ label, key, action(game) }] }
//
// Narrative sequences are driven by PhaseRunner instances (see util.js).
// Each phase opens a scene via onEnter; the scene action sets a data flag;
// the phase condition polls that flag and advances when true.

class SceneSystem {
    constructor() {
        this.keys   = new KeyEdge();
        this.jordan = null;   // PhaseRunner — built on first tick
    }

    update(deltaTime, game) {
        if (!game.clock) return;

        // Build Jordan tutorial on first tick (entities are ready by then)
        if (!this.jordan) this.jordan = this._buildJordan();

        // Advance tutorial state — may open a new scene or set NPC escort
        this.jordan.update(game);

        if (!game.activeScene) return;

        const escTap = this.keys.tap('Escape', game.keys);
        const eTap   = this.keys.tap('e',      game.keys);
        const yTap   = this.keys.tap('y',      game.keys);
        const nTap   = this.keys.tap('n',      game.keys);

        const scene = game.activeScene;
        const node  = scene.nodes[scene.index];

        game.activePanel = 'scene';

        // Esc skips the current scene (does NOT end the tutorial runner)
        if (escTap) {
            if (scene.onDone) scene.onDone(game);
            game.activeScene = null;
            game.activePanel = null;
            return;
        }

        if (node.choices) {
            for (const choice of node.choices) {
                const k       = choice.key.toLowerCase();
                const pressed = (k === 'y' && yTap) || (k === 'n' && nTap) || (k === 'e' && eTap);
                if (pressed) {
                    if (choice.action) choice.action(game);
                    this._advance(game);
                    break;
                }
            }
        } else {
            if (eTap) this._advance(game);
        }

        this._draw(game);
    }

    _advance(game) {
        const scene = game.activeScene;
        if (!scene) return;
        scene.index++;
        if (scene.index >= scene.nodes.length) {
            if (scene.onDone) scene.onDone(game);
            game.activeScene = null;
            game.activePanel = null;
        }
    }

    // ── Jordan arrival tutorial ────────────────────────────────────────────

    _buildJordan() {
        const self      = this;
        const REG_TERM  = { x: 58 * 64 + 32, y: 56 * 64 + 32 };
        const DORM_DESK = { x: 48 * 64 + 32, y: 30 * 64 + 32 };
        const MEET      = { x: 47 * 64,      y: 26 * 64 };       // Jordan's spot beside the player's start
        // Jordan's escorts hold him at their target until released here
        const releaseJordan = game => {
            const jordan = _findNpc(game, 'Jordan Burman');
            if (jordan) jordan.npc.escort = null;
        };

        return new PhaseRunner([

            // 0 — greeting: Jordan asks about registration
            {
                id: 'greeting',
                onEnter(game, data) {
                    // Jordan steps off the schedule to meet the player, and walks on from there
                    const jordan = _findNpc(game, 'Jordan Burman');
                    if (jordan) {
                        jordan.position.x = MEET.x;
                        jordan.position.y = MEET.y;
                        Object.assign(jordan.npc, { state: 'idle', path: [], lastTarget: null });
                    }
                    game.activeScene = {
                        nodes: [{
                            speaker: 'Jordan Burman',
                            color:   '#a8d8a8',
                            line:    "Hey! You here for the new intake? I\u2019m heading to register \u2014 want to come?",
                            choices: [
                                {
                                    label: 'Yes', key: 'y',
                                    action(game) {
                                        if (jordan) {
                                            jordan.npc.escort     = { ...REG_TERM };
                                            jordan.npc.speechText = "Follow me \u2014 registration\u2019s this way.";
                                        }
                                        game.notifications.push({ message: 'Follow Jordan to Registration \u2192', timer: 8 });
                                        data.greetingDone = true;
                                    },
                                },
                                {
                                    label: 'No', key: 'n',
                                    action(game) {
                                        game.notifications.push({ message: 'Registration terminal is in the east academic wing.', timer: 6 });
                                        self.jordan.done = true;
                                    },
                                },
                            ],
                        }],
                        index: 0,
                    };
                },
                condition(game, data) { return !!data.greetingDone; },
            },

            // 1 — wait for player to visit and exit registration
            {
                id: 'to_registration',
                condition(game) { return !!game.storyFlags.registrationExited; },
            },

            // 2 — dorm prompt: Jordan asks about room key
            {
                id: 'dorm_prompt',
                onEnter(game, data) {
                    const jordan = _findNpc(game, 'Jordan Burman');
                    game.activeScene = {
                        nodes: [{
                            speaker: 'Jordan Burman',
                            color:   '#a8d8a8',
                            line:    "Nice \u2014 got your courses? I can show you where to pick up your room key if you want.",
                            choices: [
                                {
                                    label: 'Yes', key: 'y',
                                    action(game) {
                                        if (jordan) {
                                            jordan.npc.escort     = { ...DORM_DESK };
                                            jordan.npc.speechText = "Dorm desk’s back up the stairs.";
                                        }
                                        game.notifications.push({ message: 'Follow Jordan to the dorm desk \u2192', timer: 8 });
                                        data.dormPromptDone = true;
                                    },
                                },
                                {
                                    label: 'No', key: 'n',
                                    action(game) {
                                        game.notifications.push({ message: 'Pick up your room key at the dorm desk.', timer: 6 });
                                        releaseJordan(game);
                                        self.jordan.done = true;
                                    },
                                },
                            ],
                        }],
                        index: 0,
                    };
                },
                condition(game, data) { return !!data.dormPromptDone; },
            },

            // 3 — wait for player to reach the dorm desk
            {
                id: 'to_dorm',
                condition(game) {
                    if (!game.player) return false;
                    const p  = game.player;
                    const dx = (p.position.x + 24) - DORM_DESK.x;
                    const dy = (p.position.y + 24) - DORM_DESK.y;
                    return dx * dx + dy * dy < 80 * 80;
                },
            },

            // 4 — Casey hands over the room key
            {
                id: 'key_handoff',
                onEnter(game, data) {
                    game.activeScene = {
                        nodes: [
                            {
                                speaker: 'Casey Drummond',
                                color:   '#aed6f1',
                                line:    "Hey, welcome. I\u2019m Casey \u2014 I\u2019m on desk this morning. You\u2019re in the new intake?",
                            },
                            {
                                speaker: 'Casey Drummond',
                                color:   '#aed6f1',
                                line:    "Here\u2019s your key. Second floor, east hall. Come by the writing center if you need anything \u2014 it\u2019s open to everyone.",
                            },
                        ],
                        index: 0,
                        onDone(game) {
                            const p = game.player;
                            if (p && p.inventory) {
                                p.inventory.add(new Item('dorm-key', 'Dorm Key', 'key'));
                                game.notifications.push({ message: 'Received: Dorm Key', timer: 4 });
                            }
                            releaseJordan(game);
                            data.keyReceived = true;
                        },
                    };
                },
                condition(game, data) { return !!data.keyReceived; },
            },

        ]);
    }

    // ── Drawing ────────────────────────────────────────────────────────────

    // Open item: merges with the NPC dialogue box (UISystem.drawNpcDialogue) into one drawDialogue
    // when the portraits land
    _draw(game) {
        if (!game.activeScene) return;
        const scene = game.activeScene;
        if (scene.index >= scene.nodes.length) return;
        const ctx  = game.ctx;
        const node = scene.nodes[scene.index];
        ctx.save();
        drawDialogue(ctx, ctx.canvas.width, ctx.canvas.height,
            { name: node.speaker, color: node.color, text: node.line, choices: node.choices,
              hint: node.choices ? 'Esc \u2014 skip' : 'E \u2014 continue', more: !node.choices }, game.animTime);
        ctx.restore();
    }
}

// Shared helper — find a named NPC entity
function _findNpc(game, name) {
    return game.entities.find(e => e.agent && e.agent.name === name) || null;
}
