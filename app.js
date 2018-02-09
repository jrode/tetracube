/*global $:true*/

/*

Block, aka t-tetracube:

    d
    ■
  ■ ■ ■
  a b c


A 6x6x6 cube that needs to fit 54 t-tetracubes evenly:
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
           y     (0,0,0)         

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

// a t-tetracube will always have the top "t" pointed at the
// center of 1 of the 6 sides of a 3x3x3 container cube
const relativePositions = {
    front  : [-1, 0, 0],
    back   : [ 1, 0, 0],
    left   : [ 0, 1, 0],
    right  : [ 0,-1, 0],
    up     : [ 0, 0, 1],
    down   : [ 0, 0,-1],
    center : [ 0, 0, 0],
};

// arbitrary framework akin to cardinal directions
const directionalValues = [0, 1, 2, 3];


//    d
//    ■
//  ■ ■ ■
//  a b c

// accepts 3 spin values and returns an array of 4 (x,y,z) relative points
// the second point is always [0,0,0] ("b")
function createRelativeBlock(r, s, t) {

    // this will contain the 4 (x,y,z) positions of each part of the t-tetracube
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

// creates relative orientation lookup object
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

utils

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
        this.key = `${r}${s}${t}`;
    }

    getRelativeDotPositions() {
        return orientations[this.key];
    }

    getAbsoluteDotPositions() {
        return this.getRelativeDotPositions().map(pt => {
            return [pt[0] + this.x, pt[1] + this.y, pt[2] + this.z];
        });
    }

    isValid(upperLimit) {
        var valid = true;

        this.getAbsoluteDotPositions().forEach(pt => {
            pt.forEach(val => {
                if (val < 0 || val >= upperLimit) {
                    valid = false;
                }
            });
        });

        return valid;
    }

    log() {
        console.log(`id: ${this.id} xyx: ${this.x}${this.y}${this.z} rst: ${this.key} isValid: ${this.isValid(CUBE_SIDE_LENGTH)}`);
        console.log(this.getAbsoluteDotPositions().map(row => row.join(' ')).join("\n"));
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

    // recursively calls self if the new block is invalid
    static makeValidRandomBlock(id) {
        let block = RandomBlock.makeRandomBlock(id);
        return block.isValid(CUBE_SIDE_LENGTH) ? block : RandomBlock.makeValidRandomBlock(id);
    }
}



/*

Cube (i can haz blocks pls)

*/

class Cube {
    constructor(s) {
        this.s = s;
        this.matrix = Array(s).fill().map(() => Array(s).fill().map(() => Array(s).fill(0)));
        this.blocks = {};
    }

    tryAddBlock(block) {
        return this.isValidBlockPlacement(block) && this.placeBlock(block);
    }

    isValidBlockPlacement(block) {
        var valid = true;
        block.getAbsoluteDotPositions().forEach(pt => {
            if (this.matrix[pt[0]][pt[1]][pt[2]]) {
                valid = false;
            }
        });
        return valid;
    }

    placeBlock(block) {
        this.blocks[block.id] = block;
        block.getAbsoluteDotPositions().forEach(pt => {
            this.matrix[pt[0]][pt[1]][pt[2]] = block.id;
        });
        return true;
    }

    removeBlock(blockId) {
        if (this.blocks.hasOwnProperty(blockId)) {
            this.blocks[blockId].getAbsoluteDotPositions().forEach(pt => {
                this.matrix[pt[0]][pt[1]][pt[2]] = 0;
            });
            delete this.blocks[blockId];
        }
    }

    log() {
        this.matrix.forEach((layer, x) => {
            console.log(`layer ${x}`);
            layer.forEach((row, y) => {
                console.log(`l${x} r${y} ${JSON.stringify(row)}`);
            });
        });

        console.log('blocks:', this.blocks);

        const numUsedPieces = Object.keys(this.blocks).length;
        const totalPieces = Math.pow(this.s, 3);

        
    }
}

// 54 unique characters (for simpler console output)
const ids = 'A;lk2570CDEFGHIJKLM9gv83m[x]abcdefgBU@#$%*'.split('');

/*

void main()

*/

function makeAndAddBlock(cube, blockId) {
    var block = new RandomBlock(blockId);

    if (cube.tryAddBlock(block)) {
        return true;
    } else {
        makeAndAddBlock(cube, blockId);
    }
}

$(document).ready(function() {

    // create a cube
    var cube = new Cube(CUBE_SIDE_LENGTH);
    cube.log();

    // add some blocks
    ids.forEach(id => {
        makeAndAddBlock(cube, id);
    });
    cube.log();

    // remove all the blocks
    // for (var blockId in cube.blocks) {
    //     cube.removeBlock(blockId);
    // }
    // cube.log();

});


