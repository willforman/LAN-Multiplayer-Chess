const Pawn  = require("./Piece").Pawn;
const Bishop = require("./Piece").Bishop;
const Knight = require("./Piece").Knight;
const Rook = require("./Piece").Rook;
const Queen = require("./Piece").Queen;
const King = require("./Piece").King;

class Board {
    constructor() {
        this.initBoard();
    }

    initBoard() {
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board.push([]);
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = addPiece(row);
            }
        }

        // adds piece if there should be one there
        function addPiece(row, col) {
            // gets rid of all squares where there are no pieces
            if (row > 1 && row < 6){
                return null;
            }
            
            switch (row) {
                case 1:
                case 6: 
                    return new Pawn(row, col);
                case 0:
                case 7:
                    return getPieceByCol(row, col);
            }
    
            // used for last row where pieces are in specific order
            function getPieceByCol(row, col) {
                if (col == 0 || col == 7) {
                    return new Rook(row, col);
                }
                
                else if (col == 1 || col == 6) {
                    return new Knight(row, col);
                }
                
                else if (col == 2 || col == 5 ) {
                    return new Bishop(row, col);
                } 
    
                else if (col == 3) {
                    return new Queen(row, col);
                }
    
                else {
                    return new King(row, col);
                }
            }
        }
    }

    locationsEqual(loc1, loc2) {
        if (loc1[0] == loc2[0]) {
            if (loc1[1] == loc2[1]) {
                return true;
            }
        }
        return false;
    }

    getPiece(position) {
        return this.board[position[0]][position[1]];
    }

    setPiece(position, piece) {
        this.board[position[0]][position[1]] = piece;
    }

    getPieceChange(position, change) {
        return this.board[+position[0] + +change[0]][position[1] + position[1]];
    }

    getDestination(position, change) {
        return [position[0] + change[0], position[1] + change[1]];
    }

    movePiece(initialPosition, finalPosition) {
        let piece = this.getPiece(initialPosition);

        // replaces whatever is in final position with piece
        this.setPiece(finalPosition, piece);
        // gets rid of piece in starting position
        this.board[initialPosition[0]][initialPosition[1]] = null;
    }

    getPieceLocations(team) {
        const locations = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.team == team) {
                        locations.push([row, col]);
                    }
                }
            }
        }

        return locations;
    }

    // returns position of king on indicated team
    findKing(team) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece([row, col]);
                if (piece) {
                    if (piece.constructor.name == "King" && piece.team == team) {
                        return [row, col];
                    }
                }
            }
        }
    }

    // transforms pieces on board from piece objects just to string representation
    // so it can be sent to client
    sendBoard() {
        const transformBoard = [];
        for (let row = 0; row < 8; row++) {
            transformBoard.push([]);
            for (let col = 0; col < 8; col++) {
                const pieceHere = this.board[row][col];
                if (pieceHere) {
                    transformBoard[row][col] = pieceHere.constructor.name;
                }
            }
        }
    }

    print() {
        for (let row = 0; row < 8; row++) {
            let rowString = "";
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece) rowString += "'";
                else {
                    const pieceName = piece.constructor.name;
                    
                    if (pieceName == "Pawn") {
                        if (piece.team) {
                            rowString += "P";
                        }
                        else {
                            rowString += "p";
                        }
                    }
                    if (pieceName == "Bishop") {
                        if (piece.team) {
                            rowString += "B";
                        }
                        else {
                            rowString += "b";
                        }
                    }
                    if (pieceName == "Knight") {
                        if (piece.team) {
                            rowString += "N";
                        }
                        else {
                            rowString += "n";
                        }
                    }
                    if (pieceName == "Rook") {
                        if (piece.team) {
                            rowString += "R";
                        }
                        else {
                            rowString += "r";
                        }
                    }
                    if (pieceName == "Queen") {
                        if (piece.team) {
                            rowString += "Q";
                        }
                        else {
                            rowString += "q";
                        }
                    }
                    if (pieceName == "King") {
                        if (piece.team) {
                            rowString += "K";
                        }
                        else {
                            rowString += "k";
                        }
                    }
                }
            }
            console.log(rowString);
        }
    }
}

module.exports = Board;