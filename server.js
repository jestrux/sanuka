const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io').listen(server);
const url = require("url");
const randomColor = require("randomColor");

users = [];
connections = [];
usersmap = new Object();

server.listen(process.env.port || 5000);
console.log("Server running!\n");
console.log("Go to localhost:5000 on browser\n");

app.get("*", function(req, res){
	var uri = url.parse(req.url).pathname;
	var filename = unescape(uri);
	
	if(filename == "/")
		res.sendFile(__dirname + '/index.html');
	else
		res.sendFile(__dirname + filename);
});

io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log(socket.id + " connected: %s sockets connected", connections.length);
  // io.clients.push(socket);

  socket.chats = new Object();
	
  var item = {
    id: socket.id,
    name:"user"+socket.id.substring(0, 3),
    color: randomColor({luminosity: 'dark'}),
    time: new Date(),
    desc: "Hey, wanna chat?"
  };

  usersmap[socket.id] = socket;
  users.push(item);

  socket.emit("loggedin", {user: item, users: users});
  io.sockets.emit("newuser", {user: item});

  socket.on("open-chat", function(data){
    var rid = data.receiver.id;
    var message = data.message;
    var sender = users[connections.indexOf(socket)];
    // var chat = socket.chats["chat"+socket.id+rid];
    var chat = socket.chats[rid];
    // console.log(data.receiver);

    if(chat == undefined){
      chat = data.receiver;
      socket.chats[rid] = chat;

      chat.name = sender.name;
      chat.color = sender.color;
      console.log("Channel " + rid + " created!");

      for (var i = 0; i < chat.users.length; i++) {
        if(chat.users[i] == socket.id)
          continue;

        var receiver_id = chat.users[i];
        var receiver_socket = usersmap[receiver_id];
        receiver_socket.chats[rid] = chat;

        receiver_socket.emit("newchat", {from : chat, message: data.message});
      };
    }
    else{
      chat.texts.push(data.message);
      console.log("Channel " + rid + " updated!");

      for (var i = 0; i < chat.users.length; i++) {
        if(chat.users[i] == socket.id)
          continue;

        var receiver_id = chat.users[i];
        var receiver_socket = usersmap[receiver_id];

        receiver_socket.emit("newchat", {from : chat, message: data.message});
      };
    }
  });

	socket.on('disconnect', function(data){
    var user = users[connections.indexOf(socket)];
    connections.splice(connections.indexOf(socket), 1);
    users.splice(connections.indexOf(socket), 1);

    io.sockets.emit("lessuser", {user: user});
		console.log("Disconnected: %s sockets connected", connections.length);
	});
});