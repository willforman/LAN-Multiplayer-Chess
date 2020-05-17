const socket = io();

const nameButton = document.querySelector("#nameButton");
const nameField = document.querySelector("#nameField");
const nameForm = document.querySelector(".name")
const nameText = document.querySelector("#nameText");
const hostButton = document.querySelector("#host");
const rooms = document.querySelector(".games");

let name = "";

socket.on("get state", () => {
    socket.emit("state", "menu");
});

// gets name
nameButton.addEventListener("click", (e) => {
    e.preventDefault();

    name = nameField.value; // gets name

    if (!name) {
        alert("You must enter a name");
        return;
    }
    
    socket.emit("add name", name);
    
    socket.on("name", (nameTaken) => {
        if (nameTaken) {
            alert(`The username ${nameTaken} is taken.`);
        }
        else {
            nameText.innerHTML = `Username: ${name}`;
    
            nameForm.style.visibility = "hidden";
        }
    });
});

// if given game, adds it to the list of open game
function addRoom(hostName) {
    const room = document.createElement("li");
    room.innerHTML = hostName;
    rooms.appendChild(room);
};

// initializes lobbies that are open already
socket.on("init rooms", (hosts) => {
    hosts.forEach( (host) => addRoom(host));
});

// removes element of host if in the list
socket.on("remove host", (hostToRemove) => {
    // gets element of host to remove
    const hosts = rooms.childNodes;

    for (const host of hosts) {
        if (host.innerHTML == hostToRemove){
            host.remove();
        }
    }
});

// button clicked to host game
hostButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (!name) {
        alert("You must select a name first");
        return;
    }

    // hides button so player can't host more than one game
    hostButton.style.visibility = "hidden";
    socket.emit("create room", name);
});

socket.on("room created", (hostName) => {
    addRoom(hostName);
});

// user clicks on a room to join
rooms.addEventListener("click", (e) => {
    e.preventDefault();

    if (!name) {
        alert("You must select a name first");
        return;
    }

    const host = e.target.innerHTML;

    if (host == name){
        alert("You can't join your own room");
        return;
    }

    socket.emit("join room", name, host);
});

socket.on("play game", (playerName, roomName) => {
    window.location.replace("./chess.html" + "?name="
    + playerName + "&room=" + roomName);
});