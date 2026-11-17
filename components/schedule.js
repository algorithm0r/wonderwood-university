// Schedule component - tracks committed time blocks and current task
class Schedule {
    constructor() {
        // Array of { startMinute, durationMinutes, label, location }
        // startMinute is minutes since 6am (e.g. 180 = 9am)
        this.commitments = [];
        this.currentTask = null; // active task being worked on
    }

    // Check if a given game-minute is committed
    isCommitted(gameMinute) {
        return this.commitments.some(c =>
            gameMinute >= c.startMinute && gameMinute < c.startMinute + c.durationMinutes
        );
    }

    addCommitment(startMinute, durationMinutes, label, location) {
        this.commitments.push({ startMinute, durationMinutes, label, location });
    }
}
