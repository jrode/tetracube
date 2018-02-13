const notes = `

Block, aka t-tetracube:

    d
    *
  * * *
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
    |    /            /           /     ----- r = 1
    |   /            /
    |  /            /  x           /       ^
    | /           c/      s = 0 --/        |/ s = 1
    |/_________d_b/              /         /
           y    a (0,0,0)         

positions:                         /       |
x: 0                      t = 0 --/       -|  t = 1
y: 0                             /         |
z: 0

rotations:
r: 0 (+1 twists on z-axis moving a where d was)
s: 0 (+1 twists on x-axis moving d above b)
t: 0 (+1 twists on y-axis moving a above b)

note:
(0,0,0,0,0,0) is an invalid placement because "a" is outside the cube

`;

// cube params
const CUBE_SIDE_LENGTH = 6;
const DOTS_PER_BLOCK = 4;
const NUM_BLOCKS = 54;

// solver params
const NUM_TEST_BLOCKS = 1800;
const MAX_TRIES = 12;
const NUM_REMOVE = 3;
const DOUBLE_NUM_REMOVE_AFTER = 100;

// run loop params
const RUN_LOOP_INTERVAL = 0;

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
        domLog(`id: ${this.id} xyx: ${this.x}${this.y}${this.z} rst: ${this.key} isValid: ${this.isValid()}`);
        domLog(this.getAbsoluteDotPositions().map(row => row.join(' ')).join("\n"));
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
        this.adjacentSpacesCount = Array(s).fill().map(() => Array(s).fill().map(() => Array(s).fill(-1)));
        this.blocks = {};
        this.startTime = Date.now();
        this.lastNumRemove = NUM_REMOVE;
        this.removeCount = 0;
    }

    numBlocks() {
        return Object.keys(this.blocks).length;
    }

    isComplete() {
        const complete = this.numBlocks() >= NUM_BLOCKS;
        if (complete && !this.stopTime) {
            this.stopTime = Date.now();
        }
        return complete;
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

    removeEdgeBlocks() {
        this.removeCount++;
        let numRemove = NUM_REMOVE;

        // double the number of blocks removed after X fails
        if (this.removeCount % DOUBLE_NUM_REMOVE_AFTER == 0) {
            numRemove = this.lastNumRemove *= 2;
        }

        var mostExposedBlocks = Object.values(this.blocks)
            .map(block => this.countOpeningsAroundBlock(block))
            .sort((a, b) => b.openings - a.openings);

        domLog(`Removing ${numRemove} edge blocks.`, 'error');

        for (var i = 0; i < numRemove; i++) {
            if (mostExposedBlocks.length > i) {
                this.removeBlock(mostExposedBlocks[i].id);
            }
        }

        if (this.numBlocks() == 0) {
            this.lastNumRemove = NUM_REMOVE;
        }

        domLog(`Cube now has ${this.numBlocks()} blocks. Continuing...`, 'warning');
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

    sumAdjacentSpaces(x, y, z) {
        return (x + 1 < CUBE_SIDE_LENGTH && x + 1 >= 0 && this.adjacentSpacesCount[x + 1][y][z] != 'x' && this.adjacentSpacesCount[x + 1][y][z])
             + (x - 1 < CUBE_SIDE_LENGTH && x - 1 >= 0 && this.adjacentSpacesCount[x - 1][y][z] != 'x' && this.adjacentSpacesCount[x - 1][y][z])
             + (y + 1 < CUBE_SIDE_LENGTH && y + 1 >= 0 && this.adjacentSpacesCount[x][y + 1][z] != 'x' && this.adjacentSpacesCount[x][y + 1][z])
             + (y - 1 < CUBE_SIDE_LENGTH && y - 1 >= 0 && this.adjacentSpacesCount[x][y - 1][z] != 'x' && this.adjacentSpacesCount[x][y - 1][z])
             + (z + 1 < CUBE_SIDE_LENGTH && z + 1 >= 0 && this.adjacentSpacesCount[x][y][z + 1] != 'x' && this.adjacentSpacesCount[x][y][z + 1])
             + (z - 1 < CUBE_SIDE_LENGTH && z - 1 >= 0 && this.adjacentSpacesCount[x][y][z - 1] != 'x' && this.adjacentSpacesCount[x][y][z - 1]);
    }

    hasBlockPlacementIntegrity() {
        let checkPoints = [];

        this.matrix.forEach((layer, x) => {
            layer.forEach((row, y) => {
                row.forEach((val, z) => {
                    // point is occupied
                    if (val) {
                        this.adjacentSpacesCount[x][y][z] = false;
                    } else {
                        this.adjacentSpacesCount[x][y][z] = this.countOpeningsAroundPoint(x, y, z);
                        checkPoints.push({x, y, z});
                    }
                });
            });
        });

        return !checkPoints.some(p => {
            const {x, y, z} = p;
            const emptyNeighbors = this.adjacentSpacesCount[x][y][z];

            return (emptyNeighbors == 0) // single enclosed space
                || (emptyNeighbors == 1 && this.sumAdjacentSpaces(x, y, z) == 1)  // any two connected enclosed spaces
                || (emptyNeighbors == 2 && this.sumAdjacentSpaces(x, y, z) == 2); // any three connected enclosed spaces
        });
    }

    tryAddBlock(block) {
        if (this.isValidBlockPlacement(block) && this.placeBlock(block)) {
            if (!this.hasBlockPlacementIntegrity()) {
                domLog('Last placement enclosed an empty space, removing last block...');
                this.removeBlock(block.id);
                return false;
            }
        }
        return true;
    }

    getCompleteness() {
        const numUsedBlocks = this.numBlocks();
        return `${numUsedBlocks}/${NUM_BLOCKS} t-tetracubes in ${numUsedBlocks * DOTS_PER_BLOCK}/${NUM_BLOCKS * DOTS_PER_BLOCK} spaces after ${this.getElapsedSeconds()}.`;
    }

    getElapsedSeconds() {
        var stopTime = this.stopTime || Date.now();
        var elapsed = (stopTime - this.startTime) / 1000;
        return `${elapsed} seconds`;
    }

    log() {
        var cubeOutput = '';
        this.matrix.forEach((layer, x) => {
            if (x) {
                cubeOutput += '<br>';
            }
            cubeOutput += `layer ${x}:<br>`;
            layer.forEach((row, y) => {
                cubeOutput += `row ${y}: ${row.join(' ')}<br>`;
            });
        });
        cubeOutput += '<br>^ Zeroes are empty spaces, anything else is a block identifier.<br><br>';

        var state = this.isComplete() ? 'success' : 'error';

        var tempShowLogs = showLogs;
        showLogs = true;
        domLog(cubeOutput, state);
        domLog(this.getCompleteness() + '<br><br>', state);
        showLogs = tempShowLogs;
    }
}


const ids = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz123456789!@#$%&*'.split('');

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

function makeOneBlock(cube) {
    nextBlockId = newRandChar(Object.keys(cube.blocks));

    if (cube.isComplete()) {
        runStop(false, true);
        domStatus(cube.getCompleteness());
        return false;
    }

    domStatus(cube.getCompleteness());

    if (!placeBestBlock(cube, nextBlockId)) {
        cube.removeEdgeBlocks();
    }
}

function placeBestBlock(cube, blockId, tries = 1, batchSize = NUM_TEST_BLOCKS) {
    let testBlocks = Array(batchSize).fill()
        .map(() => new RandomBlock(blockId))
        .filter(block => cube.isValidBlockPlacement(block))
        .map(block => cube.countOpeningsAroundBlock(block), cube)
        .sort((a, b) => a.openings - b.openings);

    if (!testBlocks.length) {
        if (tries % 10 == 0) {
            domLog(`Created a batch of blocks but none fit (${tries})`, 'error');
        }
    } else {
        domLog(`Created batch of ${testBlocks.length} valid blocks, adding the best fit.`);
    }

    if (testBlocks.length && cube.tryAddBlock(testBlocks[0])) {
        return true;
    } else {
        if (tries < MAX_TRIES) {
            return placeBestBlock(cube, blockId, ++tries);
        } else {
            domLog(`Tried too many times...`, 'error');
            return false;
        }
    }
}

function domLog(str, status = 'success', replaceSpaces = false) {
    if (!showLogs) return;
    // log to console
    //console.log(str);

    // replace newlines with <br>
    str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');

    // optionally add nbsp's
    if (replaceSpaces) {
        str = str.replace(/ /g, '\u00a0');
    }

    // output to messages div
    messagesDiv.prepend(`<div class="${status}">${str}</div>`);
}

function domStatus(str) {
    statusDiv.text(`Status: ${str}`);
}

function runStart(event) {

    // stop current loop if running
    if (runInterval) {
        runStop(false, false);
    }

    // create a cube
    mainCube = new Cube();

    // begin runLoop
    runLoop(mainCube);
}

function runLoop(cube) {
    runInterval = setInterval(() => {
        makeOneBlock(cube);
    }, RUN_LOOP_INTERVAL);
}

function runStop(event, success = false) {
    clearInterval(runInterval);
    mainCube.log();

    const message = success ? 'Solved in' : 'Solver interrupted after';
    domLog(`${message} ${mainCube.getElapsedSeconds()}!<br>Cube state:`, success ? 'success' : 'error');
}

function toggleLogs(event) {
    showLogs = !showLogs;
}

let messagesDiv, statusDiv;
let runInterval, mainCube;
let showLogs = true;

$(document).ready(function() {
    // select dom elements
    messagesDiv = $('#messages');
    statusDiv = $('#status');

    // show notes
    domLog(notes, 'warning', true);

    // bind buttons
    $('#start').click(runStart);
    $('#stop').click(runStop);
    $('#toggleLogs').change(toggleLogs);
});


