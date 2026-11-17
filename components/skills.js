// Skills component — two-layer academic skill model, 0–10 scale
// Domain knowledge: gates task access by field
// Method skills: amplify task speed and quality
// Social skills: deferred (see GDD 2.10)
class Skills {
    constructor() {
        this.domain = {
            cs:      0,   // Computer Science
            bio:     0,   // Biology / Life Sciences
            physics: 0,   // Physics
            chem:    0,   // Chemistry
            stats:   0,   // Statistics (cross-domain amplifier)
        };
        this.method = {
            reading:     0,   // Library Terminal
            writing:     0,   // Office Desk
            coding:      0,   // Computer Lab — implementation
            calculating: 0,   // Computer Lab — quantitative analysis
            wetLab:      0,   // Lab Bench
            teaching:    0,   // Classroom
        };
    }

    // Read a skill value by name (searches both layers)
    get(skillName) {
        if (Object.prototype.hasOwnProperty.call(this.domain, skillName)) return this.domain[skillName];
        if (Object.prototype.hasOwnProperty.call(this.method, skillName)) return this.method[skillName];
        return 0;
    }

    // Add to a skill (capped at 1000)
    add(skillName, amount) {
        if (Object.prototype.hasOwnProperty.call(this.domain, skillName)) {
            this.domain[skillName] = Math.min(1000, this.domain[skillName] + amount);
        } else if (Object.prototype.hasOwnProperty.call(this.method, skillName)) {
            this.method[skillName] = Math.min(1000, this.method[skillName] + amount);
        }
    }
}
