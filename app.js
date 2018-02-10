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
const DOTS_PER_BLOCK = 4;
const NUM_BLOCKS = 54;
const NUM_TEST_BLOCKS = 100;
const MAX_TRIES = 20;



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

function rand(n = CUBE_SIDE_LENGTH) {
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

    isValid(upperLimit = CUBE_SIDE_LENGTH) {
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
        console.log(`id: ${this.id} xyx: ${this.x}${this.y}${this.z} rst: ${this.key} isValid: ${this.isValid()}`);
        console.log(this.getAbsoluteDotPositions().map(row => row.join(' ')).join("\n"));
    }
}

class RandomBlock {
    constructor(id) {
        return RandomBlock.makeValidRandomBlock(id);
    }

    static makeRandomBlock(id) {
        return new Block(
            rand(),
            rand(),
            rand(),
            rand(4),
            rand(4),
            rand(4),
            id
        );
    }

    // recursively calls self if the new block is invalid
    static makeValidRandomBlock(id) {
        let block = RandomBlock.makeRandomBlock(id);
        return block.isValid() ? block : RandomBlock.makeValidRandomBlock(id);
    }
}



/*

Cube (i can haz blocks pls)

*/

class Cube {
    constructor(s = CUBE_SIDE_LENGTH) {
        this.s = s;
        this.matrix = Array(s).fill().map(() => Array(s).fill().map(() => Array(s).fill(0)));
        this.adjacentZeros = Array(s).fill().map(() => Array(s).fill().map(() => Array(s).fill(0)));
        this.blocks = {};
    }

    numBlocks() {
        return Object.keys(this.blocks).length;
    }

    isComplete() {
        return Object.keys(this.blocks).length >= NUM_BLOCKS - 5;
    }

    isValidBlockPlacement(block) {
        return block.getAbsoluteDotPositions().every(pt => !this.matrix[pt[0]][pt[1]][pt[2]]);
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

    getRandomBlockId() {
        var ids = Object.keys(this.blocks);
        return ids[rand(ids.length)];
    }

    removeRandomBlocks() {
        const total = this.numBlocks();
        const third = Math.ceil(total / 3);
        let i = 0;
        while (i++ < third) {
            this.removeBlock(this.getRandomBlockId());
        }
    }

    countOpeningsAroundBlock(block) {
        block.openings = block.getAbsoluteDotPositions()
            .map(p => this.countOpeningsAroundPoint(p[0], p[1], p[2]))
            .reduce((a, b) => a + b);
        return block;
    }

    countOpeningsAroundPoint(x, y, z) {
        var n = 0;
        let m = this.matrix;

        if (x + 1 < CUBE_SIDE_LENGTH && x + 1 >= 0 && m[x + 1][y][z] == 0) n++;
        if (x - 1 < CUBE_SIDE_LENGTH && x - 1 >= 0 && m[x - 1][y][z] == 0) n++;
        if (y + 1 < CUBE_SIDE_LENGTH && y + 1 >= 0 && m[x][y + 1][z] == 0) n++;
        if (y - 1 < CUBE_SIDE_LENGTH && y - 1 >= 0 && m[x][y - 1][z] == 0) n++;
        if (z + 1 < CUBE_SIDE_LENGTH && z + 1 >= 0 && m[x][y][z + 1] == 0) n++;
        if (z - 1 < CUBE_SIDE_LENGTH && z - 1 >= 0 && m[x][y][z - 1] == 0) n++;

        return n;
    }

    countOpenings() {

    }

    tryAddBlock(block) {
        return this.isValidBlockPlacement(block) && this.placeBlock(block);
    }

    getCompleteness() {
        const numUsedBlocks = this.numBlocks();
        return `${numUsedBlocks}/${NUM_BLOCKS} t-tetracubes ---- ${numUsedBlocks * DOTS_PER_BLOCK}/${NUM_BLOCKS * DOTS_PER_BLOCK} squrxls`;
    }

    log() {
        this.matrix.forEach((layer, x) => {
            console.log(`layer ${x}`);
            layer.forEach((row, y) => {
                console.log(`l${x} r${y} ${JSON.stringify(row)}`);
            });
        });

        console.log('blocks:', this.blocks);

        console.log(this.getCompleteness());
    }
}


const ids = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789!@#$%&*'.split('');

function randChar() {
    return ids[rand(ids.length)];
}

function newRandChar(chars) {
    var char = randChar();
    return chars.includes(char) ? newRandChar(chars) : char;
}

/*

void main()

*/

function makeBlocks(cube) {

    let nextBlockId;
    let killSwitch = false;

    while (!cube.isComplete() && !killSwitch) {
        nextBlockId = newRandChar(Object.keys(cube.blocks));

        if (!placeBestBlock(cube, nextBlockId)) {

            var mostExposedBlocks = Object.values(cube.blocks)
                .map(block => cube.countOpeningsAroundBlock(block), cube)
                .sort((a, b) => b.openings - a.openings);

            console.log('*** Removing 4 edge blocks. ***');

            for (var i = 0; i < 4; i++) {
                cube.removeBlock(mostExposedBlocks[i].id);
            }

            console.log(`Cube now has ${cube.numBlocks()} blocks. Continuing...`);
        }
    }

    console.log('you won at tetracube!');

    cube.log();

}

function placeBestBlock(cube, blockId, tries = 1, batchSize = NUM_TEST_BLOCKS) {
    let testBlocks = Array(batchSize).fill()
        .map(() => new RandomBlock(blockId))
        .filter(block => cube.isValidBlockPlacement(block))
        .map(block => cube.countOpeningsAroundBlock(block), cube)
        .sort((a, b) => a.openings - b.openings);

    if (!testBlocks.length) {
        console.log(`Created a batch of blocks but none fit (${tries})`);
    } else {
        console.log(`Cube has ${cube.numBlocks()} blocks, created batch of ${testBlocks.length} valid blocks, adding the snuggest fit.`);
    }

    if (testBlocks.length && cube.tryAddBlock(testBlocks[0])) {
        return true;
    } else {
        if (tries < MAX_TRIES) {
            return placeBestBlock(cube, blockId, ++tries);
        } else {
            console.log(`Tried too many times...`);
            return false;
        }
    }
}

$(document).ready(function() {

    // create a cube
    var cube = new Cube();

    // add some blocks
    makeBlocks(cube);

});


