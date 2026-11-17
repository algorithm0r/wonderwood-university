// NPCDialogueSystem — E-press interaction with named NPCs
// Runs after TaskInteractionSystem so game.interactionPrompt reflects current frame.
// Sets game.nearbyNpc (for E-hint rendering) and game.npcDialogue (for UI panel).

class NPCDialogueSystem {
    constructor() {
        this.keys = new KeyEdge();
    }

    update(deltaTime, game) {
        if (game.paused) return;

        const eJustPressed = this.keys.tap('e', game.keys);

        // Advance or close open dialogue; it closes too once the player walks off (LEAVE_RADIUS)
        if (game.npcDialogue) {
            const who = game.npcDialogue.entity, player = game.player;
            const gone = who && player && getDistance(
                { x: who.position.x + who.drawWidth / 2, y: who.position.y + who.drawHeight / 2 },
                { x: player.position.x + player.drawWidth / 2, y: player.position.y + player.drawHeight / 2 }) > params.LEAVE_RADIUS;
            if (gone) {
                game.npcDialogue = null;
            } else if (eJustPressed) {
                if (game.npcDialogue.lineIndex < game.npcDialogue.lines.length - 1) {
                    game.npcDialogue.lineIndex++;
                } else {
                    game.npcDialogue = null;
                }
            } else if (game.keys['Escape']) {
                game.npcDialogue = null;
            }
            return;
        }

        // Someone to talk to only while they are E's target (interactTarget) and no panel is open
        const target  = game.interactTarget;
        const nearest = !game.activePanel && target && target.kind === 'npc' ? target.entity : null;
        game.nearbyNpc = nearest;

        if (nearest && eJustPressed) {
            const lines = (nearest.npc.dialogueLines && nearest.npc.dialogueLines.length > 0)
                ? nearest.npc.dialogueLines
                : ['...'];
            game.npcDialogue = {
                entity:    nearest,
                name:      nearest.agent.name,
                color:     nearest.color || '#8888aa',
                lines,
                lineIndex: 0,
            };
        }
    }
}
