
// set up ======================================================================
var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);
console.log('map running on ' + 3000);

var WebSocket = require('ws');
var geoip = require('geoip-lite');

// configuration ===============================================================
app.configure(function() {
	app.set('view engine', 'ejs'); // set up ejs for templating
	app.use(express.static(__dirname + '/public')); //to server static files
	app.set('views', __dirname + '/views');
});

// blockchain websocket api ====================================================
// when a client is connected via web socket, start pinging the blockchain api
io.sockets.on('connection', function (socket) {

	var ws = new WebSocket('ws://ws.blockchain.info:8335/inv');
	ws.on('open', function() {
	    ws.send('{"op":"unconfirmed_sub"}'); // subscribe to all new btc txs from blockchain.info
	});

	ws.on('message', function(message) {
		var msg = JSON.parse(message);
    if(msg.x["relayed_by"] !== '127.0.0.1'){
    	console.log(msg);
    	// console.log(msg.x.out[0].value + " BTC sent from IP address " + msg.x["relayed_by"]);
    	var geo = geoip.lookup(msg.x["relayed_by"]);
	    if (geo) {
	    	console.log(geo.city+", "+geo.country+" ["+geo.ll+"] ");
	    	socket.emit('tx', { longitude: geo.ll[0], latitude: geo.ll[1], btc: msg.x.out[0].value/100000000, usd: (msg.x.out[0].value/100000000)*450.91, country: geo.country});
	    }
    }
	});

});

// main route =================================================================
app.get('/', function(req, res) {
	res.render('map.ejs', {}); 	
});


