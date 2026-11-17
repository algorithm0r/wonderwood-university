// Characters with PixelLab sheets, by agent name ('player' for the player, whatever name they
// type). Everyone else draws as a colour box. One sheet per state (params.CHAR_STATES gives each
// state's frames and rows, in CHAR_CELL px cells), at sprites/<id>_<state>.png; every character
// has walk, and gains the others as they're approved. `portrait` is the dialogue bust at
// sprites/portraits/<id>.png: a strip of 64 px faces, frame 0 neutral. One who carries an umbrella
// in the rain has `umbrella`: its canopy's image (design/rain.md §4; Rain). See ART.md.
function characterSheets(id, states) {
    const sheets = { walk: `sprites/${id}_walk.png`, portrait: `sprites/portraits/${id}.png` };
    for (const state of states.split(' ').filter(Boolean)) sheets[state] = `sprites/${id}_${state}.png`;
    return sheets;
}

const CHARACTER_SHEETS = {
    'player':           characterSheets('alex_chen', 'idle talk type sit'),   // Alex Chen, the default test student
    'Dr. Marriott':     characterSheets('marriott', 'idle talk type sit'),
    'Dr. Chebib':       characterSheets('jobran', 'idle talk work'),      // Dr. Jobran Chebib
    'Dr. Nair':         characterSheets('nair', 'idle talk sit write'),
    'Dr. Webb':         characterSheets('webb', 'idle talk work'),
    'Alex Okafor':      characterSheets('okafor', 'idle talk sit write'),
    'Dani Reyes':       characterSheets('dani', 'idle talk work'),
    'Ruth George':      characterSheets('ruth', 'idle talk work'),
    'Finn Larsen':      characterSheets('finn', 'idle talk work perform'),
    'Owen Marsh':       characterSheets('owen', 'idle talk work'),
    'Sam Park':         characterSheets('sam', 'idle talk type sit'),
    'Maria Vásquez':    characterSheets('maria', 'idle talk work'),
    'Travis Whitfield': characterSheets('travis', 'idle talk type sit'),
    'Casey Drummond':   characterSheets('casey', 'idle talk sit write'),
    'Dmitri Volkov':    characterSheets('dmitri', 'idle talk work'),
    'Jordan Burman':    characterSheets('jordan', 'idle talk'),
};
// Who carries an umbrella in the rain, and which (design/rain.md §4): the newcomer, the formal, the
// practical and the goth; Tacoma's locals don't bother
const UMBRELLAS = {
    'player': 'blue', 'Dr. Webb': 'black', 'Dr. Nair': 'navy', 'Dr. Chebib': 'golf',
    'Dmitri Volkov': 'black', 'Ruth George': 'red', 'Jordan Burman': 'black',
};
for (const [name, colour] of Object.entries(UMBRELLAS)) CHARACTER_SHEETS[name].umbrella = `sprites/umbrella_${colour}.png`;

// Who wears a coat outdoors in winter, and in which states (design/winter-clothes.md): everyone
// who walks outdoors gets a winter walk, and the player, whom the human stops outdoors, a winter
// idle and talk too. Each is `looks.winter`, a set of sheets by state: the base file with the key
// before .png (ruth_walk.png → ruth_walk_winter.png). A state the set lacks falls back inside it
// (AnimationSystem), so an NPC standing outdoors in winter stands in the winter walk's frame 0
const WINTER_COATS = {
    'player': 'walk idle talk', 'Ruth George': 'walk', 'Owen Marsh': 'walk', 'Dmitri Volkov': 'walk',
    'Dr. Marriott': 'walk', 'Casey Drummond': 'walk', 'Dani Reyes': 'walk', 'Dr. Webb': 'walk',
    'Maria Vásquez': 'walk', 'Travis Whitfield': 'walk', 'Alex Okafor': 'walk', 'Dr. Chebib': 'walk',
    'Sam Park': 'walk', 'Dr. Nair': 'walk',
};
for (const [name, states] of Object.entries(WINTER_COATS)) {
    const sheets = CHARACTER_SHEETS[name];
    sheets.looks = { winter: Object.fromEntries(states.split(' ').map(s => [s, sheets[s].replace(/\.png$/, '_winter.png')])) };
}

// Every image a character's entry draws: its sheets, portrait and umbrella, and each look's sheets
const characterImages = sheets => [...Object.values(sheets).filter(v => typeof v === 'string'),
                                   ...Object.values(sheets.looks || {}).flatMap(Object.values)];
