const express = require("express");
const app = express();
const http = require("http");
const io = require('socket.io').listen(http);

const path = require("path")
const url = require("url")
const fs = require("fs")

const mimeTypes = {
	"html" : "text/html",
	"css" : "text/css",
	"js" : "text/javascript",
	"jpeg" : "image/jpeg",
	"jpg" : "image/jpg",
	"png" : "image/png",
	"gif" : "image/gif"
};

users = [];
connections = [];

// http.listen(process.env.port || 3000);
console.log("Server running!");

http.createServer(function(req, res){
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), unescape(uri))
	var stats;

	console.log("loading ", uri);

	try{
		stats = fs.lstatSync(filename);
	} catch(e){
		res.writeHead(404, {'Content-type' : 'text/plain'});
		res.write('404 not found\n');
		res.end();
		return;
	}

	if(stats.isFile()){
		var mimetype = mimeTypes[path.extname(filename).split(".").reverse()[0]];
		res.writeHead(200, {'Content-type' : mimetype});

		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(res);
	}
	else if(stats.isDirectory()){
		res.writeHead(302, {
			'Location' : 'index.html'});
	}
	else{
		res.writeHead(500, {'Content-type' : 'text/plain'});
		res.write('500 Interal Error\n');
		res.end();
	}
}).listen(5000);



io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log("Connected: %s sockets connected", connections.length);

	socket.on('disconnect', function(data){
		connections.splice(connections.indexOf(socket), 1);
		console.log("Disconnected: %s sockets connected", connections.length);
	});
});