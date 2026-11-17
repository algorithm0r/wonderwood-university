// Characters listed in CHARACTER_SHEETS draw their sheets; the rest keep their colour box
function attachSheet(entity, key) {
    const paths = CHARACTER_SHEETS[key];
    if (!paths) return;
    const images = set => Object.fromEntries(Object.keys(params.CHAR_STATES).filter(s => set[s]).map(s => [s, ASSET_MANAGER.getAsset(set[s])]));
    const sheets = images(paths);
    const looks  = Object.fromEntries(Object.entries(paths.looks || {}).map(([key, set]) => [key, images(set)]));
    entity.sprite   = new Sprite(sheets.walk, 0, 0, params.CHAR_CELL, params.CHAR_CELL, params.CHAR_FOOT_Y);
    entity.animator = new Animator(sheets, nameHash(key), looks);
    if (paths.umbrella) entity.umbrella = ASSET_MANAGER.getAsset(paths.umbrella);   // up in the rain (Rain)
}

// Student entity factory - creates the player character
function createStudent(game, name, x, y) {
    const entity = {
        removeFromWorld: false,

        color: '#f5c842',
        drawWidth: 48,
        drawHeight: 48,

        position:        new Position(x, y),
        velocity:        new Velocity(0, 0),
        facing:          new Facing('down'),
        collider:        new Collider(44, 44, 2, 2),
        playercontrolled: new PlayerControlled(180),

        agent:    new Agent(name, 'undergraduate'),
        skills:   new Skills(),
        schedule: new Schedule(),
    };

    entity.skills.domain.cs          = 0;
    entity.skills.domain.stats        = 0;
    entity.skills.method.reading      = 50;
    entity.skills.method.writing      = 50;
    entity.skills.method.coding       = 0;
    entity.skills.method.calculating  = 0;

    entity.agent.money     = 500;
    entity.agent.wellbeing = 80;

    entity.inventory = new Inventory();
    // Dorm key received from Casey (RA) during Day 0 tutorial

    attachSheet(entity, 'player');
    game.addEntity(entity);
    return entity;
}

// NPC academic entity factory
// npcData (optional): { home, work, workHours, speechText, dialogueLines, workPose, gigs }
//   workPose:    the state it works in where its work cell has no station (charState)
//   gigs:        [{ day, from, to, at, pose }]: on that day (clock.day, Sun = 1) between those
//                minutes it works at `at` in `pose` instead (NPCSystem sets npc.gig)
//   home / work: { x, y } pixel top-left of the target tile (col*64, row*64)
//   workHours:   { arrive, depart } in game-minutes since 6am
function createAcademic(game, name, stage, color, npcData = {}) {
    const entity = {
        removeFromWorld: false,

        color,
        drawWidth: 48,
        drawHeight: 48,

        position: new Position(0, 0),   // NPCSystem places it each day (placeOnSchedule)
        velocity: new Velocity(0, 0),
        facing:   new Facing('down'),
        collider: new Collider(44, 44, 2, 2),

        npc:      new NPC(80),
        agent:    new Agent(name, stage),
        skills:   new Skills(),
        schedule: new Schedule(),
    };

    if (npcData.home)          entity.npc.home          = npcData.home;
    if (npcData.work)          entity.npc.work          = npcData.work;
    if (npcData.work)          entity.npc.workStation   = Object.values(game.stationMap).find(s =>
        Math.floor(s.x / 64) === npcData.work.x / 64 && Math.floor(s.y / 64) === npcData.work.y / 64) || null;
    if (npcData.workHours)     entity.npc.workHours     = npcData.workHours;
    if (npcData.workPose)      entity.npc.workPose      = npcData.workPose;
    if (npcData.gigs)          entity.npc.gigs          = npcData.gigs;
    if (npcData.speechText)    entity.npc.speechText    = npcData.speechText;
    if (npcData.dialogueLines) entity.npc.dialogueLines = npcData.dialogueLines;

    attachSheet(entity, name);
    game.addEntity(entity);
    return entity;
}
