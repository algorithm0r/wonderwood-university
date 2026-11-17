// SeasonSystem — dresses the campus for the season and the weather (design/seasons.md).
// Each tick it reads the season from the quarter, the weather from the day and whether it's dark
// (the lamps are on) from the hour (game.season, game.weather, game.dark: derived, never kept on
// their own, so the quarter and the clock stay their owners).
// When the look changes (on its first tick, at a quarter change, as a snow day starts or ends, as
// it gets dark or light) it redresses the level: every outdoor sheet (OUTDOOR_SHEETS), every prop
// and every building piece (its `sheet`: the back-wall glass goes dark at night) takes its image for
// the look (seasonalImage: night's variant, else the weather's, else the season's, else the
// base), and the street's
// decals are laid for the season (streetDecals) ahead of the level's own. A variant keeps its base
// image's canvas, so nothing stands, blocks or seats differently in any season: only images change,
// and which decals lie on the ground.

class SeasonSystem {
    constructor() {
        this.look = null;   // the look the level is dressed in, as a key
    }

    update(deltaTime, game) {
        game.season  = seasonOf(game.quarter);
        game.weather = weatherOf(game.quarter, game.clock);
        game.dark    = lampsOn(clockHour(game.clock), game.season);
        const look = lookOf(game), key = look.join('|');
        if (key === this.look) return;
        this.look = key;

        for (const [set, def] of Object.entries(OUTDOOR_SHEETS))
            game.tileSheets[set] = ASSET_MANAGER.getAsset(seasonalImage(def, look));
        for (const prop of game.props)
            prop.sprite.image = ASSET_MANAGER.getAsset(seasonalImage(PROP_TYPES[prop.propType], look));
        for (const piece of game.pieces)
            piece.sprite.image = ASSET_MANAGER.getAsset(seasonalImage(piece.sheet, look));
        const level  = game.currentLevel;
        const street = placedProps(level, streetDecals(level, game.season, game.weather)).map(p => createProp(game, p));
        game.decals       = [...street, ...game.props.filter(p => p.decal)];
        game.loopingProps = [...street, ...game.props].filter(p => p.loop);
    }
}

// Debug, for reviewing seasonal art (console): seeSeason('winter') sets the quarter to the first one
// in that season, so the campus redresses on the next tick; seeSeason('snow') goes to the first snow
// day of a winter quarter, moving the clock's week and day there; seeSeason('rain') keeps the season
// and goes to the first rain day of the quarter, returning its spells by hour (· a break, ▂ drizzle,
// ▅ steady, ▇ a downpour) so you can pick an hour that's raining. It changes the game's quarter and
// day: for looking, not for playing on. seeSeason('fall') is the start's quarter again
function seeSeason(key) {
    const game = gameEngine, clock = game.clock;
    if (!['snow', 'rain'].includes(key) && !params.SEASONS.includes(key))
        return `seeSeason takes one of ${params.SEASONS.join(', ')}, snow, rain`;
    if (params.SEASONS.includes(key)) {
        game.quarter.number = params.SEASONS.indexOf(key) + 1;
        return `quarter ${game.quarter.number}: ${seasonOf(game.quarter)}`;
    }
    const first = () => {
        for (let week = 1; week <= game.quarter.length; week++) for (let day = 1; day <= 7; day++)
            if (weatherOf(game.quarter, { week, day }) === key) return { week, day };
        return null;
    };
    if (key === 'snow') for (let number = 2; ; number += params.SEASONS.length) {
        game.quarter.number = number;
        const at = first();
        if (at) { Object.assign(clock, at); return `quarter ${number}, week ${at.week}, day ${at.day}: snow`; }
    }
    const at = first();
    if (!at) return `no rain day in quarter ${game.quarter.number}`;
    Object.assign(clock, at);
    const GLYPHS = { 0: '·', 0.4: '▂', 0.7: '▅', 1: '▇' };
    const spells = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++)
        spells.push(`${h % 12 || 12}${h % 24 < 12 ? 'a' : 'p'} ${GLYPHS[rainSpell(game.quarter, clock, h)]}`);
    return `quarter ${game.quarter.number}, week ${at.week}, day ${at.day}: rain — ${spells.join(' ')}`;
}

// Debug, for reviewing the light (console), beside seeSeason: seeHour(21) sets the clock to 9:00 PM
// today, seeHour(21.5) to 9:30; 0, 1 and 2 are midnight, 1 AM and 2 AM (2 AM is the day's end, so
// it's the minute before). It returns the time, the season, the light's phase, the sunset and
// whether the lamps are on. The clock keeps running. With seeSeason, seeSeason('snow');
// seeHour(22) is a snow night. For looking, not for playing on
function seeHour(hour) {
    const game = gameEngine, clock = game.clock;
    const h = hour < DAY_START_HOUR ? hour + 24 : hour;
    if (!(h >= DAY_START_HOUR && h <= DAY_END_HOUR)) return 'seeHour takes an hour from 6 to 23, or 0 to 2 for midnight to 2 AM';
    clock.gameMinute  = Math.min(DAY_LENGTH_MINUTES - 1, Math.round((h - DAY_START_HOUR) * 60));
    clock.accumulator = 0;
    const season = seasonOf(game.quarter), weather = weatherOf(game.quarter, clock), at = clockHour(clock);
    return `${clock.getTimeString()}, ${season}${weather ? ' ' + weather : ''}: ${daylightOf(at, season, weather).phase} ` +
           `(sunset ${timeOfDay(params.DAYLIGHT[season].sunset)}, lamps ${lampsOn(at, season) ? 'on' : 'off'})`;
}
