// Project factories — all projects used in the prototype
//
// Quality scale: qualityTarget = expected quality points for an A grade.
//   chunks = expected successful chunks for A; chunkQuality = qualityTarget / chunks.
//   So qualityTarget 300, chunks 3 → 3 success chunks = A.
// Each project ends with a submit task at the office-desk.
// failureMode is gone — all outcomes contribute quality (0 / 50 / 100 / 150%).

// ── Research Project 1: Algorithm Complexity Study ───────────────────────────
function createAlgorithmProject(ownerName) {
    const t1 = new Task('t1', 'Literature Review', 'library-terminal', {
        requiredSkills: [],
        methodSkill:    'reading',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 6 }, { skill: 'reading', amount: 4 }],
        qualityTarget:  200,
        chunks:         2,
        output:         { type: 'notes', label: 'Research Notes', delivery: 'digital' },
    });

    const t2 = new Task('t2', 'Write Hypothesis', 'office-desk', {
        requiredSkills: [],
        methodSkill:    'writing',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 5 }, { skill: 'writing', amount: 5 }],
        qualityTarget:  200,
        chunks:         2,
        dependsOn:      ['t1'],
        output:         { type: 'doc', label: 'Hypothesis', delivery: 'digital' },
    });

    const t3 = new Task('t3', 'Implement Algorithm', null, {
        stationType:    'computer-lab',
        requiredSkills: [{ skill: 'cs', level: 100 }],
        methodSkill:    'coding',
        difficulty:     300,
        skillRewards:   [{ skill: 'cs', amount: 8 }, { skill: 'coding', amount: 8 }],
        qualityTarget:  300,
        chunks:         3,
        dependsOn:      ['t2'],
        output:         { type: 'code', label: 'Algorithm Code', delivery: 'digital' },
    });

    const t4 = new Task('t4', 'Run Test Suite', null, {
        stationType:    'computer-lab',
        requiredSkills: [{ skill: 'cs', level: 100 }],
        methodSkill:    'coding',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 6 }, { skill: 'coding', amount: 5 }],
        qualityTarget:  300,
        chunks:         3,
        dependsOn:      ['t3'],
        output:         { type: 'data', label: 'Test Results', delivery: 'digital' },
        mode:           'triggered',
    });

    const t5 = new Task('t5', 'Write Paper', 'office-desk', {
        requiredSkills: [],
        methodSkill:    'writing',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 5 }, { skill: 'writing', amount: 6 }],
        qualityTarget:  300,
        chunks:         3,
        dependsOn:      ['t4'],
        output:         { type: 'paper', label: 'Research Paper', delivery: 'digital' },
    });

    const tSubmit = new Task('t-algo-submit', 'Submit Paper', 'office-desk', {
        dependsOn: ['t5'],
        mode:      'submit',
    });

    return new Project('p-algo', 'Algorithm Complexity Study',
        [t1, t2, t3, t4, t5, tSubmit], null,
        { type: 'paper', label: 'Published Paper' },
        ownerName, 20);
}

// ── Research Project 2: Network Analysis Study ───────────────────────────────
function createNetworkProject(ownerName) {
    const np1 = new Task('np1', 'Collect Dataset', 'library-terminal', {
        requiredSkills: [],
        methodSkill:    'reading',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 5 }, { skill: 'reading', amount: 4 }],
        qualityTarget:  200,
        chunks:         2,
        output:         { type: 'data', label: 'Raw Dataset', delivery: 'digital' },
    });

    const np2 = new Task('np2', 'Run Network Simulation', null, {
        stationType:    'computer-lab',
        requiredSkills: [{ skill: 'cs', level: 100 }],
        methodSkill:    'coding',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 8 }, { skill: 'coding', amount: 6 }],
        qualityTarget:  300,
        chunks:         3,
        dependsOn:      ['np1'],
        output:         { type: 'results', label: 'Simulation Output', delivery: 'digital' },
        mode:           'triggered',
    });

    const np3 = new Task('np3', 'Analyze Results', null, {
        stationType:    'computer-lab',
        requiredSkills: [{ skill: 'stats', level: 100 }],
        methodSkill:    'calculating',
        difficulty:     300,
        skillRewards:   [{ skill: 'stats', amount: 8 }, { skill: 'calculating', amount: 6 }],
        qualityTarget:  200,
        chunks:         2,
        dependsOn:      ['np2'],
        output:         { type: 'analysis', label: 'Statistical Analysis', delivery: 'digital' },
    });

    const np4 = new Task('np4', 'Write Report', 'office-desk', {
        requiredSkills: [],
        methodSkill:    'writing',
        difficulty:     200,
        skillRewards:   [{ skill: 'cs', amount: 5 }, { skill: 'writing', amount: 6 }],
        qualityTarget:  200,
        chunks:         2,
        dependsOn:      ['np3'],
        output:         { type: 'paper', label: 'Network Paper', delivery: 'digital' },
    });

    const tSubmit = new Task('t-network-submit', 'Submit Paper', 'office-desk', {
        dependsOn: ['np4'],
        mode:      'submit',
    });

    return new Project('p-network', 'Network Analysis Study',
        [np1, np2, np3, np4, tSubmit], null,
        { type: 'paper', label: 'Published Paper' },
        ownerName, 15);
}

// ── Teaching: CS 101 Assignment ──────────────────────────────────────────────
// ownerName: agent name. weekNum: 1-4. sessionDay: 2=Mon, 4=Wed (Sun=1 scheme).
// Each session spawns a distinct assignment; player submits at office-desk.
function createCS101Assignment(ownerName, weekNum, sessionDay) {
    const sid  = `cs101-w${weekNum}-d${sessionDay}`;
    const wday = sessionDay === 2 ? 'Mon' : 'Wed';

    // Week 1, Monday — Run Practice Simulation
    if (weekNum === 1 && sessionDay === 2) {
        const t1 = new Task(`${sid}-t1`, 'Run Practice Simulation', null, {
            stationType:   'computer-lab',
            methodSkill:   'coding',
            difficulty:    100,
            skillRewards:  [{ skill: 'cs', amount: 8 }, { skill: 'coding', amount: 6 }],
            qualityTarget: 100, chunks: 1,
            output: { type: 'results', label: 'Simulation Output', delivery: 'digital' },
            mode: 'triggered',
        });
        const tSub = new Task(`${sid}-sub`, 'Submit Assignment', 'office-desk',
            { dependsOn: [`${sid}-t1`], mode: 'submit' });
        return new Project(sid, 'CS 101 — Wk1 Mon: Run a Simulation',
            [t1, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
    }

    // Week 1, Wednesday — Read paper + write summary
    if (weekNum === 1 && sessionDay === 4) {
        const t1 = new Task(`${sid}-t1`, 'Read Assigned Paper', 'library-terminal', {
            methodSkill:   'reading',
            difficulty:    100,
            skillRewards:  [{ skill: 'cs', amount: 6 }, { skill: 'reading', amount: 4 }],
            qualityTarget: 100, chunks: 1,
            output: { type: 'notes', label: 'Reading Notes', delivery: 'digital' },
        });
        const t2 = new Task(`${sid}-t2`, 'Write Summary', 'office-desk', {
            methodSkill:   'writing',
            difficulty:    100,
            skillRewards:  [{ skill: 'cs', amount: 6 }, { skill: 'writing', amount: 4 }],
            qualityTarget: 100, chunks: 1,
            dependsOn: [`${sid}-t1`],
            output: { type: 'doc', label: 'Summary', delivery: 'digital' },
        });
        const tSub = new Task(`${sid}-sub`, 'Submit Assignment', 'office-desk',
            { dependsOn: [`${sid}-t2`], mode: 'submit' });
        return new Project(sid, 'CS 101 — Wk1 Wed: Reading & Summary',
            [t1, t2, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
    }

    // Week 2, Monday — Debug a program
    if (weekNum === 2 && sessionDay === 2) {
        const t1 = new Task(`${sid}-t1`, 'Debug Program', null, {
            stationType:   'computer-lab',
            methodSkill:   'coding',
            difficulty:    150,
            skillRewards:  [{ skill: 'cs', amount: 8 }, { skill: 'coding', amount: 8 }],
            qualityTarget: 150, chunks: 2,
            output: { type: 'code', label: 'Fixed Program', delivery: 'digital' },
        });
        const tSub = new Task(`${sid}-sub`, 'Submit Assignment', 'office-desk',
            { dependsOn: [`${sid}-t1`], mode: 'submit' });
        return new Project(sid, 'CS 101 — Wk2 Mon: Debug a Program',
            [t1, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
    }

    // Week 2, Wednesday — Write lab report
    if (weekNum === 2 && sessionDay === 4) {
        const t1 = new Task(`${sid}-t1`, 'Write Lab Report', 'office-desk', {
            methodSkill:   'writing',
            difficulty:    100,
            skillRewards:  [{ skill: 'cs', amount: 6 }, { skill: 'writing', amount: 6 }],
            qualityTarget: 150, chunks: 2,
            output: { type: 'doc', label: 'Lab Report', delivery: 'digital' },
        });
        const tSub = new Task(`${sid}-sub`, 'Submit Assignment', 'office-desk',
            { dependsOn: [`${sid}-t1`], mode: 'submit' });
        return new Project(sid, 'CS 101 — Wk2 Wed: Lab Report',
            [t1, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
    }

    // Fallback for weeks 3-4
    const t1 = new Task(`${sid}-t1`, `${wday} Exercise`, null, {
        stationType:   'computer-lab',
        methodSkill:   'coding',
        difficulty:    100 + weekNum * 50,
        skillRewards:  [{ skill: 'cs', amount: 10 }, { skill: 'coding', amount: 6 }],
        qualityTarget: 200, chunks: 2,
        output: { type: 'results', label: 'Exercise', delivery: 'digital' },
        mode: 'triggered',
    });
    const tSub = new Task(`${sid}-sub`, 'Submit Assignment', 'office-desk',
        { dependsOn: [`${sid}-t1`], mode: 'submit' });
    return new Project(sid, `CS 101 — Wk${weekNum} ${wday}: Exercise`,
        [t1, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
}

// ── Teaching: CS 101 Exam ─────────────────────────────────────────────────────
// Spawns on Friday of each week. Single triggered task; submit at office desk.
// Difficulty ramps: Week 1 = 50, Week 2 = 100, Week 3 = 150, Week 4 = 200.
function createCS101Exam(ownerName, weekNum) {
    const eid = `cs101-exam-w${weekNum}`;
    const difficulty = Math.min(50 + (weekNum - 1) * 50, 200);

    const t1 = new Task(`${eid}-t1`, 'Take Exam', null, {
        stationType:   'classroom-desk',
        methodSkill:   'cs',
        difficulty,
        skillRewards:  [],   // exams test knowledge, don't build it
        qualityTarget: 100,
        chunks:        1,
        mode:          'triggered',
    });
    const tSub = new Task(`${eid}-sub`, 'Hand In', 'office-desk',
        { dependsOn: [`${eid}-t1`], mode: 'submit' });

    return new Project(eid, `CS 101 — Wk${weekNum} Exam`,
        [t1, tSub], null,
        { type: 'exam', label: 'Exam Grade' },
        ownerName, 0);
}

// ── Generic stub factories (used by non-CS courses until full content exists) ─
// stationType: station type string. methodSkill: skill driving chunk roll.
// domainSkill: primary domain awarded. difficulty scales with weekNum.

function createGenericAssignment(ownerName, weekNum, sessionDay,
                                  courseId, courseLabel, stationType, methodSkill, domainSkill) {
    const sid  = `${courseId}-w${weekNum}-d${sessionDay}`;
    const wday = DAY_NAMES[(sessionDay - 1) % 7] || `D${sessionDay}`;
    const diff = 100 + (weekNum - 1) * 50;

    const t1 = new Task(`${sid}-t1`, `${wday} Exercise`, null, {
        stationType:   stationType,
        methodSkill:   methodSkill,
        difficulty:    diff,
        skillRewards:  [{ skill: domainSkill, amount: 8 }, { skill: methodSkill, amount: 5 }],
        qualityTarget: 100 + (weekNum - 1) * 50,
        chunks:        weekNum <= 2 ? 1 : 2,
        output: { type: 'assignment', label: 'Assignment', delivery: 'digital' },
    });
    const tSub = new Task(`${sid}-sub`, 'Submit', 'office-desk',
        { dependsOn: [`${sid}-t1`], mode: 'submit' });

    return new Project(sid, `${courseLabel} — Wk${weekNum} ${wday}`,
        [t1, tSub], null, { type: 'assignment', label: 'Assignment' }, ownerName, 0);
}

function createGenericExam(ownerName, weekNum, courseId, courseLabel, domainSkill) {
    const eid  = `${courseId}-exam-w${weekNum}`;
    const diff = Math.min(50 + (weekNum - 1) * 50, 200);

    const t1 = new Task(`${eid}-t1`, 'Take Exam', null, {
        stationType:   'classroom-desk',
        methodSkill:   domainSkill,
        difficulty:    diff,
        skillRewards:  [],
        qualityTarget: 100,
        chunks:        1,
        mode:          'triggered',
    });
    const tSub = new Task(`${eid}-sub`, 'Hand In', 'office-desk',
        { dependsOn: [`${eid}-t1`], mode: 'submit' });

    return new Project(eid, `${courseLabel} — Wk${weekNum} Exam`,
        [t1, tSub], null, { type: 'exam', label: 'Exam Grade' }, ownerName, 0);
}
