const socket = io();

// gets player name and room name from url
const url = window.location.search;
const urlParams = new URLSearchParams(url);

const playerName = urlParams.get("name");
const roomName = urlParams.get("room");

let resultText = document.querySelector("#resultText");
let checkText = document.querySelector("#inCheck");

const squares = [];
let allAvailableMoves = [];
let availableMovesSquares = [];
let lastSelectedSquare = null;
let lastMoveSquare = null;
let moveNext = null;

// when game starts, need to get board and available moves
socket.emit("init game", roomName, playerName);
socket.on("board", (board, availMoves, next) => {
    drawBoard(board.board);
    allAvailableMoves = availMoves;
    moveNext = next;
    if (moveNext) {
        resultText.innerHTML = "Your turn";
    }
    else {
        resultText.innerHTML = "Waiting for opponent";
    }
});

// draws board with given pieces
function drawBoard(givenBoard) {
    for (let row = 0; row < 8; row++) {
        // this variable alternates 0 and 1
        // makes each row alternate colors from the one above
        const alternate = row % 2;

        squares.push([]);
        for (let col = 0; col < 8; col++) {
            // this section draws each square of board
            const square = document.createElement("div");
            square.classList.add("square");
            square.addEventListener("click", showAvailableMoves);

            // 0 is light color, 1 is dark
            const color = (col + alternate) % 2 ? "light": "dark";
            square.classList.add(color);
            
            // stores row and column so the square can be
            // found more easily when clicked on
            square.setAttribute("data-row", row);
            square.setAttribute("data-col", col);
            
            // adds square to appropriate areas
            board.appendChild(square);
            squares[row][col] = square;

            // this section draws piece if there is one there
            const piece = givenBoard[row][col];
            if (piece) {
                const pieceElem = document.createElement("i");
                pieceElem.className = piece.icon;
                
                if (row >= 6) {
                    pieceElem.style.color = "white";
                }
                else {
                    pieceElem.style.color = "black";
                }
                square.appendChild(pieceElem);
            }
        }
    }
}

function showAvailableMoves(event) {
    // doesn't show if it's not this players turn
    if (!moveNext) {
        return;
    }

    // gets square selected and row and column of it
    const square = event.target;
    const row = square.dataset.row;
    const col = square.dataset.col;
    
    // gets if the piece there has any available moves
    // object has two props: position, and available moves
    const availableMovesObj = getAvailableMovesHere([row, col]);
    if (!availableMovesObj) {
        return;
    }

    function getAvailableMovesHere(location) {
        return allAvailableMoves.find( (availMovesObj) => {
            return locationsEqual(location, availMovesObj.loc);
        });

        function locationsEqual(loc1, loc2) {
            if (loc1[0] == loc2[0]) {
                if (loc1[1] == loc2[1]) {
                    return true;
                }
            }
            return false;
        }
    }

    const availableMoves = availableMovesObj.moves;
    
    setSelectedPiece(square);
    setAvailableMovesSquares(availableMoves);
}

function setSelectedPiece(square) {
    clearSelectedPiece();
    
    lastSelectedSquare = square;

    // applies classes to squares of selected piece and it's
    // available moves to change appearance
    lastSelectedSquare.classList.add("selected");
}

function clearSelectedPiece() {
    // check to make sure there was a selected square already
    if (lastSelectedSquare) {
        lastSelectedSquare.classList.remove("selected");
    }
    lastSelectedSquare = null;
}

function setAvailableMovesSquares(availableMoves) {
    clearAvailableMovesSquares();

    // gets each each square for each available move,
    // then applies class and eventlistener to them,
    // then adds it to availableMovesSquares
    availableMoves.forEach( (location) => {
        const square = squares[location[0]][location[1]];
        square.classList.add("availMove");
        square.addEventListener("click", clickMove);
        availableMovesSquares.push(square);
    });
}

function clearAvailableMovesSquares() {
    // gets rid of previously selected squares
    availableMovesSquares.forEach( (square) => {
        square.classList.remove("availMove");
        square.removeEventListener("click", clickMove); 
    });
    availableMovesSquares = [];
}

// called when an available move is clicked
function clickMove(event) {
    const clickedSquare = event.target;

    move(lastSelectedSquare, clickedSquare);

    clearSelectedPiece();
    clearAvailableMovesSquares();

    checkText.innerHTML = "";
}

// moves piece and sends to the server the move
// 0, 0 on board is top left
function move(initialSquare, finalSquare) {
    movePiece(initialSquare, finalSquare);

    const initialPosition = convSquareToPos(initialSquare);
    const finalPosition = convSquareToPos(finalSquare);
    
    socket.emit("move", playerName, roomName, initialPosition, finalPosition);
    
    moveNext = false;
    resultText.innerHTML = "Waiting for opponent";
    
    // un-highlights the last move
    if (lastMoveSquare) {
        lastMoveSquare.classList.remove("lastMove");
        lastMoveSquare = null;
    }
}
    
// moves the piece on the board
function movePiece(initialSquare, finalSquare) {
    const piece = initialSquare.children[0];

    // removes piece from square if it is there
    const pieceHere = finalSquare.children[0];
    if (pieceHere) {
        pieceHere.parentElement.removeChild(pieceHere);
    }
    
    // removes from parent element
    piece.parentElement.removeChild(piece);

    // puts it in final square
    finalSquare.appendChild(piece);
}

function convSquareToPos(square) {
    return [square.dataset.row, square.dataset.col];
}

function convPosToSquare(position) {
    return squares[position[0]][position[1]];
}

socket.on("opponent move", (initialPosition, finalPosition, availMoves, check) => {
    const initialSquare = convPosToSquare(initialPosition);
    const finalSquare = convPosToSquare(finalPosition);
    
    movePiece(initialSquare, finalSquare);

    // highlights square of opponent's move so user can see
    finalSquare.classList.add("lastMove");
    // saves this square so can get rid of this highlight later
    lastMoveSquare = finalSquare;

    allAvailableMoves = availMoves;
    moveNext = true;
    resultText.innerHTML = "Your turn";
    
    // this if statement checks if server sent that this player
    // is in check
    if (check) {
        checkText.innerHTML = "Check";
    }
});

socket.on("result", (result) => {
    resultText.innerHTML = result;
    squares.forEach( (square) => {
        square.removeEventListener("click", showAvailableMoves);
    });
});