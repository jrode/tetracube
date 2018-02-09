/*global $:true*/

const CUBE_SIDE_LENGTH = 6;
const NUM_BLOCKS = 54;

/*

Block class

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
                                   /       |
x: 0                      t = 0 --/       -┤  t = 1
y: 0                             /         |
z: 0
r: 0
s: 0
t: 0

*/

var count = { numBlocks: 0 };
var orientations = {};
var points = {};

function createRelativeBlock(r, s, t) {
    var orientationKey = `${r}${s}${t}`;
    orientations[orientationKey] = null;
    points[orientationKey] = [];

    // empty 3x3 cube
    var m = [
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ]
    ];

    const positionsRelative = {
        front:  [0, 1, 1],
        back:   [2, 1, 1],
        left:   [1, 2, 1],
        right:  [1, 0, 1],
        up:     [1, 1, 2],
        down:   [1, 1, 0],
        center: [1, 1, 1],
    };

    const positions = {
        front:  [-1, 0, 0],
        back:   [ 1, 0, 0],
        left:   [ 0, 1, 0],
        right:  [ 0,-1, 0],
        up:     [ 0, 0, 1],
        down:   [ 0, 0,-1],
        center: [ 0, 0, 0],
    };

    function flip(side) {
        switch (side) {
            case 'front' : m[0][1][1] = 1;
            case 'back'  : m[2][1][1] = 1;
            case 'left'  : m[1][2][1] = 1;
            case 'right' : m[1][0][1] = 1;
            case 'up'    : m[1][1][2] = 1;
            case 'down'  : m[1][1][0] = 1;
            case 'center': m[1][1][1] = 1;
        }
    }

    function flipMany(sides) {
        count.numBlocks++;

        var key = sides[0] + '-' + sides[1];
        if (count.hasOwnProperty(key)) {
            count[key]++;
        } else {
            count[key] = 1;
        }
        var key2 = sides.join('-');
        if (count.hasOwnProperty(key2)) {
            count[key2].push(orientationKey);
        } else {
            count[key2] = [orientationKey];
        }

        orientations[orientationKey] = key2;
        
        sides.map(flip);
    }

    function flipSwitch(order, index) {
        flip(order[index]);
    }

    // "a" to "c" orientation
    const frontToBack = (r == 0 && t == 0) || (r == 2 && t == 2);
    const backToFront = (r == 0 && t == 2) || (r == 2 && t == 0);
    const upToTheDown = (r == 0 && t == 1) || (r == 1 && t == 1) || (r == 2 && t == 3) || (r == 3 && t == 1);
    const downToTheUp = (r == 0 && t == 3) || (r == 1 && t == 3) || (r == 2 && t == 1) || (r == 3 && t == 3);
    const leftToRight = (r == 1 && t == 0) || (r == 3 && t == 2);
    const rightToLeft = (r == 1 && t == 2) || (r == 3 && t == 0);

    
    // if (!(frontToBack || backToFront || upToTheDown || downToTheUp || leftToRight || rightToLeft)) {
    //     console.log('DIDNT FIND ANY', {r,s,t});
    //     console.log({r,s,t,frontToBack,backToFront,upToTheDown,downToTheUp,leftToRight,rightToLeft});
    // }

    var p = {
        a: null,
        b: 'center',
        c: null,
        d: null
    };

    var dPos;

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

    //flipMany(Object.values(p));

    // m.forEach((slice, x) => {
    //     slice.forEach((row, y) => {
    //         row.forEach(z => {
    //             console.log({x, y, z});
    //             if (m[x][y][z]) {
    //                 points[orientationKey].push([x, y, z]);
    //             }
    //         });
    //     });
    // });

    for (var dot in p) {
        //console.log(dot, p[dot]);
        points[orientationKey].push(positions[p[dot]]);
    }

    return m;
}

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
        return points[this.getOrientationKey()];
    }

    getAbsoluteDotPositions() {
        return this.getRelativeDotPositions().map(pt => {
            return [pt[0] + this.x, pt[1] + this.y, pt[2] + this.z];
        });
    }

    // middle spot
    getPositionB() {
        return [this.x, this.y, this.z];
    }

    // 0 = a, 1 = b, 2 = c, 3 = d
    getPosition(n) {

    }

    getDefaultPositionA() {
        return [this.x - 1, this.y, this.z];
    }

    getDefaultPositionC() {
        return [this.x + 1, this.y, this.z];
    }

    getDefaultPositionD() {
        return [this.x, this.y + 1, this.z];
    }

    getB() {
        return this.getPositionB();
    }

    getA() {
        return this.rotate(this.getDefaultPositionA());
    }

    getC() {
        return this.rotate(this.getDefaultPositionC());
    }

    getD() {
        return this.rotate(this.getDefaultPositionD());
    }

    rotate(pre) {
        var post = [pre[0], pre[1], pre[2]];
        // set x or y (0 or 1 index) off by 1
        //console.log(this.s);
        switch (this.s) {
            case 0:
                post[0]++;
            case 1:
                post[1]++;
            case 2:
                post[0]--;
            case 3:
                post[1]--;
        }

        return post;
    }

    getPositionC() {

    }

    isOutsideCube() {

    }

    log() {
        var vars = {
            x, y, z, r, s, t, id
        } = this;
        console.log(vars);
    }
}

function rand(n) {
    return Math.floor(Math.random() * n);
}

function makeRandomBlock(id) {
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

function makeValidRandomBlock(id) {
    return makeRandomBlock(id);
}

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

function generatePointsLookup() {
    const dirs = [0, 1, 2, 3];
    dirs.forEach(r => {
        dirs.forEach(s => {
            dirs.forEach(t => {
                createRelativeBlock(r, s, t);
            });
        });
    });
}

generatePointsLookup();

$(document).ready(function() {

    var block = makeValidRandomBlock('a');

    console.log(block.getRelativeDotPositions(), block.getAbsoluteDotPositions());

    var cube = new Cube(CUBE_SIDE_LENGTH);
    cube.addBlock(block);
    //cube.log();

    console.log(points);
    
});

