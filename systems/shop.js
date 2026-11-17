// ShopSystem
// Handles the café counter, bookstore register and sandwich counter:
//   Proximity → E opens shop panel → ↑↓ navigate → E buy → Esc close
//
// Books go to inventory. Consumables apply wellbeing effect immediately
// (consumed on the spot — 90s campus, no takeout bags). A shop with `hoursOf` sells only while that
// building is open (its `hours`, maps/campus.js): outside them its prompt says so and E does
// nothing, and an open panel closes. The others sell at any hour.
// Sets game.activePanel = 'shop' while panel is visible (blocks NPC dialogue).

// Wellbeing a purchase restores: a small boost (coffee, a side), a meal, a good meal
const WELLBEING_SMALL = 10, WELLBEING_MEAL = 20, WELLBEING_GOOD_MEAL = 30;

const SHOP_CATALOGS = {
    'cafe-counter': {
        name: 'Campus Café',
        accent: '#f9a825',
        icon: 'shop_cafe',
        items: [
            { id: 'coffee',     name: 'Coffee',     type: 'consumable',
              cost:  2, effect: { stat: 'wellbeing', amount: WELLBEING_SMALL },
              desc: 'Short wellbeing boost.' },
            { id: 'meal-basic', name: 'Basic Meal', type: 'food',
              cost:  5, effect: { stat: 'wellbeing', amount: WELLBEING_MEAL },
              desc: 'Restores wellbeing.' },
        ],
    },
    // Owen's menu (CONTENT.md, "Owen's Sandwich Shop (menu)"); no sandwich badge yet, so the cup
    'sandwich-counter': {
        name: "Owen's Sandwich Shop",
        accent: '#6b8e4e',
        icon: 'shop_cafe',
        hoursOf: 'Sandwich Shop',
        items: [
            { id: 'turkey-swiss', name: 'Turkey & Swiss',  type: 'food',
              cost: 5, effect: { stat: 'wellbeing', amount: WELLBEING_MEAL },
              desc: 'On sourdough. A meal.' },
            { id: 'the-cascade',  name: 'The Cascade',     type: 'food',
              cost: 8, effect: { stat: 'wellbeing', amount: WELLBEING_GOOD_MEAL },
              desc: 'Roast beef, cheddar, horseradish, hoagie.' },
            { id: 'clam-chowder', name: 'Clam Chowder',    type: 'food',
              cost: 4, effect: { stat: 'wellbeing', amount: WELLBEING_SMALL },
              desc: 'With bread. Less than a meal.' },
            { id: 'chips',        name: 'Chips',           type: 'consumable',
              cost: 1, effect: { stat: 'wellbeing', amount: WELLBEING_SMALL },
              desc: 'A small boost.' },
            { id: 'soda-water',   name: 'Soda or Water',   type: 'consumable',
              cost: 1, effect: { stat: 'wellbeing', amount: WELLBEING_SMALL },
              desc: 'A small boost.' },
        ],
    },
    'bookstore-register': {
        name: 'Campus Bookstore',
        accent: '#8d6e63',
        icon: 'shop_bookstore',
        items: [
            { id: 'notebook',      name: 'Notebook',        type: 'book',
              cost:  3, effect: null, desc: 'Required for note-taking tasks.' },
            { id: 'textbook-used', name: 'Textbook (used)', type: 'book',
              cost: 25, effect: null, desc: 'Lower quality bonus on assignments.' },
            { id: 'textbook-new',  name: 'Textbook (new)',  type: 'book',
              cost: 50, effect: null, desc: 'Better quality bonus on assignments.' },
        ],
    },
};

// The building whose hours a shop keeps, if it keeps any
const shopBuilding = catalog => catalog.hoursOf && CAMPUS.buildings.find(b => b.name === catalog.hoursOf);

// Whether a shop serves now: always, or while its building is open
function shopOpen(catalog, clock) {
    const b = shopBuilding(catalog);
    return !b || !clock || buildingOpen(b, clock);
}

// "10am–4pm" for a building's hours today, "today" if it's closed all day
const hoursText = hours => hours ? hours.map(h => `${h % 12 || 12}${h % 24 < 12 ? 'am' : 'pm'}`).join('\u2013') : 'today';

class ShopSystem {
    constructor() {
        this.open          = false;
        this.selectedIndex = 0;
        this.activeStation = null;
        this.keys          = new KeyEdge();
    }

    update(deltaTime, game) {
        if (!game.ctx) return;
        if (game.paused) return;
        if (game.activePanel && game.activePanel !== 'shop') {
            // Another system owns the panel slot — reset shop state silently,
            // but do NOT call _close() which would clobber game.activePanel.
            this.open          = false;
            this.activeStation = null;
            return;
        }

        const player = game.player;
        if (!player || !player.inventory) return;

        const eTap   = this.keys.tap('e',         game.keys);
        const escTap = this.keys.tap('Escape',     game.keys);
        const upTap  = this.keys.tap('ArrowUp',   game.keys) || this.keys.tap('w', game.keys);
        const dwnTap = this.keys.tap('ArrowDown',  game.keys) || this.keys.tap('s', game.keys);

        // The shop E would open: E's target, when it is a shop (interactTarget)
        const target      = game.interactTarget;
        const nearStation = target && target.kind === 'shop' ? target.station : null;

        // Panel is open, until Esc or the player walks off (LEAVE_RADIUS)
        if (this.open) {
            const open = game.stationMap[this.activeStation];
            const cx = player.position.x + player.drawWidth / 2, cy = player.position.y + player.drawHeight / 2;
            const stillNear = open && getDistance({ x: cx, y: cy }, open) < params.LEAVE_RADIUS;
            if (!stillNear || escTap || !shopOpen(SHOP_CATALOGS[open.type], game.clock)) {
                this._close(game);
            } else {
                const items = SHOP_CATALOGS[open.type].items;
                if (upTap)  this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
                if (dwnTap) this.selectedIndex = (this.selectedIndex + 1) % items.length;
                if (eTap)   this._tryBuy(game, player, open.type, items[this.selectedIndex]);
            }
            game.activePanel = 'shop';
            if (this.open) this._drawPanel(game, player, open);
            return;
        }

        // Only clear activePanel if we own it — don't clobber other panels.
        if (game.activePanel === 'shop') game.activePanel = null;
        if (game.activePanel) return;

        if (!nearStation) return;

        // Not over an open dialogue (its E advances it)
        if (game.npcDialogue) return;

        // Closed: the prompt says when it opens, and E does nothing
        const catalog = SHOP_CATALOGS[nearStation.type];
        if (!shopOpen(catalog, game.clock)) {
            drawPromptSign(game, `${catalog.name}: closed (${hoursText(hoursToday(shopBuilding(catalog), game.clock))})`, PANEL_LOOKS.sign.ink.dim);
            return;
        }

        if (eTap) {
            this.open          = true;
            this.selectedIndex = 0;
            this.activeStation = nearStation.id;
            game.activePanel   = 'shop';
            this._drawPanel(game, player, nearStation);
        } else {
            this._drawPrompt(game, nearStation);
        }
    }

    // ── Purchase logic ────────────────────────────────────────────────────────

    _tryBuy(game, player, stationType, item) {
        if (!item) return;
        if (!game.notifications) game.notifications = [];

        if (player.agent.money < item.cost) {
            game.notifications.unshift({ message: `Not enough funds (need $${item.cost})`, timer: 3 });
            return;
        }

        player.agent.money -= item.cost;

        if (item.effect) {
            // Consumable — apply immediately, no inventory entry
            if (item.effect.stat === 'wellbeing') {
                player.agent.wellbeing = Math.min(100, player.agent.wellbeing + item.effect.amount);
                player.agent.updateWellbeingState();
            }
            game.notifications.unshift({
                message: `${item.name} — wellbeing +${item.effect.amount}  ($${player.agent.money} left)`,
                timer: 4,
            });
        } else {
            // Physical item — goes to inventory
            player.inventory.add(new Item(item.id, item.name, item.type));
            game.notifications.unshift({
                message: `Bought: ${item.name}  ($${player.agent.money} left)`,
                timer: 4,
            });
        }
    }

    _close(game) {
        this.open          = false;
        this.activeStation = null;
        game.activePanel   = null;
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    _drawPrompt(game, station) {
        drawPromptSign(game, `E: ${SHOP_CATALOGS[station.type].name}`, PANEL_LOOKS.sign.ink.text);
    }

    _drawPanel(game, player, station) {
        const catalog = SHOP_CATALOGS[station.type];
        const items   = catalog.items;
        const ctx     = game.ctx;
        const cw      = ctx.canvas.width;
        const ch      = ctx.canvas.height;

        const panelW  = 520;
        const rowH    = 2 * TEXT_LINE + 24;   // name and description beside the item's icon
        const headerH = 64;
        const footerH = 44;
        const panelH  = headerH + items.length * rowH + footerH;
        const px      = Math.round((cw - panelW) / 2);
        const py      = Math.round((ch - panelH) / 2);

        ctx.save();

        drawPanel(ctx, 'window', px, py, panelW, panelH);
        const ink = PANEL_LOOKS.window.ink;

        // Header
        ctx.fillStyle    = onPaper(catalog.accent);
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, catalog.name, px + panelW / 2, py + 22, 'title');
        drawIcon(ctx, catalog.icon, px + panelW / 2 - textWidth(catalog.name, 'title') / 2 - ICON_SIZE - 8, py + 6);

        ctx.fillStyle = ink.dim;
        drawText(ctx, `Available funds: $${player.agent.money}`, px + panelW / 2, py + 46, 'text');

        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + headerH);
        ctx.lineTo(px + panelW - 16, py + headerH);
        ctx.stroke();

        // Item rows
        const typeColors = {
            book:       '#7ab4e8',
            consumable: '#f0a87a',
            food:       '#81c784',
        };

        for (let i = 0; i < items.length; i++) {
            const item      = items[i];
            const rowY      = py + headerH + i * rowH;
            const selected  = i === this.selectedIndex;
            const canAfford = player.agent.money >= item.cost;
            const color     = typeColors[item.type] || '#ddd';

            if (selected) {
                ctx.fillStyle = `rgba(${hexToRgb(catalog.accent)},0.10)`;
                ctx.fillRect(px + 6, rowY + 4, panelW - 12, rowH - 8);
            }

            const textX = px + 16 + ICON_SIZE + 12;
            if (ITEM_ICONS[item.id]) drawIcon(ctx, ITEM_ICONS[item.id], px + 16, rowY + (rowH - ICON_SIZE) / 2);
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = onPaper(selected ? catalog.accent : color);
            drawText(ctx, item.name, textX, rowY + 20, 'largeBold');

            ctx.fillStyle = ink.faint;
            drawText(ctx, item.desc, textX, rowY + 20 + TEXT_LINE, 'body');

            ctx.textAlign = 'right';
            ctx.fillStyle = onPaper(canAfford ? catalog.accent : '#c0392b');
            drawText(ctx, `$${item.cost}`, px + panelW - 20, rowY + 20, 'largeBold');
        }

        // Footer
        const footerY = py + headerH + items.length * rowH;
        ctx.strokeStyle = ink.rule;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 16, footerY + 6);
        ctx.lineTo(px + panelW - 16, footerY + 6);
        ctx.stroke();

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = ink.hint;
        drawText(ctx, '↑↓ select   E buy   Esc close', px + panelW / 2, footerY + 26, 'body');

        ctx.restore();
    }

}
