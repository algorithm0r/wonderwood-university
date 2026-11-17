// (footX, footY): the ground point inside a frame. The frame is drawn with it on its owner's feet.
class Sprite {
    constructor(image, frameX = 0, frameY = 0, frameWidth = 16, frameHeight = 16,
                footY = frameHeight, footX = frameWidth / 2) {
        this.image = image;
        this.frameX = frameX;
        this.frameY = frameY;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.footY = footY;
        this.footX = footX;
    }
}
