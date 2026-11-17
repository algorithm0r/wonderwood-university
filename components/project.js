// Project — a collection of tasks with dependencies, a deadline, and an owner
class Project {
    constructor(id, label, tasks, deadline, output, ownerName, reputationReward) {
        this.id               = id;
        this.label            = label;
        this.tasks            = tasks;
        this.deadline         = deadline;        // game-minute from day start, or null
        this.output           = output;
        this.ownerName        = ownerName;
        this.reputationReward = reputationReward || 10;
        this.rewarded         = false;
        this.submitted        = false;           // set when submit task fires
    }

    isComplete() {
        // Complete when a submit task has been submitted
        const submitTask = this.tasks.find(t => t.mode === 'submit');
        if (submitTask) return submitTask.submitted;
        // Fallback for projects with no submit task (e.g. attendance)
        return this.tasks.every(t => t.quality >= t.maxQuality);
    }

    // Tasks the player can currently work on (unlocked, not complete)
    getWorkableTasks() {
        return this.tasks.filter(t => {
            const s = t.getStatus(this.tasks);
            return s === 'available' || s === 'in-progress';
        });
    }

    // Reputation gain fraction by career stage
    static repGainByStage(stage) {
        const gains = {
            'undergraduate': 0.10,
            'graduate':      0.40,
            'postdoc':       0.70,
            'faculty':       0.90,
            'senior':        1.00,
        };
        return gains[stage] || 0.50;
    }
}
