// Commitment — a scheduled obligation on the player's calendar.
// Sources: course registration, job acceptance, study group, social.

class Commitment {
    constructor({ id, label, type, location, dayOfWeek, startMinute, duration,
                  recurring, reward, penalty, courseId }) {
        this.id          = id;
        this.label       = label;
        this.type        = type;          // 'class' | 'exam' | 'job' | 'study-group' | 'date'
        this.location    = location;      // station type or id string
        this.dayOfWeek   = dayOfWeek;     // 1=Mon … 7=Sun
        this.startMinute = startMinute;   // minutes since DAY_START_HOUR (e.g. 180 = 9am if start=6am)
        this.duration    = duration;      // minutes
        this.recurring   = !!recurring;   // true = weekly; false = one-off
        this.reward      = reward  || null;
        this.penalty     = penalty || null;
        this.courseId    = courseId || null; // source id for grouping (e.g. 'cs-101')
        this.color       = Commitment.typeColor(type);
    }

    endMinute() {
        return this.startMinute + this.duration;
    }

    conflictsWith(other) {
        if (this.dayOfWeek !== other.dayOfWeek) return false;
        return this.startMinute < other.endMinute() && other.startMinute < this.endMinute();
    }

    static typeColor(type) {
        const COLORS = {
            'class':       '#5b9bd5',
            'exam':        '#e05555',
            'job':         '#81c784',
            'study-group': '#f0a87a',
            'date':        '#e57dbd',
        };
        return COLORS[type] || '#9e9e9e';
    }
}
