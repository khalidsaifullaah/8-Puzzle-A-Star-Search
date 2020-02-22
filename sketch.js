let screen;
let started = false;
let startButton;
let fr = 5; //starting FPS

let board
let pseudo_board
let previousNode
let goal_board = {}
let priorityQ = []
let initial
let size = 3
let blank_i
let blank_j
let initial_i
let initial_j
let moves = 0
let shift = 0
let visualDone = false
let requiredMoves
let tilesReordered = []
let calledFromTilesReordered = false

function centerCanvas() {
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    screen.position(x, y);
}

function twoDArray(rows, cols) {
    let arrays = new Array(rows);
    for (let i = 0; i < arrays.length; i++) {
        arrays[i] = new Array(cols)
    }
    return arrays;
}

function setup() {
    screen = createCanvas(850, 850);
    screen.parent("sketch01")

    background(17, 75, 95);
    frameRate(fr)
    board = twoDArray(size, size)
    pseudo_board = twoDArray(size, size)
    startButton = createButton("Start");
    startButton.addClass("btn-lg btn-success");
    startButton.position(windowWidth - 800, 800);
    startButton.mousePressed(start);
    startButton.parent("sketch01");
    let name = 1
    // pseudo_board = [["", 4, 7], [1, 2, 8], [3, 5, 6]]
    pseudo_board = [[8, 4, 7], [1, "", 6], [3, 2, 5]]
    // pseudo_board = [[8, 5, 2], ["", 4, 3], [6, 7, 1]]
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++ , name++) {
            board[i][j] = new Tile(i, j, pseudo_board[i][j])
            // pseudo_board[i][j] = name
            goal_board[name] = [j, i]
        }
    }
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++ , name++) {
            board[i][j].show(color(69, 105, 144))
        }
    }
    // initial = JSON.parse(JSON.stringify(board))
    // console.log(initial)

    blank_i = 1
    blank_j = 1
    initial_i = 1
    initial_j = 1
    board[blank_i][blank_j].blank = true
    board[blank_i][blank_j].name = ""
    board[blank_i][blank_j].show(null)
    blank = board[blank_i][blank_j]
    // pseudo_board[blank_i][blank_j] = ""
    let huristics = manhattanDistance(pseudo_board)
    priorityQ.push([
        pseudo_board,
        0,
        huristics,
        0 + huristics,
        []
    ])
    previousNode = pseudo_board
    // priorityQ.push({
    //     "searchNode": pseudo_board,
    //     "gScore": 0,
    //     "huristics": huristics,
    //     "fScore": 0 + huristics,
    // })
    centerCanvas();

}

async function draw() {
    if (started) {
        if (!inGoalState() && priorityQ.length > 0) {
            fr = 60
            frameRate(fr)
            const current = lowestFscoreState()
            moves++
            const currentState = current[0]

            //finding the blank tile's position in the board
            setBlankTiles(currentState)

            console.log("in1", JSON.stringify(currentState))
            const adjacentTiles = adjacentToBlankTiles(blank_i, blank_j, currentState)
            // console.log("in2", index)
            //removing the "current" state from the queue
            priorityQ = priorityQ.filter(item => item !== current)
            console.log("in3", JSON.stringify(adjacentTiles, ">>>", blank_i, blank_j))
            for (tile of adjacentTiles) {
                console.log("calling", JSON.stringify(currentState))
                const nextState = generateState(currentState, tile)
                if (JSON.stringify(nextState) != JSON.stringify(previousNode)) {
                    const huristics = manhattanDistance(nextState)
                    const gScore = current[1] + 1
                    const fScore = huristics + gScore
                    priorityQ.push([
                        nextState,
                        gScore,
                        huristics,
                        fScore,
                        [tile].concat(current[4])
                    ])
                }
                else { console.log("HERE I'M") }
            }
            // revealing the current state of the board
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (currentState[i][j] === "") {
                        // board[i][j].blank = true
                        // board[i][j].name = ""
                        pseudo_board[i][j] = ""
                        // board[blank_i][blank_j].show(color(1111))
                        // frameRate(fr)
                    }
                    else {
                        // board[i][j].blank = false
                        // board[i][j].name = currentState[i][j]
                        pseudo_board[i][j] = currentState[i][j]
                        // board[i][j].show(color(56, 140, 207))

                    }
                }
            }
            previousNode = currentState
            requiredMoves = current[4].reverse()
            console.log("traversing", priorityQ, "->>>")
            console.table(pseudo_board)
            console.log("TILES TO MOVE", "!!!!", current[4])

        } else {
            fr = 5
            frameRate(fr)
            priorityQ = []
            if (!visualDone) {
                if (shift < requiredMoves.length) {
                    await moveTile(board, requiredMoves[shift], initial_i, initial_j)
                    shift++
                }
                else {
                    visualDone = true
                }
            }
            else {
                noLoop();
                console.log(`We're Done with ${moves - 1} moves!`)
            }
        }
    }
}
function start() {
    console.log(blank_i, blank_j)
    tilesReordered = tilesReordered.reverse()
    for (tile of tilesReordered) {
        fr = 5
        frameRate(fr)
        calledFromTilesReordered = true
        moveTile(board, tile, blank_i, blank_j)
    }
    tilesReordered = []
    console.log(blank_i, blank_j)
    started = true;
    loop();
}

function windowResized() {
    centerCanvas();
}

async function moveTile(board, tile, x, y) {
    let flag = 0
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j].name === tile) {
                board[x][y].blank = false
                board[x][y].name = board[i][j].name
                board[x][y].show(color(69, 105, 144))
                board[i][j].blank = true
                board[i][j].name = ""
                initial_i = i
                initial_j = j
                if (calledFromTilesReordered) {
                    pseudo_board[x][y] = pseudo_board[i][j]
                    pseudo_board[i][j] = ""
                    blank_i = i
                    blank_j = j
                    calledFromTilesReordered = false
                }
                board[i][j].show(color(1111))
                return
            }

        }
        // if (flag === 1) {
        //     break
        // }
    }
}


function mousePressed() {
    let flag = 0
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (mouseX >= board[i][j].x && mouseX <= board[i][j].x + board[i][j].r && mouseY >= board[i][j].y && mouseY <= board[i][j].y + board[i][j].r) {
                let adjacentTiles = adjacentToBlankTiles(blank_i, blank_j, pseudo_board)
                if (adjacentTiles.includes(board[i][j].name)) {
                    tilesReordered.push(board[i][j].name)
                    board[blank_i][blank_j].blank = false
                    board[blank_i][blank_j].name = board[i][j].name
                    pseudo_board[blank_i][blank_j] = pseudo_board[i][j]
                    board[blank_i][blank_j].show(color(69, 105, 144))
                    board[i][j].blank = true
                    board[i][j].name = ""
                    pseudo_board[i][j] = ""
                    blank_i = i
                    blank_j = j
                    board[blank_i][blank_j].show(color(1111))
                    console.log(tilesReordered)
                    flag = 1
                }
            }
        }
        if (flag === 1) {
            // console.log()
            break
        }
    }
}
function Tile(i, j, name) {
    this.i = i
    this.j = j
    this.r = 200
    this.x = this.i * this.r;
    this.y = this.j * this.r;
    this.name = name
    this.blank = false
    this.show = (color) => {
        if (this.blank) {
            fill(218, 212, 239);
            strokeWeight(1);
            stroke(64, 107, 129);
        }
        else {
            fill(color)
            strokeWeight(10);
            stroke(228, 253, 225);
        }
        rect(this.i * this.r, this.j * this.r, this.r - 1, this.r - 1);
        textSize(30);
        textAlign(CENTER);
        fill(228, 253, 225)
        strokeWeight(5)
        stroke(64, 107, 129);
        text(`${this.name}`, this.i * this.r + this.r / 2, this.j * this.r + this.r / 1.5);
    }

}

function adjacentToBlankTiles(i, j, currentState) {
    let adjacentTiles = []
    if (i > 0) { adjacentTiles.push(currentState[i - 1][j]); console.log("i>0", currentState[i - 1][j]) }
    if (i < size - 1) { adjacentTiles.push(currentState[i + 1][j]); console.log("i<s-1", currentState[i + 1][j]) }
    if (j > 0) { adjacentTiles.push(currentState[i][j - 1]); console.log("j>0", currentState[i][j - 1]) }
    if (j < size - 1) { adjacentTiles.push(currentState[i][j + 1]); console.log("j<s-1", currentState[i][j + 1]) }
    return adjacentTiles
}

function inGoalState() {
    let name = 1
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++ , name++) {
            if (pseudo_board[j][i] != name && (i != 2 || j != 2)) {
                console.log("in", name)
                console.log(false)
                return false

            }


        }
    }
    console.log(true)
    return true
}

function manhattanDistance(board) {
    let cost = 0
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            currentTile = board[i][j]
            goalPosition = goal_board[currentTile]
            if (currentTile != "") {
                if (i > goalPosition[0]) {
                    cost += (i - goalPosition[0])
                } else {
                    cost += (goalPosition[0] - i)
                }
                if (j > goalPosition[1]) {
                    cost += (j - goalPosition[1])
                } else {
                    cost += (goalPosition[1] - j)
                }
            }
        }
    }
    console.log(cost)
    return cost
}

function lowestFscoreState() {
    let minState = priorityQ[0];


    for (state of priorityQ) {
        if (state[3] < minState[3]) {
            minState = state;

        }
    }
    return minState
}

function generateState(parentState, tile) {
    const childState = twoDArray(parentState.length, parentState.length)
    console.log("tilr,,,", tile)
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (parentState[i][j] === tile) {
                // board[blank_i][blank_j].blank = false
                childState[blank_i][blank_j] = parentState[i][j]
                // pseudo_board[blank_i][blank_j] = pseudo_board[i][j]
                // board[blank_i][blank_j].show(color(56, 140, 207))
                // board[i][j].blank = true
                // board[i][j].name = ""
                childState[i][j] = ""
                // blank_i = i
                // blank_j = j
                // board[blank_i][blank_j].show(color(1111))
                // flag = 1
                console.log("in middle", JSON.stringify(childState), blank_i, blank_j, ">>", i, j)
            }
            else {
                if (parentState[i][j] !== "") {
                    childState[i][j] = parentState[i][j]
                }
            }
        }
    }
    console.log(JSON.stringify(parentState), "$$$", JSON.stringify(childState))
    return childState
}

function setBlankTiles(currentState) {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (currentState[i][j] === "") {
                blank_i = i
                blank_j = j
            }
        }
    }

}