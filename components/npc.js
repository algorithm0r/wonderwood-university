// NPC component - marks an entity as AI-controlled and stores navigation state
class NPC {
    constructor(speed = 80) {
        this.speed = speed;

        // Wander fallback (used when home/work not assigned)
        this.wanderTimer = Math.random() * 2;

        // Goal-directed navigation
        this.home      = null;   // { x, y } pixel top-left of home tile
        this.work      = null;   // { x, y } pixel top-left of work tile
        this.workHours = { arrive: 120, depart: 660 };  // game-minutes since 6am
        this.commute   = null;   // game-minutes home → work; NPCSystem sets it on first use
        this.escort    = null;   // { x, y } px: walk there at the player's pace and wait, until cleared

        this.state      = 'idle';  // 'idle'|'going-work'|'going-home'|'at-work'|'at-home'
        this.path       = [];      // waypoints from findPath()
        this.pathIndex  = 0;
        this.lastTarget = null;    // last computed goal key — avoids recomputing same path

        // Speech
        this.speechText    = null;   // one-line ambient text shown on proximity
        this.dialogueLines = [];     // lines for interactive dialogue panel
        this.showSpeech    = false;  // set each frame by NPCSystem
    }
}
