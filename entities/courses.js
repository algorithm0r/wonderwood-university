// Course catalog — all courses available for registration.
// Day numbering: Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6, Sat=7
// MWF = days 2, 4, 6  |  TR = days 3, 5

const COURSE_CATALOG = [

    // ── Computer Science ──────────────────────────────────────────────────────
    {
        id:           'cs-101',
        label:        'CS 101 — Intro to Programming',
        instructor:   'Dr. Marriott',
        cost:         100,
        scheduleText: 'MWF 9–10am',
        rewardText:   'CS +100, Coding +50, Calc +30, Writing +20',

        domainSkill:         'cs',
        location:            'classroom-desk',
        attendanceThreshold: 0.8,

        sessions: [
            { type: 'class', dayOfWeek: 2, startMinute: 3 * 60, duration: 50, sessionDay: 2 },
            { type: 'class', dayOfWeek: 4, startMinute: 3 * 60, duration: 50, sessionDay: 4 },
            { type: 'exam',  dayOfWeek: 6, startMinute: 3 * 60 },
        ],

        assignmentFactory: (ownerName, weekNum, sessionDay) =>
            createCS101Assignment(ownerName, weekNum, sessionDay),

        examFactory: (ownerName, weekNum) =>
            createCS101Exam(ownerName, weekNum),
    },

    // ── Biology ───────────────────────────────────────────────────────────────
    {
        id:           'bio-101',
        label:        'Bio 101 — Intro to Biology',
        instructor:   'Dr. Chebib',
        cost:         100,
        scheduleText: 'MWF 10–11am',
        rewardText:   'Bio +100, Wet Lab +50, Reading +30',

        domainSkill:         'bio',
        location:            'classroom-desk',
        attendanceThreshold: 0.8,

        sessions: [
            { type: 'class', dayOfWeek: 2, startMinute: 4 * 60, duration: 50, sessionDay: 2 },
            { type: 'class', dayOfWeek: 4, startMinute: 4 * 60, duration: 50, sessionDay: 4 },
            { type: 'exam',  dayOfWeek: 6, startMinute: 4 * 60 },
        ],

        assignmentFactory: (ownerName, weekNum, sessionDay) =>
            createGenericAssignment(ownerName, weekNum, sessionDay,
                'bio-101', 'Bio 101', 'lab-bench', 'wetLab', 'bio'),

        examFactory: (ownerName, weekNum) =>
            createGenericExam(ownerName, weekNum, 'bio-101', 'Bio 101', 'bio'),
    },

    // ── Physics ───────────────────────────────────────────────────────────────
    {
        id:           'phys-101',
        label:        'Phys 101 — Intro to Physics',
        instructor:   'Dr. Webb',
        cost:         100,
        scheduleText: 'MWF 11am–12pm',
        rewardText:   'Physics +100, Calculating +50, Writing +30',

        domainSkill:         'physics',
        location:            'classroom-desk',
        attendanceThreshold: 0.8,

        sessions: [
            { type: 'class', dayOfWeek: 2, startMinute: 5 * 60, duration: 50, sessionDay: 2 },
            { type: 'class', dayOfWeek: 4, startMinute: 5 * 60, duration: 50, sessionDay: 4 },
            { type: 'exam',  dayOfWeek: 6, startMinute: 5 * 60 },
        ],

        assignmentFactory: (ownerName, weekNum, sessionDay) =>
            createGenericAssignment(ownerName, weekNum, sessionDay,
                'phys-101', 'Phys 101', 'computer-lab', 'calculating', 'physics'),

        examFactory: (ownerName, weekNum) =>
            createGenericExam(ownerName, weekNum, 'phys-101', 'Phys 101', 'physics'),
    },

    // ── Statistics ────────────────────────────────────────────────────────────
    {
        id:           'stats-101',
        label:        'Stats 101 — Intro to Statistics',
        instructor:   'Dr. Nair',
        cost:         100,
        scheduleText: 'MWF 1–2pm',
        rewardText:   'Stats +100, Calculating +50, Writing +30',

        domainSkill:         'stats',
        location:            'classroom-desk',
        attendanceThreshold: 0.8,

        sessions: [
            { type: 'class', dayOfWeek: 2, startMinute: 7 * 60, duration: 50, sessionDay: 2 },
            { type: 'class', dayOfWeek: 4, startMinute: 7 * 60, duration: 50, sessionDay: 4 },
            { type: 'exam',  dayOfWeek: 6, startMinute: 7 * 60 },
        ],

        assignmentFactory: (ownerName, weekNum, sessionDay) =>
            createGenericAssignment(ownerName, weekNum, sessionDay,
                'stats-101', 'Stats 101', 'computer-lab', 'calculating', 'stats'),

        examFactory: (ownerName, weekNum) =>
            createGenericExam(ownerName, weekNum, 'stats-101', 'Stats 101', 'stats'),
    },

    // ── Writing ───────────────────────────────────────────────────────────────
    // TR course — competes with lab time and job shifts
    {
        id:           'writ-101',
        label:        'Writ 101 — Academic Writing',
        instructor:   'Alex Okafor',
        cost:         100,
        scheduleText: 'TR 10–11am',
        rewardText:   'Writing +100, Reading +50',

        domainSkill:         'writing',
        location:            'classroom-desk',
        attendanceThreshold: 0.8,

        sessions: [
            { type: 'class', dayOfWeek: 3, startMinute: 4 * 60, duration: 50, sessionDay: 3 },
            { type: 'class', dayOfWeek: 5, startMinute: 4 * 60, duration: 50, sessionDay: 5 },
            { type: 'exam',  dayOfWeek: 1, startMinute: 7 * 60 },  // Sunday take-home
        ],

        assignmentFactory: (ownerName, weekNum, sessionDay) =>
            createGenericAssignment(ownerName, weekNum, sessionDay,
                'writ-101', 'Writ 101', 'office-desk', 'writing', 'writing'),

        examFactory: (ownerName, weekNum) =>
            createGenericExam(ownerName, weekNum, 'writ-101', 'Writ 101', 'writing'),
    },

];
