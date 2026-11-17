// The game's setup, shared by main.js and the art demo (demo/pixellab.html), so the demo draws the
// campus the game draws: queueGameArt queues every image the game draws, and setUpLevel builds a
// level's world on a game (its tiles, buildings, props and the lookups the systems read).

// Every image the game draws, queued on an asset manager
function queueGameArt(assets) {
    for (const sheets of Object.values(CHARACTER_SHEETS))
        for (const path of characterImages(sheets)) assets.queueDownload(path);
    // Outdoor sheets and props, each with its season variants (SeasonSystem picks among them)
    for (const def of [...Object.values(OUTDOOR_SHEETS), ...Object.values(PROP_TYPES)])
        for (const image of seasonalImages(def)) assets.queueDownload(image);
    // The masks of the props that are lit at night (Lighting)
    for (const def of Object.values(PROP_TYPES))
        for (const mask of (def.lit && def.lit.masks) || []) assets.queueDownload(maskImage(def, mask));
    // The critters' art, for the kinds whose art is in (params.CRITTERS)
    for (const def of Object.values(params.CRITTERS)) if (def && def.art) {
        for (const image of def.art.images || [def.art.image]) assets.queueDownload(image);
        if (def.art.fly) assets.queueDownload(def.art.fly.image);
    }
    assets.queueDownload(UI_FRAMES.image);
    assets.queueDownload(ICONS.image);
    assets.queueDownload(FONT.image);
    for (const image of Object.values(FLOOR_VARIANTS.sheets)) assets.queueDownload(image);
    for (const kit of Object.values(BUILDING_KITS)) {
        assets.queueDownload(kit.image);
        for (const image of seasonalImages(kit.windows)) assets.queueDownload(image);   // and at night
        if (kit.doors) assets.queueDownload(kit.doors.image);
    }
}

// A level's world, built on a game once its art is loaded: the level is the game's current one
function setUpLevel(game, level) {
    game.currentLevel = level;
    game.camera = { x: 0, y: 0 };
    for (const b of level.buildings) openKitRing(level, b);
    game.tileLayout = layoutTiles(level);
    // The outdoor sheets (OUTDOOR_SHEETS) are SeasonSystem's: it sets them for the look on its
    // first tick, before anything draws
    game.tileSheets = {};
    for (const [name, kit] of Object.entries(BUILDING_KITS)) game.tileSheets[name] = ASSET_MANAGER.getAsset(kit.image);
    for (const [set, image] of Object.entries(FLOOR_VARIANTS.sheets)) game.tileSheets[set] = ASSET_MANAGER.getAsset(image);

    // Buildings (maps/buildingkit.js): wall pieces, then wall boxes, which block instead of the
    // ring. Pieces go first, so a prop on a wall's base line draws in front of the wall
    const kitWalls = [];
    game.pieces = [];
    for (const b of level.buildings) {
        for (const p of kitBuildingPieces(level, b)) game.pieces.push(createKitPiece(game, b, p));
        for (const box of kitWallBoxes(level, b)) kitWalls.push(createKitWall(game, box));
    }

    // Props: trees in tree cells + the map's placements. Solid ones block movement and paths; tall
    // ones fade while they hide the player (RenderSystem). SeasonSystem dresses them for the look,
    // and lays the street's decals for the season beside them (game.decals, game.loopingProps)
    game.props      = levelProps(level).map(p => createProp(game, p));
    game.solidProps = [...kitWalls, ...game.props.filter(p => p.collider)];
    game.overheads  = game.props.filter(p => p.overhead);
    // Every seat (a chair or stool someone may sit in), by the cell its base is in: whoever works
    // at that cell is drawn in it (AnimationSystem)
    game.seats = new Map(game.props.filter(p => p.seat).map(p => {
        const x = p.position.x + p.drawWidth / 2, y = p.position.y + p.drawHeight;
        return [`${Math.floor(x / 64)},${Math.floor(y / 64)}`, { x, y }];
    }));
    game.walkable = walkableGrid(level, game.solidProps);
    // Each building's back wall, which fades as one while the player is behind it (RenderSystem)
    game.backWalls = level.buildings.map(b => backWall(game, b));
    game.rooms    = roomGrid(level);
    // Every platform's stand point (the stage), by the walkable cell nearest it: whoever works at
    // that cell is drawn standing on the platform, sorting just after it (AnimationSystem)
    game.stands = new Map(game.props.filter(p => p.stand).map(p => {
        const b = spriteBox(p), x = b.x + p.stand.x * params.ART_SCALE, y = b.y + p.stand.y * params.ART_SCALE;
        let best = null;
        game.walkable.forEach((row, r) => row.forEach((ok, c) => {
            const d = ok && Math.hypot(c * 64 + 32 - x, r * 64 + 32 - y);
            if (ok && (!best || d < best.d)) best = { c, r, d };
        }));
        return [`${best.c},${best.r}`, { x, y, sort: footY(p) + 1 }];
    }));

    game.stationMap = {};
    for (const s of level.stations) game.stationMap[s.id] = s;
}
