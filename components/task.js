// Task — the atomic unit of work in any project
// Status is always derived, never stored, to prevent drift

class Task {
    constructor(id, label, stationId, opts) {
        this.id    = id;
        this.label = label;
        this.stationId = stationId;

        // Station targeting: specific id OR any station of a given type (not both)
        this.stationType = opts.stationType || null;

        // Gate: all required skills must be met to see / attempt this task
        this.requiredSkills = opts.requiredSkills || [];

        // The method skill used for chunk roll probability (null = auto-success)
        this.methodSkill = opts.methodSkill || null;

        // Chunk difficulty — 0–1000, same scale as skills (100 = one level)
        this.difficulty = opts.difficulty || 0;

        // Declared reward profile — visible before commitment, applied per chunk
        this.skillRewards = opts.skillRewards || [];

        this.dependsOn    = opts.dependsOn   || [];
        this.contributors = [];
        this.output       = opts.output      || null;

        // Mode: 'active' (hold E) | 'triggered' (press once, auto-runs) |
        //       'passive' (proximity) | 'submit' (one-shot, closes project)
        this.mode    = opts.mode || 'active';
        this.running = false;    // triggered: true while auto-advancing

        // ── Quality system ───────────────────────────────────────────────────
        // qualityTarget: quality points for an A grade
        // chunks:        expected chunks to reach A (determines chunkQuality; also
        //                auto-stop count for triggered tasks)
        // unlockThreshold: quality needed to ungate dependent tasks (low bar)
        // maxQuality:    hard cap — prevents infinite grinding
        this.qualityTarget   = opts.qualityTarget   || 300;
        this.chunks          = opts.chunks          || 3;   // expected chunks for A
        this.unlockThreshold = opts.unlockThreshold ||
                               Math.round(this.qualityTarget * 0.25);
        this.maxQuality      = opts.maxQuality      ||
                               Math.round(this.qualityTarget * 1.5);

        this.quality       = 0;   // accumulated quality points
        this.chunkProgress = 0;   // game-minutes into current chunk
        this.chunksRun     = 0;   // triggered tasks: chunks auto-completed so far
        this.submitted     = false; // submit-mode tasks: true once fired
    }

    // Quality contributed by one successful chunk
    get chunkQuality() {
        return Math.ceil(this.qualityTarget / this.chunks);
    }

    // Letter grade based on quality vs target
    getGrade() {
        if (this.mode === 'submit') return '';
        if (this.quality === 0) return '—';
        return gradeFromPct(this.quality / this.qualityTarget);
    }

    // Status is always derived from data
    getStatus(allTasks) {
        // Submit task
        if (this.mode === 'submit') {
            if (this.submitted) return 'complete';
            for (let depId of this.dependsOn) {
                const dep = allTasks.find(t => t.id === depId);
                if (!dep || dep.quality < dep.unlockThreshold) return 'locked';
            }
            return 'available';
        }

        // Regular task — unlock via dependency quality thresholds
        for (let depId of this.dependsOn) {
            const dep = allTasks.find(t => t.id === depId);
            if (!dep || dep.quality < dep.unlockThreshold) return 'locked';
        }

        if (this.running)                    return 'running';
        if (this.quality >= this.maxQuality) return 'complete';   // maxed out
        if (this.quality > 0 || this.chunkProgress > 0) return 'in-progress';
        return 'available';
    }

    // Fraction 0–1 toward A grade (for progress bar; clamped so bar fills at A)
    getProgressFraction() {
        if (this.qualityTarget === 0) return 1;
        return Math.min(this.quality / this.qualityTarget, 1.0);
    }
}
