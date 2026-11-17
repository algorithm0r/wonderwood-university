// Props: images that stand on the ground, drawn at ART_SCALE with their ground point on a base
// point and depth-sorted with the characters. The ground point (foot, art px) defaults to the
// bottom-centre of the image. A prop with a footprint (world px, w × h, centred on the base and
// extending up from it) is solid. Image files: ART.md §5.
//
// A prop of mixed heights lists its `parts`, column ranges of its image ({ x, w }, art px) and
// each one's height up from the image's bottom (h). Each is placed as a prop of its own on the
// same base point (the first carries the footprint), so the tall part fades alone while it
// hides the player (ART.md §5).
//
// A station's prop names its station instead of a base point: it stands behind the station, its
// base on the station cell's top edge, so its footprint falls in the cell behind (the wall row,
// for a station against the back wall) and the station stays clear. A seat stands in its
// station instead, based on the cell's bottom edge, so it draws over whoever sits at it.
//
// A platform (`stand: { x, y }`, art px in its image) has a spot a performer's feet stand on: they
// are drawn there, over the platform, when working in the walkable cell nearest it (game.stands).
//
// A decal (`decal: true`) lies flat on the ground: it draws in the ground pass, after the tiles and
// under every character and prop, never blocks and never fades (game.decals, RenderSystem). An
// overhead prop (`overhead: true`) is its mirror: it draws after every character and prop, so
// people walk under it (game.overheads), and it never blocks either.
//
// A prop that animates has `loop: { frames, fps }`: its image is a strip of that many equal
// frames side by side, frame 0 the approved still (a still is a strip of one). Each one runs its
// loop offset in time by an amount picked by cellHash of its base cell (any fraction of the loop,
// not a whole frame), so neighbours neither show the same frame nor step on the same tick
// (AnimationSystem steps them). A prop with parts doesn't loop.
// A piece hung on a back wall (design/doors.md §2): its foot is its image's height `h` plus its
// hang, `up` art px above the wall's base, set on the kits' 42 px faces as made and scaled with
// params.KIT_WALL_FACE, so it keeps its place on the wall. A hung piece fades with its wall while
// the player is behind it (backWall)
const hangOn = (h, up) => ({ foot: { y: h + Math.round(up * params.KIT_WALL_FACE / 42) }, hung: true });

const PROP_TYPES = {
    fir:      { image: 'sprites/props/tree_fir_young.png', seasons: ['snow'] },               // solid via its tree cell
    tallFir:  { image: 'sprites/props/tree_fir_tall.png', foot: { x: 59 }, seasons: ['snow'] },  // trunk right of centre
    maple:    { image: 'sprites/props/tree_maple.png',    foot: { x: 84 }, seasons: ['winter', 'spring', 'summer', 'snow'] },  // trunk right of centre
    autumn:   { image: 'sprites/props/tree_street_autumn.png', foot: { x: 52 }, seasons: ['winter', 'spring', 'summer', 'snow'] },   // street tree
    cherry:   { image: 'sprites/props/tree_cherry.png',   foot: { x: 66 }, seasons: ['winter', 'spring', 'summer', 'snow'] },   // the cherry walk (Green Walkway 1)
    // PNW understorey, under FADE_HEIGHT: stands in a tree cell where no tree fits (levelProps)
    swordFern:    { image: 'sprites/props/sword_fern.png', seasons: ['winter', 'snow'] },
    salal:        { image: 'sprites/props/salal.png', seasons: ['summer', 'snow'] },
    rhododendron: { image: 'sprites/props/rhododendron.png', seasons: ['spring', 'snow'] },
    // TEST art, approved as is; 5 px of padding under its base
    shelf:    { image: 'sprites/props-test/shelf_mapobject.png', foot: { y: 59 }, footprint: { w: 80, h: 16 } },
    // The landmark on the Customs quay: footprint the art's width by its 4 cells of ground. Parts:
    // west wing, clock tower, east wing (the west wing mirrored)
    // At night its dial is backlit and a wash of light climbs the tower (design/day-night.md §2.5);
    // its windows stay dark
    customsHouse: { image: 'sprites/props/customs_house.png', footprint: { w: 876, h: 256 },
                    parts: [{ x: 0, w: 168, h: 166 }, { x: 168, w: 101, h: 385 }, { x: 269, w: 169, h: 166 }],
                    lit: { when: 'dark', light: 'DIAL', masks: ['wash', 'glow'], halos: [[217, 159]] } },

    // Station furniture (stands behind its station; see above). The whiteboard hangs on the wall,
    // the bed is seen from above, its ground point mid-length so it lies over its station cell
    desk:              { image: 'sprites/props/computer_desk_loop.png', loop: { frames: 4, fps: 3 },      footprint: { w: 64, h: 12 },
                         lit: { when: 'room', masks: ['glow'] } },   // its screen glows while its room is lit
    terminal:          { image: 'sprites/props/library_terminal.png',   footprint: { w: 48, h: 12 },
                         lit: { when: 'room', masks: ['glow'] } },
    labBench:          { image: 'sprites/props/lab_bench.png',          footprint: { w: 132, h: 12 } },
    officeDesk:        { image: 'sprites/props/office_desk.png',        footprint: { w: 96, h: 12 } },
    registrationDesk:  { image: 'sprites/props/registration_desk.png',  footprint: { w: 104, h: 12 } },
    dormDesk:          { image: 'sprites/props/dorm_desk.png',          footprint: { w: 80, h: 12 } },
    bed:               { image: 'sprites/props/bed.png', foot: { y: 28 }, footprint: { w: 44, h: 48 } },
    whiteboard:        { image: 'sprites/props/whiteboard.png' },
    cafeCounter:       { image: 'sprites/props/cafe_counter_loop.png', loop: { frames: 6, fps: 6 },       footprint: { w: 128, h: 12 } },
    bookstoreRegister: { image: 'sprites/props/bookstore_register.png', footprint: { w: 96, h: 12 } },
    sandwichCounter:   { image: 'sprites/props/sandwich_counter.png',   footprint: { w: 168, h: 12 } },
    cafeTable:         { image: 'sprites/props/cafe_table.png',         footprint: { w: 64, h: 20 } },
    // A classroom desk is two props, seen from behind: the chair in front (the seat, at the
    // station's seat base) and the desk beyond it, based on its cell's top edge so it sorts behind
    // whoever sits in the chair; together they draw as the one approved pair. The pair is 51 rows,
    // the chair (31) its bottom rows from row 20, the desk (41) its top: the chair's base is 28 art
    // px below the cell's top edge, so the desk's ground point is 51 - 28 = 23 rows down it. A sitter
    // faces north, to the board
    classroomDesk:     { image: 'sprites/props/classroom_desk.png', foot: { y: 51 - 28 } },
    classroomChair:    { image: 'sprites/props/classroom_chair.png', seat: true },
    bookTable:         { image: 'sprites/props/book_table.png',         footprint: { w: 100, h: 20 } },
    menuBoard:         { image: 'sprites/props/menu_board.png',         footprint: { w: 48, h: 12 } },

    // Larch Hill house fronts (houseFronts in maps/campus.js). The porch is steps you walk up
    porch:         { image: 'sprites/props/porch.png' },
    picketFence:   { image: 'sprites/props/picket_fence.png', footprint: { w: 64, h: 12 } },
    mailbox:       { image: 'sprites/props/mailbox.png',      footprint: { w: 16, h: 12 } },

    // The waterfront: on the water, so the water itself blocks
    dockFloat:     { image: 'sprites/props/dock_float.png', foot: { y: 31 } },
    piling:        { image: 'sprites/props/piling.png' },
    boat:          { image: 'sprites/props/boat_loop.png', loop: { frames: 4, fps: 2 } },
    tug:           { image: 'sprites/props/tug_loop.png', loop: { frames: 4, fps: 2 } },

    // Street dressing. A board's footprint sits in the wall row it stands against. A street lamp's
    // globes glow while the lamps are on, with a halo each, and it throws a pool at its foot
    // (design/day-night.md §2.2)
    lampPost:      { image: 'sprites/props/lamp_post.png',      footprint: { w: 16, h: 12 },
                     lit: { when: 'dark', light: 'LAMP', masks: ['glow'], halos: [[4, 3], [16, 3]] } },
    // the Grand Staircase's lamps carry the university's banners, one each side of the post
    lampPostBanner:{ image: 'sprites/props/lamp_post_banner.png', footprint: { w: 16, h: 12 },
                     lit: { when: 'dark', light: 'LAMP', masks: ['glow'], halos: [[4, 3], [16, 3]] } },
    crossbuck:    { image: 'sprites/props/crossbuck.png',      footprint: { w: 16, h: 12 } },
    bulletinBoard: { image: 'sprites/props/bulletin_board.png', footprint: { w: 64, h: 12 } },

    // The Ballast. Bell and sign hang on walls, so they don't block
    // Based 8 art px below its image (placed 16 px lower, so it draws where it did): its footprint
    // then lies in the customers' row, and the row behind it stays open for Finn, out at the west end
    barCounter:    { image: 'sprites/props/bar_counter.png',    foot: { y: 37 + 8 }, footprint: { w: 224, h: 16 } },
    pubBooth:      { image: 'sprites/props/pub_booth.png',      footprint: { w: 96, h: 24 } },
    jukebox:       { image: 'sprites/props/jukebox_loop.png', loop: { frames: 4, fps: 4 },        footprint: { w: 56, h: 16 },
                     lit: { when: 'room', light: 'JUKEBOX', masks: ['glow'] } },
    shipsBell:     { image: 'sprites/props/ships_bell.png', hung: true },   // at the wall's base: no hang to scale, but it fades with the wall
    neonSign:      { image: 'sprites/props/neon_sign_loop.png', loop: { frames: 6, fps: 4 }, ...hangOn(25, 32),   // on the brick, a row above the wainscot
                     lit: { when: 'room', light: 'NEON', masks: ['glow'], halos: [[10, 12]] } },

    // Library. The gantry stands over the reading tables; people pass under it
    readingTable:  { image: 'sprites/props/reading_table.png',  footprint: { w: 112, h: 20 } },
    cardCatalogue: { image: 'sprites/props/card_catalogue.png', footprint: { w: 56, h: 16 } },
    craneGantry:   { image: 'sprites/props/crane_gantry.png' },

    // Revision 3.1 rooms (design/campus-layout.md §6.6). A wall piece hangs on a back wall: its
    // ground point sits below the image by how high it hangs. The rug is a floor decal, its ground
    // point on its top edge, so anyone standing on it draws over it
    sofa:            { image: 'sprites/props/sofa.png',             footprint: { w: 112, h: 20 } },
    armchair:        { image: 'sprites/props/armchair.png',         footprint: { w: 64, h: 20 } },
    miniFridge:      { image: 'sprites/props/mini_fridge.png',      footprint: { w: 36, h: 12 } },
    wardrobe:        { image: 'sprites/props/wardrobe.png',         footprint: { w: 72, h: 16 } },
    vendingMachine:  { image: 'sprites/props/vending_machine_loop.png', loop: { frames: 8, fps: 6 },  footprint: { w: 52, h: 16 } },
    waitingChairs:   { image: 'sprites/props/waiting_chairs.png',   footprint: { w: 188, h: 20 } },
    queueStanchions: { image: 'sprites/props/queue_stanchions.png', footprint: { w: 110, h: 12 } },
    formsRack:       { image: 'sprites/props/forms_rack.png',       footprint: { w: 40, h: 12 } },
    filingCabinet:   { image: 'sprites/props/filing_cabinet.png',   footprint: { w: 40, h: 12 } },
    lectern:         { image: 'sprites/props/lectern.png',          footprint: { w: 40, h: 12 } },
    projectorCart:   { image: 'sprites/props/projector_cart.png',   footprint: { w: 48, h: 12 } },
    circulationDesk: { image: 'sprites/props/circulation_desk.png', footprint: { w: 164, h: 16 } },
    studyCarrel:     { image: 'sprites/props/study_carrel.png',     footprint: { w: 64, h: 16 } },
    pastryCase:      { image: 'sprites/props/pastry_case.png',      footprint: { w: 88, h: 16 } },
    rug:             { image: 'sprites/props/rug.png', foot: { y: 0 } },
    mailPigeonholes: { image: 'sprites/props/mail_pigeonholes.png', ...hangOn(46, 8) },
    payphone:        { image: 'sprites/props/payphone.png',         ...hangOn(40, 10) },
    pulldownScreen:  { image: 'sprites/props/pulldown_screen.png' },
    wallClock:       { image: 'sprites/props/wall_clock.png',       ...hangOn(16, 30) },

    // The vacant lot (lotFence in maps/campus.js). The fence blocks but for its gate
    chainlinkFence:  { image: 'sprites/props/chainlink_fence.png',  footprint: { w: 64, h: 12 } },
    chainlinkPost:   { image: 'sprites/props/chainlink_post.png' },
    forSaleSign:     { image: 'sprites/props/for_sale_sign.png',    footprint: { w: 48, h: 12 } },

    // Revision 3.1 P2 (§6.6). Homes and House 6
    kitchenCounter:  { image: 'sprites/props/kitchen_counter.png',  footprint: { w: 184, h: 16 } },
    kitchenTable:    { image: 'sprites/props/kitchen_table.png',    footprint: { w: 64, h: 16 } },
    floorLamp:       { image: 'sprites/props/floor_lamp.png',       footprint: { w: 24, h: 12 },
                       lit: { when: 'room', light: 'SMALL' } },
    crtTv:           { image: 'sprites/props/crt_tv_loop.png', loop: { frames: 4, fps: 3 },           footprint: { w: 60, h: 12 } },
    housePlant:      { image: 'sprites/props/house_plant.png',      footprint: { w: 40, h: 12 } },
    floorClutter:    { image: 'sprites/props/floor_clutter.png',    footprint: { w: 56, h: 12 } },
    wallPoster:      { image: 'sprites/props/wall_poster.png',      ...hangOn(36, 20) },
    movingBoxes:     { image: 'sprites/props/moving_boxes.png',     footprint: { w: 76, h: 16 } },
    dustSheetSofa:   { image: 'sprites/props/dust_sheet_sofa.png',  footprint: { w: 112, h: 20 } },
    stepladder:      { image: 'sprites/props/stepladder.png',       footprint: { w: 44, h: 12 } },
    paintTins:       { image: 'sprites/props/paint_tins.png' },
    // The Ballast
    pubStage:        { image: 'sprites/props/pub_stage.png',        footprint: { w: 176, h: 20 }, stand: { x: 60, y: 36 } },   // right of the mic
    barStool:        { image: 'sprites/props/bar_stool.png',        footprint: { w: 24, h: 12 } },
    dartboard:       { image: 'sprites/props/dartboard.png',        ...hangOn(24, 26) },
    // Labs, the Writing Center, offices
    opticsTable:     { image: 'sprites/props/optics_table.png',     footprint: { w: 120, h: 16 } },
    vanDeGraaff:     { image: 'sprites/props/van_de_graaff.png',    footprint: { w: 48, h: 12 } },
    oscilloscopeCart:{ image: 'sprites/props/oscilloscope_cart_loop.png', loop: { frames: 6, fps: 8 }, footprint: { w: 56, h: 12 } },
    fumeHood:        { image: 'sprites/props/fume_hood.png',        footprint: { w: 76, h: 16 } },
    labFridge:       { image: 'sprites/props/lab_fridge.png',       footprint: { w: 44, h: 12 } },
    skeleton:        { image: 'sprites/props/skeleton.png',         footprint: { w: 36, h: 12 } },
    // A tutoring table is three props (cut losslessly from the approved image): the table with its
    // far chairs, based a row behind its front chairs (foot y 11) so its footprint closes the row
    // behind them and whoever sits in a front chair sorts between it and the chair; and the two
    // front chairs, seats (tutoringTable() in maps/campus.js places all three)
    tutoringTable:   { image: 'sprites/props/tutoring_table.png',   foot: { y: 11 }, footprint: { w: 120, h: 12 } },
    tutoringChairL:  { image: 'sprites/props/tutoring_chair_l.png', seat: true },
    tutoringChairR:  { image: 'sprites/props/tutoring_chair_r.png', seat: true },
    signinStand:     { image: 'sprites/props/signin_stand.png',     footprint: { w: 32, h: 12 } },
    laserPrinter:    { image: 'sprites/props/laser_printer.png',    footprint: { w: 48, h: 12 } },
    serverRack:      { image: 'sprites/props/server_rack_loop.png', loop: { frames: 8, fps: 8 },      footprint: { w: 52, h: 16 } },
    photocopier:     { image: 'sprites/props/photocopier.png',      footprint: { w: 60, h: 16 } },
    coffeeCounter:   { image: 'sprites/props/coffee_counter.png',   footprint: { w: 96, h: 16 } },
    coatRack:        { image: 'sprites/props/coat_rack.png',        footprint: { w: 32, h: 12 } },
    // Shops
    magazineRack:    { image: 'sprites/props/magazine_rack.png',    footprint: { w: 64, h: 12 } },
    spinnerRack:     { image: 'sprites/props/spinner_rack.png',     footprint: { w: 36, h: 12 } },
    textbookBins:    { image: 'sprites/props/textbook_bins.png',    footprint: { w: 104, h: 16 } },
    drinksCooler:    { image: 'sprites/props/drinks_cooler.png',    footprint: { w: 56, h: 16 } },
    windowCounter:   { image: 'sprites/props/window_counter.png',   footprint: { w: 152, h: 12 } },
    chipRack:        { image: 'sprites/props/chip_rack.png',        footprint: { w: 36, h: 12 } },
    // The old hotel. A crate on top of another is lifted by the lower one's front face (the image's
    // bottom 32 rows, under its 13-row lid), so it stands flush on the lower one's lid
    hotelDesk:       { image: 'sprites/props/hotel_desk.png',       footprint: { w: 176, h: 16 } },
    stackedChairs:   { image: 'sprites/props/stacked_chairs.png',   footprint: { w: 32, h: 12 } },
    crate:           { image: 'sprites/props/crate.png',            footprint: { w: 60, h: 16 } },
    crateOnTop:      { image: 'sprites/props/crate.png',            foot: { y: 45 + 32 } },
    // Ruins and the vacant lot: seen through the cutaway or walked over, so they don't block
    rubblePile:      { image: 'sprites/props/rubble_pile.png' },
    fallenBeam:      { image: 'sprites/props/fallen_beam.png' },
    weedClump:       { image: 'sprites/props/weed_clump.png' },
    // Outdoors. The railing tiles like the picket fence, its post at its west end, so a run's
    // east end takes a post cut from the same image; it doesn't block, as the water does. Its
    // ground point is 4 art px under the image, in the seawall row, so anyone on the Esplanade
    // (however close) draws behind it. The gangway runs from the seawall's coping onto the
    // floats, its ground point under its toe plate so it draws over the float it rests on
    parkBench:       { image: 'sprites/props/park_bench.png',       footprint: { w: 112, h: 16 } },
    bikeRack:        { image: 'sprites/props/bike_rack.png',        footprint: { w: 120, h: 16 } },
    planter:         { image: 'sprites/props/concrete_planter.png', footprint: { w: 52, h: 16 } },
    drinkingFountain:{ image: 'sprites/props/drinking_fountain_loop.png', loop: { frames: 4, fps: 4 }, footprint: { w: 36, h: 12 } },
    seawallRailing:  { image: 'sprites/props/seawall_railing.png', foot: { y: 42 + 4 } },
    seawallRailPost: { image: 'sprites/props/seawall_railing.png', foot: { y: 42 + 4 }, parts: [{ x: 0, w: 4 }] },
    mooringBollard:  { image: 'sprites/props/mooring_bollard.png',  footprint: { w: 24, h: 12 } },
    gangway:         { image: 'sprites/props/gangway.png',          foot: { y: 44 + 21 } },

    // P3 room fill (ART.md §2). Seats have no footprint, like the classroom chair: a chair or stool
    // stands south of its desk or bench, its back to the viewer (seatsAt in maps/campus.js). The
    // cubicle partition tiles like the railing, its post at its west end; a run's east end takes
    // the end post
    officeChair:       { image: 'sprites/props/office_chair.png', seat: true },
    labStool:          { image: 'sprites/props/lab_stool.png' },
    seminarChair:      { image: 'sprites/props/seminar_chair.png' },
    hightopTable:      { image: 'sprites/props/hightop_table.png',      footprint: { w: 44, h: 12 } },
    cubiclePartition:  { image: 'sprites/props/cubicle_partition.png',  footprint: { w: 64, h: 8 } },
    cubiclePartitionEnd: { image: 'sprites/props/cubicle_partition_end.png' },
    waterCooler:       { image: 'sprites/props/water_cooler.png',       footprint: { w: 40, h: 12 } },
    ficus:             { image: 'sprites/props/ficus.png',              footprint: { w: 44, h: 12 } },
    wasteBin:          { image: 'sprites/props/waste_bin.png',          footprint: { w: 24, h: 10 } },
    recyclingBin:      { image: 'sprites/props/recycling_bin.png',      footprint: { w: 28, h: 10 } },
    globe:             { image: 'sprites/props/globe.png',              footprint: { w: 40, h: 12 } },
    fileBoxes:         { image: 'sprites/props/file_boxes.png',         footprint: { w: 56, h: 12 } },
    equipmentCabinet:  { image: 'sprites/props/equipment_cabinet.png',  footprint: { w: 64, h: 16 } },
    labSink:           { image: 'sprites/props/lab_sink.png',           footprint: { w: 64, h: 16 } },
    // ── New assets A: the street (design/new-assets.md) ─────────────────────────────────────
    // Decals: leaf litter, puddles (a 2-frame ripple), sidewalk wear, the manhole and drain, moss
    leavesScatter:   { image: 'sprites/props/leaves_scatter.png', decal: true, seasons: ['winter', 'summer'] },
    leavesDrift:     { image: 'sprites/props/leaves_drift.png', decal: true, seasons: ['winter', 'summer'] },
    leavesClump:     { image: 'sprites/props/leaves_clump.png', decal: true, seasons: ['winter', 'summer'] },
    leavesFew:       { image: 'sprites/props/leaves_few.png', decal: true, seasons: ['winter', 'summer'] },
    petalsScatter:   { image: 'sprites/props/petals_scatter.png', decal: true },   // spring, under and beside the cherries
    petalsFew:       { image: 'sprites/props/petals_few.png', decal: true },
    petalsDrift:     { image: 'sprites/props/petals_drift.png', decal: true },
    // Lamplight on the water under an Esplanade lamp (design/day-night.md §5): a lit decal is light,
    // not ground, so it's drawn only while it's lit, added over the shaded ground
    lampReflection:  { image: 'sprites/props/lamp_reflection_loop.png', loop: { frames: 4, fps: 3, withTile: true }, decal: true,
                       lit: { when: 'dark' } },   // in step with the water under it (WATER_LOOP: 4 frames at 3 fps)
    // A puddle glints in a pool of light at night (`glints`: Lighting)
    puddleSmall:     { image: 'sprites/props/puddle_small_loop.png', loop: { frames: 2, fps: 1 }, decal: true, glints: true },
    puddleMedium:    { image: 'sprites/props/puddle_medium_loop.png', loop: { frames: 2, fps: 1 }, decal: true, glints: true },
    puddleLarge:     { image: 'sprites/props/puddle_large_loop.png', loop: { frames: 2, fps: 1 }, decal: true, glints: true },
    wearCrack:       { image: 'sprites/props/wear_crack.png', decal: true },
    wearPatch:       { image: 'sprites/props/wear_patch.png', decal: true },
    wearStain:       { image: 'sprites/props/wear_stain.png', decal: true },
    manhole:         { image: 'sprites/props/manhole.png', decal: true },
    stormDrain:      { image: 'sprites/props/storm_drain.png', decal: true },
    // Cascade Avenue's street (layout 3.2): asphalt wear, the markings, and what stands on it
    asphaltPatch:    { image: 'sprites/props/asphalt_patch.png', decal: true },
    asphaltCrack:    { image: 'sprites/props/asphalt_crack.png', decal: true },
    asphaltOil:      { image: 'sprites/props/asphalt_oil.png', decal: true },
    lineDoubleYellow:{ image: 'sprites/props/line_double_yellow.png', decal: true },
    bayTick:         { image: 'sprites/props/bay_tick.png', decal: true },
    bayTickEnd:      { image: 'sprites/props/bay_tick_end.png', decal: true },
    crosswalkLeft:   { image: 'sprites/props/crosswalk_left.png', decal: true },
    crosswalkMid:    { image: 'sprites/props/crosswalk_mid.png', decal: true },
    crosswalkRight:  { image: 'sprites/props/crosswalk_right.png', decal: true },
    parkingMeter:    { image: 'sprites/props/parking_meter.png',  footprint: { w: 12, h: 8 } },
    busStopSign:     { image: 'sprites/props/bus_stop_sign.png',  footprint: { w: 12, h: 8 } },
    busShelter:      { image: 'sprites/props/bus_shelter.png',    footprint: { w: 230, h: 16 },   // cols 28-31 of its row
                       lit: { when: 'dark', light: 'SHELTER', masks: ['glow'], at: [53, 90] } },   // the ad panel, the roof strip
    // Parked side-on, facing west, in a 5 x 2 bay: based on the bay's back line so the footprint
    // covers the parking lane's two rows, drawn 12 art px lower so the wheels sit on the drawn
    // lane (the street draws a half row south of its cells, maps/autotile.js)
    carWagonSide:    { image: 'sprites/props/car_wagon_side.png',     foot: { y: 51 - 12 }, footprint: { w: 300, h: 116 } },
    carHatchbackSide:{ image: 'sprites/props/car_hatchback_side.png', foot: { y: 58 - 12 }, footprint: { w: 300, h: 116 } },
    carPickupSide:   { image: 'sprites/props/car_pickup_side.png',    foot: { y: 56 - 12 }, footprint: { w: 300, h: 116 } },
    carSedanSide:    { image: 'sprites/props/car_sedan_side.png',     foot: { y: 52 - 12 }, footprint: { w: 300, h: 116 } },
    mossWallfoot:    { image: 'sprites/props/moss_wallfoot.png', decal: true },
    mossPatch:       { image: 'sprites/props/moss_patch.png', decal: true },
    mossCrevice:     { image: 'sprites/props/moss_crevice.png', decal: true },
    // Street furniture
    newsboxDaily:    { image: 'sprites/props/newsbox_daily.png',      footprint: { w: 36, h: 12 } },
    newsboxWeekly:   { image: 'sprites/props/newsbox_weekly.png',     footprint: { w: 32, h: 12 } },
    newsboxRealestate:{ image: 'sprites/props/newsbox_realestate.png', footprint: { w: 36, h: 12 } },
    streetTrashCan:  { image: 'sprites/props/street_trash_can.png',   footprint: { w: 40, h: 12 } },
    hydrant:         { image: 'sprites/props/hydrant.png',            footprint: { w: 24, h: 10 } },
    postalBox:       { image: 'sprites/props/postal_box.png',         footprint: { w: 44, h: 12 } },
    payphonePedestal:{ image: 'sprites/props/payphone_pedestal.png',  footprint: { w: 24, h: 10 } },
    posterKiosk:     { image: 'sprites/props/poster_kiosk.png',       footprint: { w: 56, h: 16 } },
    // Street-name signs: a blade on a pole, the pole at each image's centre (its default foot)
    streetSignLarch:    { image: 'sprites/props/street_sign_larch.png',    footprint: { w: 12, h: 8 } },
    streetSignSpruce:   { image: 'sprites/props/street_sign_spruce.png',   footprint: { w: 12, h: 8 } },
    streetSignTerminal: { image: 'sprites/props/street_sign_terminal.png', footprint: { w: 12, h: 8 } },
    streetSignExchange: { image: 'sprites/props/street_sign_exchange.png', footprint: { w: 12, h: 8 } },
    streetSignCascade:  { image: 'sprites/props/street_sign_cascade.png',  footprint: { w: 12, h: 8 } },
    // Shop fronts: blade signs on brackets and awnings. On a south front (the bookstore, the café,
    // the sandwich shop) they hang outside, over the sidewalk just south of the sill, in the overhead
    // pass, so people walk under them. The Ballast's stands on its own post at Spruce's south edge,
    // across its back strip (design/doors.md §3), its foot the post's (x 0..2) base
    bladeBookstore:  { image: 'sprites/props/blade_bookstore.png', overhead: true },
    bladeCafe:       { image: 'sprites/props/blade_cafe.png',      overhead: true },
    bladeBallast:    { image: 'sprites/props/blade_ballast.png',   foot: { x: 1 }, footprint: { w: 8, h: 8 },
                       lit: { when: 'The Ballast', masks: ['glow'] } },   // the one lit sign on the street, while the pub's open
    bladeSandwich:   { image: 'sprites/props/blade_sandwich.png',  overhead: true },
    awningBookstore: { image: 'sprites/props/awning_bookstore.png', overhead: true },
    awningSandwich:  { image: 'sprites/props/awning_sandwich.png',  overhead: true },
    // The Customs House flag on its pole. The flag is its own prop, its hoist at the pole's (x 4, y
    // 6), based just behind the pole. (The birds are critters: params.CRITTERS)
    flagpole:        { image: 'sprites/props/flagpole.png', footprint: { w: 16, h: 8 } },
    flagUs:          { image: 'sprites/props/flag_us_loop.png', loop: { frames: 6, fps: 6 }, foot: { x: 0, y: 154 + 1 } },
    // ── New assets B: the waterfront and edges ───────────────────────────────────────────────
    lifeRing:        { image: 'sprites/props/life_ring.png',        footprint: { w: 24, h: 10 } },
    coinBinoculars:  { image: 'sprites/props/coin_binoculars.png',  footprint: { w: 24, h: 10 } },
    interpretivePlaque:{ image: 'sprites/props/interpretive_plaque.png', footprint: { w: 48, h: 10 } },
    espressoCart:    { image: 'sprites/props/espresso_cart.png',    footprint: { w: 76, h: 16 } },
    mooringCleat:    { image: 'sprites/props/mooring_cleat.png' },
    logBoom:         { image: 'sprites/props/log_boom.png' },
    navBuoy:         { image: 'sprites/props/nav_buoy_loop.png', loop: { frames: 4, fps: 2 } },
    skiff:           { image: 'sprites/props/skiff_loop.png',    loop: { frames: 4, fps: 2 } },
    kayak:           { image: 'sprites/props/kayak.png', foot: { y: 15 + 7 } },   // based just past its float, lying on it
    brambleA:        { image: 'sprites/props/bramble_a.png', seasons: ['winter', 'summer', 'snow'] },
    brambleB:        { image: 'sprites/props/bramble_b.png', seasons: ['winter', 'summer', 'snow'] },
    nurseLog:        { image: 'sprites/props/nurse_log.png' },
    mushrooms:       { image: 'sprites/props/mushrooms.png' },
    mossyBoulder:    { image: 'sprites/props/mossy_boulder.png',    footprint: { w: 56, h: 16 } },
    garbageCart:     { image: 'sprites/props/garbage_cart.png',     footprint: { w: 28, h: 10 } },
    recyclingCart:   { image: 'sprites/props/recycling_cart.png',   footprint: { w: 28, h: 10 } },
    hedgeClipped:    { image: 'sprites/props/hedge_clipped.png',    footprint: { w: 108, h: 12 } },
    hedgeLaurel:     { image: 'sprites/props/hedge_laurel.png',     footprint: { w: 116, h: 12 } },
    utilityPole:     { image: 'sprites/props/utility_pole.png',     footprint: { w: 16, h: 8 } },
    clusterMailbox:  { image: 'sprites/props/cluster_mailbox.png',  footprint: { w: 48, h: 12 } },
    raisedBed:       { image: 'sprites/props/raised_bed.png',       footprint: { w: 100, h: 24 }, seasons: ['winter', 'spring'] },
    entranceSign:    { image: 'sprites/props/entrance_sign.png',    footprint: { w: 256, h: 16 } },   // "University of Wonderwood"
    wMonument:       { image: 'sprites/props/uw_monument.png',      footprint: { w: 128, h: 16 },   // the big W: 2 cells wide, 1 deep
                       lit: { when: 'dark', light: 'UPLIGHT' } },   // two uplights in the lawn wash its face
    signpost:        { image: 'sprites/props/signpost.png',         footprint: { w: 12, h: 8 } },
    railSign:        { image: 'sprites/props/rail_crossbuck.png',   footprint: { w: 12, h: 8 } },   // "look both ways"
    trafficCone:     { image: 'sprites/props/traffic_cone.png',     footprint: { w: 20, h: 8 } },
    sawhorse:        { image: 'sprites/props/sawhorse.png',         footprint: { w: 76, h: 10 } },
    // Wall decals on a front's façade band, like the awnings: just above their base on the
    // building's front line
    wheatpastePosters: { image: 'sprites/props/wheatpaste_posters.png', foot: { y: 27 + 6 } },
    wallTags:          { image: 'sprites/props/tags.png',               foot: { y: 32 + 2 } },

    // ── New assets C: the rooms ─────────────────────────────────────────────────────────────
    backBar:         { image: 'sprites/props/back_bar.png' },   // on the back wall behind the bar
    posterPeriodicTable: { image: 'sprites/props/poster_periodic_table.png', ...hangOn(32, 20) },
    posterEmSpectrum:    { image: 'sprites/props/poster_em_spectrum.png',    ...hangOn(32, 20) },
    floppyBoxes:     { image: 'sprites/props/floppy_boxes.png',  foot: { y: 12 + 20 } },   // on a desk top
    signY2kReady:    { image: 'sprites/props/sign_y2k_ready.png', ...hangOn(24, 20) },
    takeANumber:     { image: 'sprites/props/take_a_number.png', footprint: { w: 16, h: 8 } },
    signNowServing:  { image: 'sprites/props/sign_now_serving.png', ...hangOn(16, 34) },   // high, over the counter
    bookReturn:      { image: 'sprites/props/book_return.png',   foot: { y: 26 + 4 } },       // on the front band
    diplomaBlack:    { image: 'sprites/props/diploma_black.png', ...hangOn(16, 30) },
    diplomaWood:     { image: 'sprites/props/diploma_wood.png',  ...hangOn(16, 30) },
    lavaLamp:        { image: 'sprites/props/lava_lamp_loop.png', loop: { frames: 4, fps: 2 }, foot: { y: 20 + 22 },   // on a desk top
                       lit: { when: 'room', light: 'SMALL', masks: ['glow'] } },

    // Parked cars, rear view, nose-in
    carWagon:        { image: 'sprites/props/car_wagon.png',     footprint: { w: 100, h: 40 } },
    carHatchback:    { image: 'sprites/props/car_hatchback.png', footprint: { w: 100, h: 40 } },
    carPickup:       { image: 'sprites/props/car_pickup.png',    footprint: { w: 104, h: 40 } },
    carSedan:        { image: 'sprites/props/car_sedan.png',     footprint: { w: 108, h: 40 } },

    aquarium:          { image: 'sprites/props/aquarium_loop.png', loop: { frames: 8, fps: 6 },           footprint: { w: 64, h: 16 } },
    eyewashStation:    { image: 'sprites/props/eyewash_station.png',    footprint: { w: 32, h: 12 } },
    rollingWhiteboard: { image: 'sprites/props/rolling_whiteboard.png', footprint: { w: 64, h: 12 } },
    islandBookshelf:   { image: 'sprites/props/island_bookshelf.png',   footprint: { w: 100, h: 16 } },
    cardSpinner:       { image: 'sprites/props/card_spinner.png',       footprint: { w: 24, h: 12 } },
    roundRug:          { image: 'sprites/props/round_rug.png', foot: { y: 0 } },

    // Audit art (design/quality-audit.md). The faculty houses' wooden double bed is seen from
    // above, its ground point mid-length like the dorm bed's; then each resident's own things
    // (#5), wall pieces hung like the poster
    bedDouble:         { image: 'sprites/props/bed_double.png', foot: { y: 26 }, footprint: { w: 60, h: 48 } },
    labBenchPhysics:   { image: 'sprites/props/lab_bench_physics.png', footprint: { w: 132, h: 12 } },
    doormat:           { image: 'sprites/props/doormat.png', foot: { y: 0 } },
    crtManuals:        { image: 'sprites/props/crt_manuals.png',      footprint: { w: 44, h: 12 } },
    telescope:         { image: 'sprites/props/telescope.png',        footprint: { w: 40, h: 12 } },
    framedEquation:    { image: 'sprites/props/framed_equation.png',  ...hangOn(24, 28) },
    loom:              { image: 'sprites/props/loom.png',             footprint: { w: 64, h: 16 } },
    bandPosterA:       { image: 'sprites/props/band_poster_a.png',    ...hangOn(34, 20) },
    bandPosterB:       { image: 'sprites/props/band_poster_b.png',    ...hangOn(34, 20) },
    bicycle:           { image: 'sprites/props/bicycle.png',          footprint: { w: 120, h: 12 } },
    picnicCooler:      { image: 'sprites/props/cooler.png',           footprint: { w: 52, h: 12 } },
    whiteboardModel:   { image: 'sprites/props/whiteboard_model.png', footprint: { w: 120, h: 12 } },
    typewriterTable:   { image: 'sprites/props/typewriter_table.png', footprint: { w: 60, h: 12 } },
    monitorCans:       { image: 'sprites/props/monitor_cans.png',     footprint: { w: 60, h: 12 } },
    seedcapRack:       { image: 'sprites/props/seedcap_rack.png',     ...hangOn(28, 30) },
    statsBooks:        { image: 'sprites/props/stats_books.png',      footprint: { w: 44, h: 12 } },
    fieldBoots:        { image: 'sprites/props/field_boots.png',      footprint: { w: 52, h: 10 } },
    easel:             { image: 'sprites/props/easel.png',            footprint: { w: 44, h: 12 } },
    chessTable:        { image: 'sprites/props/chess_table.png',      footprint: { w: 60, h: 16 } },
};

// The tree standing in a tree cell, picked by cellHash (bits apart from the grass mirror's)
// from the first of level.treeZones that holds the cell, else from TREE_TYPES. Where no tree
// fits, a shrub from SHRUB_TYPES (listed by weight: a rhododendron half as often as the others)
const TREE_TYPES = ['fir', 'fir', 'tallFir', 'maple'];
const SHRUB_TYPES = ['swordFern', 'swordFern', 'salal', 'salal', 'rhododendron'];

// The tree zone a cell is in: the first of level.treeZones that holds it, else undefined
const treeZone = (level, c, r) => level.treeZones.find(z => c >= z.c && c < z.c + z.w && r >= z.r && r < z.r + z.h);

// Every prop on a level as { type, part, box, solid }: a tree standing in each tree cell (the
// cell itself blocks, as before), plus the placements in level.props ({ type, x, y } = base
// point, or { type, station } for a station's prop), one per part for a prop with parts.
// No tree covers a room (ART.md §5): a tree cell takes the first of its types, from the hashed
// one on, whose drawn sprite stays clear of every building's floor (a stand's trees stand off-grid
// and leave gaps; see below). Failing that it takes a shrub,
// nudged up to 4 px off the grid so a run doesn't read as a hedge, but one such cell in five is
// left bare, its ground showing among the shrubs
function levelProps(level) {
    const ts = level.tileSize;
    const floors = level.buildings.map(b =>
        ({ x: (b.col + 1) * ts, y: (b.row + 1) * ts, w: (b.width - 2) * ts, h: (b.height - 2) * ts }));
    const clear = (type, box, clipY) => {
        const drawn = spriteBox({ position: box, drawWidth: box.w, drawHeight: box.h, sprite: propSprite(type), clipY });
        return !floors.some(f => boxesOverlap(drawn, f));
    };
    const props = [];
    level.tiles.forEach((row, r) => row.forEach((tile, c) => {
        if (tile !== params.TILES.TREE) return;
        const zone  = treeZone(level, c, r);
        const types = zone ? zone.types : TREE_TYPES;
        const first = (cellHash(c, r) >>> 8) % types.length;
        // The top edge's trees stand a row lower, cut off at the foot of the map's top row, so
        // the edge shows their crowns rather than their trunks (audit #10)
        const sink  = r === 0 ? ts : 0, clipY = sink ? ts : undefined;
        const box   = { x: c * ts, y: r * ts + sink, w: ts, h: ts };
        const h = cellHash(c, r);
        // A zone that's a stand of trees (`stand`) reads as one, not a grid: each tree stands off
        // its cell's centre, and some cells are gaps showing ground, more at its edges than inside
        if (zone && zone.stand) {
            const edge = c === zone.c || r === zone.r || c === zone.c + zone.w - 1 || r === zone.r + zone.h - 1;
            if ((h >>> 20) % (edge ? 3 : 8) === 0) return;
            box.x += cellHash(c, r + 101) % 29 - 14;
            box.y += cellHash(c + 101, r) % 21 - 10;
        }
        if (zone && zone.dx) box.x += zone.dx;   // a zone's trees can stand off their cells' centres
        const type  = types.map((_, i) => types[(first + i) % types.length]).find(t => clear(t, box, clipY));
        if (type) return props.push({ type, box, solid: false, clipY });
        if ((h >>> 4) % 5 === 0) return;
        const nudged = { ...box, x: box.x + (h >>> 12) % 9 - 4, y: box.y + (h >>> 16) % 9 - 4 };
        const shrub  = hashPick(SHRUB_TYPES, c, r);
        if (clear(shrub, nudged)) props.push({ type: shrub, box: nudged, solid: false });
    }));
    return [...props, ...placedProps(level, level.props)];
}

// Placements ({ type, x, y } = base point, or { type, station } for a station's prop) as props,
// one per part for a prop with parts: the level's own, and the street's decals for the season
// (SeasonSystem)
function placedProps(level, placements) {
    return placements.flatMap(p => {
        const { type } = p;
        const { x, y } = p.station ? stationBase(level, p.station, PROP_TYPES[type].seat) : p;
        const { w, h } = PROP_TYPES[type].footprint || { w: 0, h: 0 };
        const box = { x: x - w / 2, y: y - h, w, h };
        const parts = PROP_TYPES[type].parts || [undefined];
        return parts.map((part, i) => ({ type, part, box, solid: i === 0 && w > 0 && h > 0 }));
    });
}

// A prop's sprite: its image for the look ([weather, season]; seasonalImage), frame 0 of a loop's
// strip, or one part's columns of it (the bottom h rows). A part keeps the whole image's ground
// point, so the parts stand together on one base point. A variant keeps its base image's canvas,
// so the sprite's frame and foot hold in every look
function propSprite(type, part, look = []) {
    const def   = PROP_TYPES[type];
    const image = ASSET_MANAGER.getAsset(seasonalImage(def, look));
    const foot  = def.foot || {};
    const frameW = image.width / (def.loop ? def.loop.frames : 1);
    const { x, w, h } = { x: 0, w: frameW, h: image.height, ...part };
    const y = image.height - h;
    return new Sprite(image, x, y, w, h, (foot.y ?? image.height) - y, (foot.x ?? frameW / 2) - x);
}

// Base point of a station's prop: the top edge of the station's cell (behind it), or for a seat
// just inside its bottom edge
function stationBase(level, id, seat) {
    const ts = level.tileSize;
    const s = level.stations.find(s => s.id === id);
    const c = Math.floor(s.x / ts), r = Math.floor(s.y / ts);
    return { x: c * ts + ts / 2, y: seat ? (r + 1) * ts - 8 : r * ts };
}

// A prop entity: its box is the anchor (base = bottom-centre) and, if solid, its collider. It's
// drawn in the game's look (SeasonSystem redresses it, by its propType, when the look changes)
function createProp(game, { type, part, box, solid, clipY }) {
    const entity = {
        removeFromWorld: false,
        drawWidth:  box.w,
        drawHeight: box.h,
        position:   new Position(box.x, box.y),
        sprite:     propSprite(type, part, lookOf(game)),
        propType:   type,
    };
    if (clipY !== undefined) entity.clipY = clipY;
    if (solid) entity.collider = new Collider(box.w, box.h);
    const loop = PROP_TYPES[type].loop;
    if (loop) {
        const ts = game.currentLevel.tileSize;
        const c = Math.floor((box.x + box.w / 2) / ts), r = Math.floor((box.y + box.h - 1) / ts);
        // in frames: its cell's own, or (`withTile`) the looping tile's it lies on, in step with it
        const tile = loop.withTile && game.tileLayout[r][c];
        entity.loop = { ...loop, phase: tile && tile.loop ? tile.phase : (cellHash(c, r) % 1024) / 1024 * loop.frames };
    }
    if (PROP_TYPES[type].seat) entity.seat = true;              // someone may sit in it (game.seats)
    if (PROP_TYPES[type].stand) entity.stand = PROP_TYPES[type].stand;   // someone may stand on it (game.stands)
    if (PROP_TYPES[type].decal) entity.decal = true;            // drawn in the ground pass, not sorted
    else if (PROP_TYPES[type].overhead) entity.overhead = true; // drawn over everything sorted
    else game.addEntity(entity);
    return entity;
}
