// Quarter — defines the structure and week-types of one academic quarter.
// Structure: 4 active weeks → 1 finals week → 1 break week (6 total).

class Quarter {
    constructor(number = 1) {
        this.number    = number;
        this.weekTypes = ['active', 'active', 'active', 'active', 'finals', 'break'];
        this.length    = this.weekTypes.length; // 6
    }

    weekType(weekNum) {
        return this.weekTypes[weekNum - 1] || 'break';
    }

    weekLabel(weekNum) {
        const t = this.weekType(weekNum);
        if (t === 'finals') return `Week ${weekNum} — Finals`;
        if (t === 'break')  return `Week ${weekNum} — Break`;
        return `Week ${weekNum}`;
    }

    isRegistrationOpen(weekNum) {
        return weekNum === 1 || this.weekType(weekNum) === 'break';
    }

    isFinalsWeek(weekNum) { return this.weekType(weekNum) === 'finals'; }
    isBreakWeek(weekNum)  { return this.weekType(weekNum) === 'break';  }
    isActiveWeek(weekNum) { return this.weekType(weekNum) === 'active'; }
}
