const path = require('path');
const express = require('express');
const http = require('http')
const socket = require('socket.io');
const Game = require("./Chess/Game");

const app = express();
const server = http.createServer(app);
const io = socket(server);

// chooses user specified port if there is one, 3000 if not
const PORT = process.env.PORT || 3000;

// sets static folder
app.use(express.static(path.join(__dirname, 'public')));

const rooms = {}; // rooms created since server started
const hosts = []; // hosts currently in a open room
const names = []; // names of users currently in server, so there's no duplicates

io.on("connection", (socket) => {
    // asks client if they are in menu or in game
    // this is because a new socket is created when players move from the
    // menu html page to game html page
    socket.emit("get state");
    socket.on("state", (state) => {
        if (state == "menu") {
            console.log("user connected");
            socket.emit("init rooms", hosts);
            socket.join("menu");
        }
    });

    // checks if name is already being used, if not, adds this name
    socket.on("add name", (name) => {
        if (names.includes(name)) {
            socket.emit("name", name);
        }
        else {
            socket.emit("name", false);
            // adds to list of taken names
            names.push(name);
            // adds to socket so can be retrieved when client disconnects
            socket.name = name;
        }
    });

    // if player clicks host room in client
    socket.on("create room", (hostName) => {
        hosts.push(hostName);
        // has to save hostsocket so can retrieve it later
        const room = {
            hostSocket: socket,
        }
        // saves room as a property of the rooms object
        rooms[hostName] = room;
        io.to("menu").emit("room created", hostName);
    });

    socket.on("join room", (joiningPlayerName, hostName) => {
        // gets room to join using hosts name
        const room = rooms[hostName];
        // gets host socket
        const hostSocket = room.hostSocket;

        // removes host name from list,
        // and the joining player if they're hosting also
        removeHost(hostName);
        removeHost(joiningPlayerName);

        // creates game and adds it to room
        room.game = new Game(hostName, joiningPlayerName);
        
        // switches both screens to game screen
        socket.emit("play game", joiningPlayerName, hostName);
        hostSocket.emit("play game", hostName, hostName);
        // hostSocket not needed anymore
        delete room.hostSocket;
    });

    // when a game is started, the board is sent to
    // both of the clients
    socket.on("init game", (roomName, name) => {
        // adds socket to a socket.io room of just the two players
        socket.join(roomName);

        // name is removed from list when user joins game,
        // because old socket disconnects, so need to readd this name
        names.push(name);
        
        const game = rooms[roomName].game;
        const board = game.board;

        let moveNext = null;
        let availableMoves = null;

        if (name == game.white) {
            moveNext = true;
            availableMoves = game.getMovesTeam(0);
        }
        else {
            moveNext = false;
            availableMoves = game.getMovesTeam(1);
        }
        
        socket.emit("board", board, availableMoves, moveNext);
    });

    // when player sends their move to the server
    socket.on("move", (playerName, roomName, initialPosition, finalPosition) =>  {
        // finds correct room and gets it's game
        const game = rooms[roomName].game;
        
        // gets team that is moving
        const teamMakingMove = game.board.getPiece(initialPosition).team;

        // moves piece and is returned null, unless the move is castling,
        // which returns initial and final piece locations
        const castling = game.playerMove(initialPosition, finalPosition);

        // has to tell the client that just moved to also move the rook
        if (castling) {
            socket.emit("castling", castling);
        }
        
        // gets the team that didn't make the move
        const otherTeam = teamMakingMove ? 0 : 1;
        
        // looks for check on this team
        const check = game.lookForCheck(otherTeam);

        // if there's check and checkmate, sends move and ends game
        if (check && game.isCheckMate(otherTeam)) {
            const result = team ? "Black wins": "White wins";
            socket.to(roomName).broadcast.emit("opponent move", initialPosition,
            finalPosition);
            io.in(roomName).emit("result", result);
        }
        else {
            // gets the correct set of available moves based
            // on who's turn is next
            const oppAvailableMoves = playerName == game.white ?
            game.getMovesTeam(1) : game.getMovesTeam(0);

            // gets new available moves for opponent who's turn it is now
            socket.to(roomName).broadcast.emit("opponent move", initialPosition, 
            finalPosition, oppAvailableMoves, check, castling);
        }
    });

    socket.on("disconnect", (reason) => {
        // used for debugging random disconnects
        if (reason != "transport close") {
            console.log("Socket disconnected because of " + reason);
        }

        // gets name of player disconnecting
        const name = socket.name;
        
        // removes them from list of taken names
        const indexOfName = names.indexOf(name);
        names.splice(indexOfName, 1);

        // removes them from host list if they're on there
        removeHost(name);
    });

    // removes the host from the list of hosts, if they're on there
    function removeHost(hostName){
        // removes hosts name from hosts
        const arrayOfHost = hosts.indexOf(hostName);
        // check if the player is hosting
        if (arrayOfHost != -1) {
            hosts.splice(arrayOfHost, 1);
            // tells client to remove host name from list
            socket.to("menu").emit("remove host", hostName);
        }
    }
});

// server starts listening on given port
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}...`);
});