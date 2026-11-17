// Critter — an animal's state (design/ambient-life.md §4; CritterSystem runs it): its kind (a row
// of params.CRITTERS), what it's doing ('idle', 'walk' to a nearby spot, 'flee' to cover or away,
// 'leave' for off the view, 'arrive' at a spot from off the view; and for a kind with cover,
// 'climb' or 'hide' into it, 'gone' in it, 'emerge' from it), where it's going, how high it is (0
// on the ground; a bird in the air is drawn in the air pass, its shadow on the ground beneath; a
// squirrel on its trunk is raised `up` art px in the sorted pass), how long until it next decides,
// its frame clock, the animation it's playing and since when, the cover it's in or making for,
// and the perch it holds, if any
class Critter {
    constructor(kind, perch = null) {
        this.kind    = kind;
        this.state   = 'idle';
        this.to      = null;     // { x, y }: where it's walking or flying, world px
        this.alt     = 0;        // px above its ground point
        this.up      = 0;        // art px up its trunk (a squirrel climbing)
        this.timer   = 0;        // s until it next decides (idle) or may come back (gone)
        this.clock   = 0;        // its frames' clock, s
        this.anim    = null;     // the animation it rests in (its kind's `idles`), or null for its first
        this.animAt  = 0;        // its clock when that animation began
        this.cover   = null;     // the cover point it's in or making for ({ x, y, tree? })
        this.perch   = perch;    // a seed perch it holds ({ x, y, safe }), or null
    }
}
