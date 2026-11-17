// Agent component - career data for player and NPC academics
class Agent {
    constructor(name = 'Unknown', stage = 'undergraduate') {
        this.name = name;
        this.stage = stage; // undergraduate, graduate, postdoc, faculty, senior

        // Core resources
        this.reputation = 0;      // 0-100, stage-relative meaning
        this.money = 500;         // dollars/stipend units
        this.wellbeing = 80;      // 0-100, buffer against cascade failure

        // Wellbeing state - derived from wellbeing value
        // thriving (80-100), stable (60-79), stressed (40-59),
        // depleted (20-39), burning-out (5-19), burned-out (0-4)
        this.wellbeingState = 'stable';
    }

    updateWellbeingState() {
        const w = this.wellbeing;
        if (w >= 80)      this.wellbeingState = 'thriving';
        else if (w >= 60) this.wellbeingState = 'stable';
        else if (w >= 40) this.wellbeingState = 'stressed';
        else if (w >= 20) this.wellbeingState = 'depleted';
        else if (w >= 5)  this.wellbeingState = 'burning-out';
        else              this.wellbeingState = 'burned-out';
    }
}
