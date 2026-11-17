// CameraSystem — centers on player, clamped to map bounds
class CameraSystem {
    update(deltaTime, game) {
        if (!game.camera || !game.currentLevel) return;
        const player = game.player;
        if (!player) return;

        const W    = game.ctx.canvas.width;
        const H    = game.ctx.canvas.height - UI_HEIGHT;
        const lvl  = game.currentLevel;
        const mapW = lvl.tiles[0].length * lvl.tileSize;
        const mapH = lvl.tiles.length    * lvl.tileSize;

        const pw = player.drawWidth  || 48;
        const ph = player.drawHeight || 48;

        game.camera.x = Math.max(0, Math.min(mapW - W,
            player.position.x + pw / 2 - W / 2));
        game.camera.y = Math.max(0, Math.min(mapH - H,
            player.position.y + ph / 2 - H / 2));
    }
}
