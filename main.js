const gameEngine = new GameEngine({ debugging: false });
window.gameEngine = gameEngine;

const ASSET_MANAGER = new AssetManager();
queueGameArt(ASSET_MANAGER);   // setup.js

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById('gameWorld');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.imageSmoothingEnabled = false;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    gameEngine.init(ctx);

    // Show character creator; start game when name is confirmed
    const creator   = document.getElementById('character-creator');
    const nameInput = document.getElementById('playerName');
    const startBtn  = document.getElementById('startBtn');

    function confirmName() {
        const name = nameInput.value.trim() || 'Alex Chen';
        creator.style.display = 'none';
        canvas.focus();
        startGame(name);
    }

    startBtn.addEventListener('click', confirmName);
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') confirmName(); });
    nameInput.focus();

    function startGame(playerName) {

    // Systems — order matters
    gameEngine.addSystem(new ClockSystem());            // 1.  Advance game time
    gameEngine.addSystem(new SeasonSystem());           //     Dress the campus for the season and weather
    gameEngine.addSystem(new ScheduleSystem());         // 2.  Fire scheduled events
    gameEngine.addSystem(new PlayerInputSystem());      // 3.  Read player input
    gameEngine.addSystem(new NPCSystem());              // 4.  NPC movement decisions
    gameEngine.addSystem(new TaskInteractionSystem());  // 5.  Station proximity + task progress
    gameEngine.addSystem(new NPCDialogueSystem());      // 6.  NPC E-press dialogue (after task system)
    gameEngine.addSystem(new MovementSystem());         // 7.  Move all entities
    gameEngine.addSystem(new CritterSystem());          //     The animals: spawn, flee, come back
    gameEngine.addSystem(new CameraSystem());           // 8.  Follow player with camera
    gameEngine.addSystem(new AnimationSystem());        // 9.  Update sprite frames
    gameEngine.addSystem(new RenderSystem());           // 10. Draw world + entities
    gameEngine.addSystem(new ProjectUISystem());        // 11. Draw station + project overlays
    gameEngine.addSystem(new UISystem());               // 12. Draw HUD on top
    gameEngine.addSystem(new RegistrationSystem());     // 13. Registration panel (above HUD)
    gameEngine.addSystem(new ShopSystem());             // 14. Shop panel (above HUD)
    gameEngine.addSystem(new CalendarSystem());         // 15. Calendar overlay (above HUD)
    gameEngine.addSystem(new SceneSystem());            // 16. Scene panels (above HUD)
    gameEngine.addSystem(new SleepSystem());            // 17. Sleep/alarm UI (topmost)

    setUpLevel(gameEngine, CAMPUS);   // the campus's tiles, buildings, props and lookups (setup.js)

    // ── Player ───────────────────────────────────────────────────────────────
    const start = CAMPUS.startPosition;
    gameEngine.player = createStudent(gameEngine, playerName, start.x, start.y);

    // ── Helper: tile pixel top-left ───────────────────────────────────────────
    const T = (col, row) => ({ x: col * 64, y: row * 64 });

    // ── Faculty ───────────────────────────────────────────────────────────────
    // Work hours: 8am (120) → 6pm (720)

    createAcademic(gameEngine, 'Dr. Marriott', 'faculty', '#5c9ed6', {
        home:         T(5, 7),    // House 1
        work:         T(10, 67),  // Faculty Offices
        workHours:    { arrive: 120, depart: 720 },
        speechText:   'Office hours posted on my door.',
        dialogueLines: [
            "I'm Chris Marriott — CS department.",
            'My courses focus on the fundamentals.',
            'Come to office hours if you need help.',
        ],
    });

    createAcademic(gameEngine, 'Dr. Chebib', 'faculty', '#7dcea0', {
        home:         T(42, 6),   // House 4
        work:         T(45, 43),  // Bio Lab
        workHours:    { arrive: 120, depart: 720 },
        speechText:   'Bio lab is open most mornings.',
        dialogueLines: [
            'Jobran Chebib — biology.',
            'The lab is the best classroom we have.',
            "Come find me if you want research experience.",
        ],
    });

    createAcademic(gameEngine, 'Dr. Nair', 'faculty', '#f0a87a', {
        workPose: 'write',
        home:         T(6, 19),   // Condo 1
        work:         T(12, 59),  // Stats & Soc Sci: the seminar table's west front chair, facing it
        workHours:    { arrive: 120, depart: 720 },
        speechText:   'Stats — more useful than you think.',
        dialogueLines: [
            'Priya Nair. I teach statistics.',
            'Stats opens up every other field. Trust me.',
            "Come find me if the numbers get confusing.",
        ],
    });

    createAcademic(gameEngine, 'Alex Okafor', 'faculty', '#c8a2c8', {
        workPose: 'write',
        home:         T(16, 21),  // Condo 2
        work:         T(21, 46),  // Writing Center: a front chair of her table, facing it
        workHours:    { arrive: 120, depart: 720 },
        speechText:   'Writing center is open to everyone.',
        dialogueLines: [
            'Alex Okafor — I run the writing center.',
            'Good writing is a skill, not a talent.',
            "Drop by any time. Door's always open.",
        ],
    });

    createAcademic(gameEngine, 'Dr. Webb', 'senior', '#a67db8', {
        workPose: 'work',
        home:         T(17, 8),   // House 2
        work:         T(8, 46),  // Physics Lab: the south side of the west bench, facing it
        workHours:    { arrive: 120, depart: 720 },
        speechText:   'Physics is worth the effort.',
        dialogueLines: [
            'Yolanda Webb. Physics.',
            'I chose this school on purpose. It matters.',
            'Come ready to work if you take my class.',
        ],
    });

    // ── Shopkeepers ───────────────────────────────────────────────────────────

    createAcademic(gameEngine, 'Dani Reyes', 'staff', '#f1948a', {
        workPose: 'work',
        home:         T(28, 20),  // Condo 3
        work:         T(23, 67),  // Campus Café, behind the counter
        workHours:    { arrive: 60, depart: 840 },   // 7am–8pm
        speechText:   "Coffee's on. Come in any time.",
        dialogueLines: [
            'Dani Reyes — I own this place.',
            'Been here twelve years. Best decision I made.',
            'Come back when you need a break from studying.',
        ],
    });

    createAcademic(gameEngine, 'Ruth George', 'staff', '#d2b48c', {
        workPose: 'work',
        home:         T(28, 6),   // House 3
        work:         T(9, 82),   // Bookstore, behind the register
        workHours:    { arrive: 180, depart: 660 },  // 9am–5pm
        speechText:   'Used textbooks are in the back.',
        dialogueLines: [
            "Ruth George. I've run this bookstore a long time.",
            'I know where everything is.',
            'Ask if you need a specific text.',
        ],
    });

    createAcademic(gameEngine, 'Finn Larsen', 'staff', '#8d6e63', {
        workPose: 'work',
        home:         T(28, 30),  // Behind the bar at The Ballast
        work:         T(28, 30),  // Same building
        workHours:    { arrive: 660, depart: 1200 }, // 5pm–2am
        // Friday nights he plays (CONTENT.md, venues): on the stage, 8–11pm; nobody covers the bar
        gigs:         [{ day: 6, from: 840, to: 1020, at: T(27, 33), pose: 'perform' }],
        speechText:   'Pub opens at five. Food too.',
        dialogueLines: [
            "Finn Larsen — the pub's mine.",
            'I was in a band in the nineties. Almost made it.',
            'Come by tonight if you want to hear the story.',
        ],
    });

    createAcademic(gameEngine, 'Owen Marsh', 'staff', '#82e0aa', {
        workPose: 'work',
        home:         T(53, 8),   // House 5
        work:         T(47, 82),  // Sandwich Shop, behind the counter
        workHours:    { arrive: 240, depart: 600 },  // 10am–4pm
        speechText:   'Good sandwiches. Nothing fancy.',
        dialogueLines: [
            'Owen Marsh.',
            'Sandwich shop. Simple food, done right.',
            "I close early when the weather's good.",
        ],
    });

    // ── Graduate Students ─────────────────────────────────────────────────────
    // Work hours: 9am (180) → 5pm (660)

    createAcademic(gameEngine, 'Sam Park', 'graduate', '#e88c5a', {
        home:         T(40, 21),  // Apt A
        work:         T(41, 56),  // CS Lab
        workHours:    { arrive: 180, depart: 660 },
        speechText:   "CS lab's open while I'm on shift.",
        dialogueLines: [
            'Sam Park — CS grad student.',
            'I run the lab open hours.',
            'Good place to get work done.',
        ],
    });

    createAcademic(gameEngine, 'Maria Vásquez', 'graduate', '#5dade2', {
        workPose: 'work',
        home:         T(52, 19),  // Apt B
        work:         T(48, 46),  // Bio Lab: the south side of the east bench, facing it
        workHours:    { arrive: 180, depart: 660 },
        speechText:   'The bio lab has good equipment.',
        dialogueLines: [
            'Maria Vásquez. Biology PhD.',
            'The Puget Sound ecosystem is remarkable.',
            'Find me if you want lab experience.',
        ],
    });

    createAcademic(gameEngine, 'Travis Whitfield', 'graduate', '#f7dc6f', {
        home:         T(44, 21),  // Apt A
        work:         T(24, 56),  // Library
        workHours:    { arrive: 180, depart: 660 },
        speechText:   "Library's quiet in the evenings.",
        dialogueLines: [
            'Travis Whitfield. Stats PhD.',
            "I've been here longer than I planned.",
            'Good problems will do that to you.',
        ],
    });

    createAcademic(gameEngine, 'Casey Drummond', 'graduate', '#aed6f1', {
        workPose: 'write',
        home:         T(56, 19),  // Apt B
        work:         T(26, 45),  // Writing Center: a front chair of her table, facing it
        workHours:    { arrive: 180, depart: 660 },
        speechText:   'Writing center has private rooms.',
        dialogueLines: [
            'Casey Drummond. Writing MA.',
            "I'm here to write a book, not become a professor.",
            'The writing center is the good part of this campus.',
        ],
    });

    createAcademic(gameEngine, 'Dmitri Volkov', 'graduate', '#95a5a6', {
        workPose: 'work',
        home:         T(64, 20),  // Apt C
        work:         T(13, 46),  // Physics Lab
        workHours:    { arrive: 180, depart: 660 },
        speechText:   'Physics lab — north wing, level one.',
        dialogueLines: [
            'Dmitri Volkov — physics.',
            'I came from Moscow. The coffee here is unfortunate.',
            'But the research is interesting.',
        ],
    });

    // ── Undergraduates ────────────────────────────────────────────────────────

    createAcademic(gameEngine, 'Jordan Burman', 'undergraduate', '#a8d8a8', {
        home:         T(51, 32),  // Dorm
        work:         T(47, 31),  // Dorm lobby, beside the desk: the student guide
        workHours:    { arrive: 180, depart: 600 },  // 9am–4pm
        speechText:   'Hey! You new here too?',
        dialogueLines: [
            'Jordan Burman. You just arrive?',
            "I'm still figuring out what I'm studying.",
            'Want to put a study group together?',
        ],
    });

    // Where each building shows its name as the player nears its door (a ruin carries none). A Larch
    // Hill home's plate names who lives there, from the homes assigned above
    const homes = gameEngine.entities.filter(e => e.npc && e.npc.home);
    const everyone = gameEngine.entities.filter(e => e.agent).map(e => e.agent.name);
    const plate = b => !LARCH_HILL.some(lot => lot.col === b.col && lot.row === b.row) ? b.name
        : homePlate(homes.filter(e => livesIn(e, b)).map(e => e.agent.name), everyone);
    gameEngine.buildingSigns = CAMPUS.buildings.filter(b => !b.ruin).map(b => buildingSign(CAMPUS, b, plate(b))).filter(Boolean);

    // ── Game state ────────────────────────────────────────────────────────────
    gameEngine.projects         = [];
    gameEngine.scheduledEvents  = [];
    gameEngine.commitments      = [];
    gameEngine.availableCourses = COURSE_CATALOG;

    gameEngine.notifications    = [];
    gameEngine.pendingClassEnds = [];
    gameEngine.dayStats         = { skillsGained: {}, projectsCompleted: [] };
    gameEngine.quarter       = new Quarter(1);
    gameEngine.paused        = false;
    gameEngine.activePanel   = null;
    gameEngine.activeScene   = null;
    gameEngine.storyFlags    = {};

    gameEngine.start();

    } // end startGame
});
