const Board = require("./Board");

class Game {
    constructor(host, guest) {
        this.white = host;
        this.black = guest;
        this.board = new Board();
        this.coveredSquares = [];
        this.setCoveredSquares();
    }

    setCoveredSquares() {
        this.setCoveredSquaresTeam(0);
        this.setCoveredSquaresTeam(1);
    };

    // sets the squares that are covered by a team
    // used when searching if king is in check
    setCoveredSquaresTeam(team) {
        const coveredSquares = [];
        const pieceLocations = this.board.getPieceLocations(team);

        pieceLocations.forEach( (loc) => {
            const moves = this.getAvailableMoves(loc);
        
            moves.forEach( (move) => {
                // iterates through the already found squares to find
                // if this move is already in coveredSquares
                const found = coveredSquares.some( (coveredSquare) => {
                    return this.board.locationsEqual(move, coveredSquare);
                });

                if (!found) {
                    coveredSquares.push(move);
                }
            });
        });

        this.coveredSquares[team] = coveredSquares;
    }

    // returns array of objects containing a position
    // and all possible moves by the piece at this position.
    // used only when sending to client
    getMovesTeam(team) {
        const teamMoves = [];
        const pieceLocations = this.board.getPieceLocations(team);

        pieceLocations.forEach( (loc) => {
            const movesOfPiece = {
                loc,
                moves: this.getLegalMoves(loc),
            }
            teamMoves.push(movesOfPiece);
        });

        return teamMoves;
    }

    // used when testing moves if they are legal
    movePiece(initialPosition, finalPosition) {
        this.board.movePiece(initialPosition, finalPosition);
        this.setCoveredSquares();
    }

    // used only when a player moves a piece
    playerMove(initialPosition, finalPosition) {
        const piece = this.board.getPiece(initialPosition);
        
        this.movePiece(initialPosition, finalPosition);
        
        if (piece.firstMove) {
            piece.firstMove = false;
        }

        // need special communication to client when a player is castling
        // returns the initial and final location of the rook castling with
        if (piece.constructor.name == "King") {
            const colChange = finalPosition[1] - initialPosition[1];
            if (colChange == 2 || colChange == -2) {
                const rookRow = initialPosition[0]; // row of rook is same as king
                // if king is going to right, rook is right corner (col = 7)
                // if king is going to left, rook is left corner (col = 0)
                const rookCol = colChange == 2 ? 7 : 0;
                const finalRookCol = colChange == 2 ? 5 : 3;
    
                return [[rookRow, rookCol], [rookRow, finalRookCol]];
            }
        }
    }

    // gets all moves of piece
    getAvailableMoves(position) {
        const piece = this.board.getPiece(position);
        const movements = piece.possibleMovements;
        const availableMoves = [];
        
        // first gets all possible moves
        movements.forEach( (movement) => {
            if (piece.noRange) {
                let currentPosition = position;
                let finalPosition = null;
                do {
                    finalPosition = this.getValidDestination(piece, currentPosition, movement);
                    if (finalPosition) {
                        availableMoves.push(finalPosition);
                        currentPosition = finalPosition;
                    }
                } while(finalPosition && !this.board.getPiece(currentPosition))
                    // !this.getPiece(currentPosition()) ends the loop when piece lands
                    // on enemy piece 
            }
            else {
                const finalPosition = this.getValidDestination(piece, position, movement)
                if (finalPosition) {
                    availableMoves.push(finalPosition);
                }
            }  
        });

        return availableMoves;
    }

    // first gets any available moves by pieces, then makes sure these move wouldn't cause check
    getLegalMoves(position) {
        const availableMoves = this.getAvailableMoves(position);

        const legalMoves = availableMoves.filter( (finalPos) => {
            return !this.causesCheckOnOwnKing(position, finalPos);
        });

        return legalMoves;
    }

    getValidDestination(piece, position, change) {
        const finalPosition = this.board.getDestination(position, change);

        // tests to rule out move

        // test if piece is in bounds of the board
        if (finalPosition[0] < 0 || finalPosition[0] > 7) {
            return null;
        }
        if (finalPosition[1] < 0 || finalPosition[1] > 7) {
            return null;
        }

        // test if piece is already in spot want to move to
        const pieceAtFinalPos = this.board.getPiece(finalPosition);
        if (pieceAtFinalPos) {
            if (pieceAtFinalPos.team == piece.team) {
                return null;
            }
        }

        // tests for pawns
        if (piece.constructor.name == "Pawn") {
            // pawn can move two squares on first move
            // tells if it's first move based on what row it's in
            if (!piece.firstMove && (change[0] == 2 || change[0] == -2)) {
                return null;
            }
            // pawn can move one square diagonally when capturing
            if (!pieceAtFinalPos) {
                if (change[1] == 1 || change[1] == -1) {
                    return null;
                }
            }
            // pawn can't capture moving straight vertically
            if (pieceAtFinalPos) {
                if (change[1] == 0) {
                    return null;
                }
            }
        }

        // check for castling
        if (piece.constructor.name == "King" && (change[1] == 2 || change[1] == -2)) {
            if (!piece.firstMove) {
                return null;
            }
            // gets column of rook based on if king is going to right or left
            const rookCol = change[1] == 2 ? 7 : 0;
            const rookRow = piece.team == 0 ? 7 : 0;
            const rook = this.board.getPiece([rookRow, rookCol]);
            if (!rook) {
                return null;
            }
            if (!rook.firstMove) {
                return null;
            }
        }

        return finalPosition;
    }

    // moves piece, checks if it causes check, then moves piece back
    causesCheckOnOwnKing(position, finalPosition) {
        // gets own team so can use this to look for check afterwards
        const team = this.board.getPiece(position).team;

        // saves piece at final position so it can be put back
        const pieceAtFinalPos = this.board.getPiece(finalPosition);

        // check if move would cause check
        this.movePiece(position, finalPosition);
        const result = this.lookForCheck(team);

        // moves piece back
        this.movePiece(finalPosition, position);
        // puts back piece that was in spot
        this.board.setPiece(finalPosition, pieceAtFinalPos);
        
        return result;
    }

    // looks for check on indicated team
    lookForCheck(team) {
        const kingLoc = this.board.findKing(team);
        const enemyTeam = team ? 0 : 1;
        const enemyCoveredSquares = this.coveredSquares[enemyTeam];
        
        return enemyCoveredSquares.some( (square) => {
            return this.board.locationsEqual(square, kingLoc); 
        });
    }

    isCheckMate(team) {
        const kingLoc = this.board.findKing(team);
        const kingMoves = this.getLegalMoves(kingLoc);

        // console.log("King moves");
        // console.log(kingMoves);
        // if king can move somewhere that won't lead to it being check
        if (kingMoves.length) {
            return false;
        }

        const teamMoves = this.getMovesTeam(team);

        // want true if it's checkmate
        // isn't checkmate if there exists one move out of one piece
        // that doesn't lead to check

        return !teamMoves.some( (piece) => {
            return piece.moves.some( (finalPos) => {
                const dontCauseCheck = !this.causesCheckOnOwnKing(piece.loc, finalPos)
                // console.log("Does this cause check?" + !dontCauseCheck);
                return dontCauseCheck;
            });
        });
    }

    printAllAvailableMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece([row, col]);
                if (piece) {
                    console.log(`${piece.constructor.name} at pos [${row}, ${col}]`+
                    ` has available moves:\n${this.getAvailableMoves([row, col])}`);
                }
            }
        }
    }
}

module.exports = Game;