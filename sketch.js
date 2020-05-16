// This is testing git
// All the variables required
let screen;
let started = false;
let startButton;
let fr = 60; //starting FPS
let x_axis
let y_axis

let resolution
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
let shift2 = 0
let visualDone = false
let requiredMoves
let tilesReordered = []
let calledFromTilesReordered = false
let ordered = true


//Code for the pop up
lightBoxClose = function () {
    document.querySelector(".lightbox").classList.add("closed");
}


// Centers the canvas on screen
function centerCanvas(x, y) {
    screen.position((windowWidth - x) / 2, (windowHeight - y) / 4);
}


// ensures responsiveness
function windowResized() {
    centerCanvas();
}


// it creates and returns a 2D Array
function twoDArray(rows, cols) {
    let arrays = new Array(rows);
    for (let i = 0; i < arrays.length; i++) {
        arrays[i] = new Array(cols)
    }
    return arrays;
}


function setup() {
    //checking the device's screen size for responsiveness
    if (windowWidth > 540 && windowHeight > 960) {
        resolution = 200
        x_axis = 600
        y_axis = 600

        console.log((windowWidth - x_axis), windowHeight)
    }
    else {
        resolution = 100
        x_axis = 300
        y_axis = 300
    }

    // creating our canvas
    screen = createCanvas(x_axis, y_axis);
    screen.parent("sketch01")
    background(17, 75, 95);
    frameRate(fr)

    //the "board" is the visual board & the "pseudo_board" is for all the calculation 
    // and the algorithm to run upon
    board = twoDArray(size, size)
    pseudo_board = twoDArray(size, size)

    //title creation
    titleDiv = createDiv('');
    titleDiv.html('<h2 class = "title"><strong><u>8 Puzzle</u></strong></h2>');
    titleDiv.position(0, 10);
    titleDiv.style('font-size', '26px');
    titleDiv.style('width', '100%');
    titleDiv.style('text-align', 'center');
    // let startBtn = document.querySelector(".startBtn");
    // startBtn.style.width = '20%'
    // startBtn.setAttribute("id", "solveBtn")
    // startBtn.addEventListener('mouseup', start)

    //creating A.I Help button
    startButton = createDiv('');
    startButton.html('<button type="button" class="mt-5 btn btn-lg btn-warning startBtn "><strong>Get A.I\'s Help</strong></button>');
    startButton.position(0, ((windowHeight - y_axis) / 4) + y_axis);
    startButton.style('font-size', '26px');
    startButton.style('width', '100%');
    startButton.style('text-align', 'center');
    let startBtn = document.querySelector(".startBtn");
    startBtn.setAttribute("id", "solveBtn")
    startBtn.addEventListener('mouseup', start)
    

    //some initial states for the board
    pseudo_board = [["", 4, 7], [1, 2, 8], [3, 5, 6]]
    // pseudo_board = [[8, 4, 7], [1, "", 6], [3, 2, 5]]
    // pseudo_board = [[8, 5, 2], ["", 4, 3], [6, 7, 1]]

    //creating and visualizing the board
    let name = 1
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++ , name++) {
            board[i][j] = new Tile(i, j, pseudo_board[i][j])
            goal_board[name] = [j, i]
        }
    }
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            board[i][j].show(color(138, 198, 209))
        }
    }

    //keeping track of the blank tile
    blank_i = 0
    blank_j = 0

    //saving the initial position of the blank tile for visual purpose at the end
    initial_i = 0
    initial_j = 0

    //setting up the blank tile
    board[blank_i][blank_j].blank = true
    board[blank_i][blank_j].name = ""
    board[blank_i][blank_j].show(null)

    //pushing the initial state in the queue
    let huristics = manhattanDistance(pseudo_board)
    priorityQ.push([
        pseudo_board,
        0,
        huristics,
        0 + huristics,
        []
    ])

    //keeping track of previous node for optimization purpose
    previousNode = pseudo_board

    centerCanvas(x_axis, y_axis);
}


async function draw() {
    if (started) {
        // We're undoing all user's moves and returning to the initial state here
        if (!ordered) {
            fr = 3
            frameRate(fr)

            console.log(blank_i, blank_j)
            if (shift2 < tilesReordered.length) {
                calledFromTilesReordered = true
                console.log("tile>>>", tilesReordered[shift2], shift2)
                await moveTile(board, tilesReordered[shift2], blank_i, blank_j)
                shift2++
            }
            else {
                shift2 = 0
                tilesReordered = []
                ordered = true
            }
        }

        // This is where all the magic happens of A*
        else if (!inGoalState() && priorityQ.length > 0) {
            fr = 60
            frameRate(fr)

            // taking the state/node from the queue which has the lowest f(n); where f(n) = g(n)+h(n)
            const current = lowestFscoreState()
            moves++

            // it contains the board of the current "best" state
            const currentState = current[0]

            //finding the blank tile's position in the board
            findBlankTile(currentState)

            // finding out the movable tiles at the moment
            const adjacentTiles = adjacentToBlankTiles(blank_i, blank_j, currentState)

            //removing the "current" state from the queue
            priorityQ = priorityQ.filter(item => item !== current)
            console.log("in3", JSON.stringify(adjacentTiles, ">>>", blank_i, blank_j))

            // getting all the successor states of the current state and pushing them in the queue
            for (tile of adjacentTiles) {
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
            }


            // setting our board's (pseudo board) value as like the best board at the moment 
            // which is the board of the current state
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (currentState[i][j] === "") {
                        pseudo_board[i][j] = ""
                    }
                    else {
                        pseudo_board[i][j] = currentState[i][j]
                    }
                }
            }
            previousNode = currentState
            requiredMoves = current[4].reverse()
            console.log("traversing", priorityQ, "->>>")
            console.table(pseudo_board)
            console.log("TILES TO MOVE", "!!!!", current[4])

        }

        // After completing A* search & getting our result, we move the tiles here in the actual board for visualization
        else {
            //low frame rate so that the tiles doesn't move like flash!
            fr = 3
            frameRate(fr)
            priorityQ = []
            if (!visualDone) {
                if (shift < requiredMoves.length) {
                    // using promise(async-await) for synchronisity
                    await moveTile(board, requiredMoves[shift], initial_i, initial_j)
                    shift++
                }
                else {
                    visualDone = true
                }
            }

            // Here we terminate our game by showing some message to the user
            else {
                // puzzle solve message
                var div = createDiv('');
                div.html('<h1>Puzzle is solved!</h1>');
                div.position(0, ((windowHeight - y_axis) / 4) + y_axis + 100);
                div.style('font-size', '24px');
                div.style('width', '100%');
                div.style('text-align', 'center');
                div.style('color', 'rgb(206, 15, 61)');

                // play again prompt button
                var div2 = createDiv('');
                div2.html('<button type="button" class="btn btn-success" style = "background-color: #142850;" onClick="window.location.reload();">Play Again</button>');
                div2.position(0, ((windowHeight - y_axis) / 4) + y_axis + 150);
                div2.style('font-size', '24px');
                div2.style('width', '100%');
                div2.style('text-align', 'center');

                // disabling the solve button
                const startBtn = document.getElementsByClassName("startBtn");
                startBtn[0].disabled = true
                startBtn[0].style.color = 'rgb(221, 221, 221)'
                startBtn[0].style.backgroundColor = 'rgb(150, 119, 119)'
                startBtn[0].textContent = "Solved!";
                noLoop();
                console.log(`We're Done with ${moves - 1} moves!`)
            }
        }
    }
}


// When start button is clicked, the function executes and the algorithm starts
function start() {
    tilesReordered = tilesReordered.reverse()

    var startBtn = document.querySelector(".startBtn")
    startBtn.style.backgroundColor = "#23272b"
    startBtn.style.color = "white"
    startBtn.innerHTML = '<span class="spinner-grow spinner-grow-sm text-danger" role="status" aria-hidden="true"></span> Solving...'
    
    started = true;
    loop();
}


// moves a tile in a board 
async function moveTile(board, tile, x, y) {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j].name === tile) {
                board[x][y].blank = false
                board[x][y].name = board[i][j].name
                board[x][y].show(color(138, 198, 209))
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
    }
}


// let's the user play using the mouse
function mousePressed() {
    let flag = 0
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (mouseX >= board[i][j].x && mouseX <= board[i][j].x + board[i][j].r && mouseY >= board[i][j].y && mouseY <= board[i][j].y + board[i][j].r) {

                // move will only be possible if it is valid
                let adjacentTiles = adjacentToBlankTiles(blank_i, blank_j, pseudo_board)
                if (adjacentTiles.includes(board[i][j].name)) {
                    tilesReordered.push(board[i][j].name)
                    board[blank_i][blank_j].blank = false
                    board[blank_i][blank_j].name = board[i][j].name
                    pseudo_board[blank_i][blank_j] = pseudo_board[i][j]
                    board[blank_i][blank_j].show(color(138, 198, 209))
                    board[i][j].blank = true
                    board[i][j].name = ""
                    pseudo_board[i][j] = ""
                    blank_i = i
                    blank_j = j
                    board[blank_i][blank_j].show(color(1111))
                    ordered = false
                    console.log(tilesReordered, blank_i, blank_j)
                    flag = 1
                }
            }
        }
        if (flag === 1) {
            break
        }
    }
}


// each tile on the board is an object of this type
function Tile(i, j, name) {
    this.i = i
    this.j = j
    this.r = resolution
    this.x = this.i * this.r;
    this.y = this.j * this.r;
    this.name = name
    this.blank = false

    // illustrates the tile's as a rectangle on the board
    this.show = (color) => {
        if (this.blank) {
            fill(255, 227, 237);
            strokeWeight(1);
            stroke(64, 107, 129);
        }
        else {
            fill(color)
            strokeWeight(10);
            stroke(190, 235, 233);
        }
        rect(this.i * this.r, this.j * this.r, this.r - 1, this.r - 1);
        textSize(30);
        textAlign(CENTER);
        fill(255, 253, 249)
        strokeWeight(5)
        stroke(64, 107, 129);
        text(`${this.name}`, this.i * this.r + this.r / 2, this.j * this.r + this.r / 1.5);
    }

}


// returns adjacent tiles of the blank tile
function adjacentToBlankTiles(i, j, currentState) {
    let adjacentTiles = []
    if (i > 0) { adjacentTiles.push(currentState[i - 1][j]); console.log("i>0", currentState[i - 1][j]) }
    if (i < size - 1) { adjacentTiles.push(currentState[i + 1][j]); console.log("i<s-1", currentState[i + 1][j]) }
    if (j > 0) { adjacentTiles.push(currentState[i][j - 1]); console.log("j>0", currentState[i][j - 1]) }
    if (j < size - 1) { adjacentTiles.push(currentState[i][j + 1]); console.log("j<s-1", currentState[i][j + 1]) }
    return adjacentTiles
}


// Checks whether we've reached the goal state or not
function inGoalState() {
    let name = 1
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++ , name++) {
            if (pseudo_board[j][i] != name && (i != 2 || j != 2)) {
                return false
            }
        }
    }
    return true
}


// Here we're calculating our huristics which is the manhattan distance
// it is the sum of the cost of each tile to reach its goal state's position
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
    // console.log(cost)
    return cost
}


// It is actually our priorityQ, it returns the state that has lowest f(n) value 
function lowestFscoreState() {
    let minState = priorityQ[0];
    for (state of priorityQ) {
        if (state[3] < minState[3]) {
            minState = state;
        }
    }
    return minState
}


// here we're making a child state as a successor given a parent state as parameter
function generateState(parentState, tile) {
    const childState = twoDArray(parentState.length, parentState.length)
    console.log("tilr,,,", tile)
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (parentState[i][j] === tile) {
                childState[blank_i][blank_j] = parentState[i][j]
                childState[i][j] = ""
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


// it returns the position of the blank tile on a board
function findBlankTile(currentState) {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (currentState[i][j] === "") {
                blank_i = i
                blank_j = j
            }
        }
    }
}