class Piece {
    constructor(row) {
        // determines what team it's on based on starting position
        // 0: white, 1: black
        if (row <= 1) {
            this.team = 1;
        }
        else if (row >= 6) {
            this.team = 0;
        }

        this.possibleMovements = this.getMovements();
    }
    
    getIcon() {
        return this.icon;
    }

    getTeam() {
        return this.team;
    }
}

class Pawn extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-pawn";
        this.firstMove = true;
    }

    getMovements() {
        const direction = this.team ? 1 : -1;
        return [ [direction, 0], [2 * direction, 0], [direction, 1], [direction, -1]];
    }
}

class Bishop extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-bishop";
    }

    getMovements() {
        this.noRange = true;
        return [ [1, 1], [1, -1], [-1, 1], [-1, -1] ];
    }
}

class Knight extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-knight";

    }

    getMovements() {
        return [ [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2] ];
    }
}

class Rook extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-rook";
        this.firstMove = true;
    }

    getMovements() {
        this.noRange = true;
        return [ [1, 0], [-1, 0], [0, 1], [0, -1] ];
    }
}

class Queen extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-queen";
    }

    getMovements() {
        this.noRange = true;
        return [ [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1] ];
    }
}

class King extends Piece {
    constructor(row) {
        super(row);
        this.icon = "fas fa-chess-king";
        this.firstMove = true;
    }

    getMovements() {
        return [ [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2]];
    }
}


module.exports = { 
    Pawn,
    Bishop,
    Knight,
    Rook,
    Queen,
    King
}