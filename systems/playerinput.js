// PlayerInputSystem - translates keyboard input into velocity changes
class PlayerInputSystem {
    constructor() {
        this.keys = new KeyEdge();
    }

    update(deltaTime, game) {
        const panel = game.activePanel;

        // Blocking panels own their input entirely — suppress everything here.
        // (Registration, shop, and scene each handle their own Esc / choice keys.)
        // The player stands still under them, rather than sliding on at their last velocity.
        if (panel === 'registration' || panel === 'shop' || panel === 'scene') {
            game.player.velocity.dx = 0;
            game.player.velocity.dy = 0;
            return;
        }

        // C / I / F toggle overlays — each key closes if already open, else opens its panel
        if (this.keys.tap('c', game.keys))
            game.activePanel = panel === 'char-sheet' ? null : 'char-sheet';

        if (this.keys.tap('i', game.keys))
            game.activePanel = panel === 'inventory'  ? null : 'inventory';

        if (this.keys.tap('f', game.keys))
            game.activePanel = panel === 'calendar'   ? null : 'calendar';

        // P collapses the project list to its titles, and back (for the session; default expanded)
        if (this.keys.tap('p', game.keys))
            game.projectListCollapsed = !game.projectListCollapsed;

        // No movement while calendar is open (arrow keys navigate weeks)
        if (game.activePanel === 'calendar') return;

        const player = game.player;
        if (player && player.velocity && player.facing) {
            const speed = player.playercontrolled.speed;

            player.velocity.dx = 0;
            player.velocity.dy = 0;

            if (game.keys['ArrowUp']    || game.keys['w']) { player.velocity.dy = -speed; player.facing.direction = 'up';    }
            if (game.keys['ArrowDown']  || game.keys['s']) { player.velocity.dy =  speed; player.facing.direction = 'down';  }
            if (game.keys['ArrowLeft']  || game.keys['a']) { player.velocity.dx = -speed; player.facing.direction = 'left';  }
            if (game.keys['ArrowRight'] || game.keys['d']) { player.velocity.dx =  speed; player.facing.direction = 'right'; }
        }
    }
}
