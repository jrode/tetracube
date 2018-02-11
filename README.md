# tetracube

### Problem

Given a 6x6x6 empty cube and 54 t-tetracube blocks, the goal is to place the blocks within the empty spaces to form a perfect cube, with no inner spaces or outer protrusions.

### Solution

This solver will attempt to brute-force a solution by:

1. Generating batches of randomized blocks (the positions and rotation values are randomized).
2. Ranking these blocks based on highest surface contact if placed into the cube.
3. Placing the highest ranked block into the cube.
4. Validating that the placement did not create enclosed spaces within the cube.
5. Removing the last invalid placement, otherwise continuing by creating a new batch of block candidates.
6. Repeating steps 1-5 over a maximum number of retries.
7. Removing some of the lowest ranked surface-touching blocks when no blocks can be placed after the retry limit.

### Notes

```
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
```