// ClockSystem - manages in-game time
// Time scale: 1 real second = 2 game minutes (adjustable via MINUTES_PER_SECOND)
// Day runs from 6:00 AM to 2:00 AM (20 game hours = 600 game minutes = 300 real seconds = 5 real minutes)

const MINUTES_PER_SECOND = params.MINUTES_PER_SECOND;
// DAY_NAMES, UI_HEIGHT, CHUNK_DURATION — globals from util.js
const DAY_START_HOUR = 6;    // 6 AM
const DAY_END_HOUR   = 26;   // 2 AM next day (26 = 24 + 2)
const DAY_LENGTH_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 1200

class ClockSystem {
    constructor() {
        this.gameMinute = 0;    // minutes elapsed since 6 AM
        this.day = 1;
        this.week = 1;
        this.accumulator = 0;
        this.newDay = false;    // true for one tick when a new day starts
    }

    update(deltaTime, game) {
        this.newDay = false;
        game.clock = this;

        if (game.paused) return;

        this.accumulator += deltaTime * MINUTES_PER_SECOND;

        while (this.accumulator >= 1) {
            this.accumulator -= 1;
            this.gameMinute++;

            if (this.gameMinute >= DAY_LENGTH_MINUTES) {
                // Safety auto-advance (2am fallback if player never sleeps)
                this.gameMinute = 0;
                this.day++;
                this.newDay = true;
                if (this.day > 7) {
                    this.day = 1;
                    this.week++;
                }
                if (game.dayStats) game.dayStats = { skillsGained: {}, projectsCompleted: [] };
            }
        }
    }

    // Called by SleepSystem to advance to a new day at the chosen wake time
    advanceDay(wakeHour) {
        this.day++;
        if (this.day > 7) {
            this.day = 1;
            this.week++;
        }
        // Set clock to wake time (minutes since DAY_START_HOUR)
        this.gameMinute = Math.max(0, (wakeHour - DAY_START_HOUR) * 60);
        this.accumulator = 0;
        this.newDay = true;
    }

    // Total minutes since 6am today
    getGameMinute() {
        return this.gameMinute;
    }

    // Current hour (24h), e.g. 14 = 2pm
    getHour() {
        return (DAY_START_HOUR + Math.floor(this.gameMinute / 60)) % 24;
    }

    // Whole minutes past the hour: the clock steps a minute at a time, but anything that sets
    // gameMinute directly (a test, a skip) may leave a fraction, and the HUD never shows one
    getMinute() {
        return Math.floor(this.gameMinute) % 60;
    }

    // Formatted time string, e.g. "9:30 AM"
    getTimeString() {
        return timeOfDay(DAY_START_HOUR + Math.floor(this.gameMinute) / 60);
    }

    getDayName() {
        return DAY_NAMES[(this.day - 1) % 7];
    }

}
