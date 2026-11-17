// MovementSystem - updates positions based on velocity, blocked by impassable tiles and solid props
class MovementSystem {
    update(deltaTime, game) {
        for (let entity of game.entities) {
            if (entity.position && entity.velocity) {
                const newX = entity.position.x + entity.velocity.dx * deltaTime;
                const newY = entity.position.y + entity.velocity.dy * deltaTime;

                if (game.currentLevel && entity.collider) {
                    // Try moving in X and Y separately so entities slide along walls
                    if (!isBlocked(game, colliderBox(entity, newX, entity.position.y))) {
                        entity.position.x = newX;
                    }
                    if (!isBlocked(game, colliderBox(entity, entity.position.x, newY))) {
                        entity.position.y = newY;
                    }
                } else {
                    entity.position.x = newX;
                    entity.position.y = newY;
                }
            }
        }
    }
}

// A box is blocked if it leaves the map, touches an impassable tile, or overlaps a solid prop
function isBlocked(game, box) {
    const level = game.currentLevel;
    const { c0, c1, r0, r1 } = boxCells(box, level.tileSize);
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            if (r < 0 || c < 0 || r >= level.tiles.length || c >= level.tiles[0].length) return true;
            if (!level.passableTiles.includes(level.tiles[r][c])) return true;
        }
    }
    return game.solidProps.some(p => boxesOverlap(box, colliderBox(p)));
}
