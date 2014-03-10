var express = require('express'),	
	http = require('http'),
	app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server);

// to serve images
app.use(express.static(__dirname + '/public/'));
	
// routing
app.get("/", function(req, res) {
	res.sendfile(__dirname + '/index.html');
});

server.listen(3000);

var usernames = {};

io.sockets.on('connection', function(socket) {

	// when the client emits sendchat, this listens and executes
	socket.on('sendchat', function(data) {
		//if a note has been made, write to notes.txt
		if (data.substring(0,5) == "/note") {
			var fs = require('fs');
			//open writestream with append
			var wstream = fs.createWriteStream('./public/notes.txt', { flags: 'a',
  			encoding: null,
  			mode: 0666 });
			wstream.write(data.substr(6)+'\n');
			wstream.end();
		}
		//if a dice has been rolled, generate a random number
		if (data == "/d10") {
  			data = "rolls d10: " + Math.floor((Math.random()*10)+1);
  		}
  		if (data == "/d20") {
  			data = "rolls d20: " + Math.floor((Math.random()*20)+1);
  		}
  		if (data == "/d6") {
  			data = "rolls d6: " + Math.floor((Math.random()*6)+1);
  		}
    
		
		// tell the client to execute updatechat with 2 paramaters
		io.sockets.emit('updatechat', socket.username, data);
	});

	// when the client emits adduser this listen and executes
	socket.on('adduser', function(username) {
		// we store the username in the socket session for this client
		socket.username = username;
		// add username to global list
		usernames[username] = username;
		// echo to client that they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat,client side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects
	socket.on('disconnect', function() {
		// remove username from global list
		delete usernames[socket.username];
		// update list of users in chat client side
		io.sockets.emit('updateusers', usernames);
		// echo globally that the user has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has left');
	});
});
