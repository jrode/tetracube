/*global $:true*/

/*

Block aka t-tetracube

    d
    ■
  ■ ■ ■
  a b c

            ____________
          /|            |
         / |            |
        /  |            |
       /   |            | z
      /    |            |
     /     |            |
    |      |____________|           /
    |     /            /  r = 0  --/       /
    |    /            /           /     --┴-- r = 1
    |   /            /
    |  /           c/  x           /       ^
    | /         d b/      s = 0 --/        |/ s = 1
    |/___________a/              /         /
           y               

positions:                         /       |
x: 0                      t = 0 --/       -┤  t = 1
y: 0                             /         |
z: 0

rotations:
r: 0 (+1 twists on z-axis moving a where d was)
s: 0 (+1 twists on x-axis moving d above b)      } <-- TODO: this framework should be x-y-z
t: 0 (+1 twists on y-axis moving a above b)

*/


const CUBE_SIDE_LENGTH = 6;
const NUM_BLOCKS = 54;


/*

first generate all possible orientations of the t-tetracube

*/

// lookup object for possible orientations based on rotation vars
var orientations = {};

// a t-tetris piece will always have the t pointed at the center of 1 of the 6 sides
const relativePositions = {
    front  : [-1, 0, 0],
    back   : [ 1, 0, 0],
    left   : [ 0, 1, 0],
    right  : [ 0,-1, 0],
    up     : [ 0, 0, 1],
    down   : [ 0, 0,-1],
    center : [ 0, 0, 0],
};

// an arbitrary framework similar to cardinal directions
const directionalValues = [0, 1, 2, 3];

function createRelativeBlock(r, s, t) {

    // this will contain 4 (x,y,z) positions of each part of the t-tetracube
    let positions = [];

    // stores possible "d" positions based on block orientation
    let dPos = [];

    // this holds a relative block's spoken word positions
    // e.g. 'front', 'back', 'up', 'down', 'left', 'right'
    let p = {
        a: null,
        b: 'center',
        c: null,
        d: null
    };

    // determine "a" to "c" orientation based on rotations
    const frontToBack = (r == 0 && t == 0) || (r == 2 && t == 2);
    const backToFront = (r == 0 && t == 2) || (r == 2 && t == 0);
    const upToTheDown = (r == 0 && t == 1) || (r == 1 && t == 1) || (r == 2 && t == 3) || (r == 3 && t == 1);
    const downToTheUp = (r == 0 && t == 3) || (r == 1 && t == 3) || (r == 2 && t == 1) || (r == 3 && t == 3);
    const leftToRight = (r == 1 && t == 0) || (r == 3 && t == 2);
    const rightToLeft = (r == 1 && t == 2) || (r == 3 && t == 0);


    if (frontToBack) {
        p.a = 'front';
        p.c = 'back';

        if (r == 0) {
            dPos = ['left', 'up', 'right', 'down'];
        } else {
            dPos = ['right', 'down', 'left', 'up'];
        }

    } else if (backToFront) {
        p.a = 'back';
        p.c = 'front';

        if (r == 0) {
            dPos = ['left', 'down', 'right', 'up'];
        } else {
            dPos = ['right', 'up', 'left', 'down'];
        }

    } else if (upToTheDown) {
        p.a = 'up';
        p.c = 'down';

        if (r == 0) {
            dPos = ['left', 'back', 'right', 'front'];
        } else {
            dPos = ['right', 'front', 'left', 'back'];
        }

    } else if (downToTheUp) {
        p.a = 'down';
        p.c = 'up';

        if (r == 0) {
            dPos = ['left', 'front', 'right', 'back'];
        } else {
            dPos = ['right', 'back', 'left', 'front'];
        }

    } else if (leftToRight) {
        p.a = 'left';
        p.c = 'right';

        if (r == 1) {
            dPos = ['back', 'up', 'front', 'down'];
        } else {
            dPos = ['front', 'down', 'back', 'up'];
        }

    } else if (rightToLeft) {
        p.a = 'right';
        p.c = 'left';

        if (r == 1) {
            dPos = ['back', 'down', 'front', 'up'];
        } else {
            dPos = ['front', 'up', 'back', 'down'];
        }
    }

    // set "d" based on rotation of s
    p.d = dPos[s];

    // add block positions to orientation lookup object
    for (var dot in p) {
        positions.push(relativePositions[p[dot]]);
    }

    return positions;
}

(function buildOrientationsLookup() {
    directionalValues.forEach(r => {
        directionalValues.forEach(s => {
            directionalValues.forEach(t => {
                // create lookup object key (000 -> 333)
                const key = `${r}${s}${t}`;
                orientations[key] = createRelativeBlock(r, s, t);
            });
        });
    });
})();



/*

util

*/

function rand(n) {
    return Math.floor(Math.random() * n);
}



/*

Block (aka t-tetracube)

*/

class Block {
    constructor(x, y, z, r, s, t, id) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;
        this.s = s;
        this.t = t;
        this.id = id;
    }

    getOrientationKey() {
        return `${this.r}${this.s}${this.t}`;
    }

    getRelativeDotPositions() {
        return orientations[this.getOrientationKey()];
    }

    getAbsoluteDotPositions() {
        return this.getRelativeDotPositions().map(pt => {
            return [pt[0] + this.x, pt[1] + this.y, pt[2] + this.z];
        });
    }
}

class RandomBlock {
    constructor(id) {
        return RandomBlock.makeValidRandomBlock(id);
    }

    static makeRandomBlock(id) {
        return new Block(
            rand(CUBE_SIDE_LENGTH),
            rand(CUBE_SIDE_LENGTH),
            rand(CUBE_SIDE_LENGTH),
            rand(4),
            rand(4),
            rand(4),
            id
        );
    }

    static makeValidRandomBlock(id) {
        return RandomBlock.makeRandomBlock(id);
    }
}



/*

Cube (i can haz blocks pls)

*/

class Cube {
    constructor(s) {
        this.s = s;
        this.matrix = Array(s).fill(Array(s).fill(Array(s).fill(0)));
    }

    addBlock(block) {

    }

    log() {
        this.matrix.forEach((layer, x) => {
            console.log(`layer ${x}`);
            layer.forEach((row, y) => {
                console.log(`l${x} r${y} ${JSON.stringify(row)}`);
            });
        });
    }
}



/*

void main()

*/

$(document).ready(function() {
    var block = new RandomBlock('a');
    console.log(block.getRelativeDotPositions(), block.getAbsoluteDotPositions());

    var cube = new Cube(CUBE_SIDE_LENGTH);
    cube.addBlock(block);
    cube.log();
});


