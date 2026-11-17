// Animator — a character's sheets by state and where it is in the current one
class Animator {
    constructor(sheets, phase = 0, looks = {}) {
        this.sheets = sheets;  // { state: image }, the states this character has
        this.looks = looks;    // { look key: { state: image } }: what it wears outdoors in a look (winter)
        this.phase = phase;    // the frame a looping state (not walk) starts on, so a room doesn't breathe in step
        this.state = 'walk';
        this.row = 0;          // facing row (dirIndex8); kept while standing still
        this.frame = 0;
        this.frameTimer = 0;
    }
}
