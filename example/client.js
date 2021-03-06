var events = require('events');
var util = require('util');
var fs = require('fs');
var getmac = require('getmac');
var zrpc = require('../iris-rpc');

function Client(mac) {
    var self = this;
    events.EventEmitter.call(this);
    self.pingDataObject = {
        iteration : 0
    }

    self.certificates = {
        key: fs.readFileSync(__dirname + '/certificates/example.key').toString(),
        cert: fs.readFileSync(__dirname + '/certificates/example.crt').toString(),
        ca: [ ]
    }

    var rpc = new zrpc.Client({
        address: "127.0.0.1:4488",
        auth: "f72d7c54d7354f7a8f9d111c6033b6281e7096acc4dcb198763a4555f264259d",
        certificates: self.certificates,
        // node: mac,
        designation: 'example',
        pingFreq: 3 * 1000,
        pingDataObject : self.pingDataObject
    });

    // register us as external listener (for `self.on()` processing)
    rpc.registerListener(self);

    // ---

    // listen using Multiplexer rpc object
    rpc.on('pong', function(msg) {
        console.log("Client::on('pong') - ".bold,msg);
    })

    // listen using external listener
    self.on('pong', function(msg) {
        console.log("self.on('pong') - ".bold,msg);
    })

    // listen for raw JSON objects using digest() callback
    rpc.digest(function(msg, rpc) {
        console.log("Client::digest() - ".bold, msg)
    })

    setInterval(function() {
        // console.log("connected:",rpc.isConnected())
        var msg = { op : 'hello'};
        console.log("Client() - ".bold+" dispatching:",msg)
        rpc.dispatch(msg);
    }, 1 * 1000)

    setInterval(function() {
        self.pingDataObject.iteration++;
        self.pingDataObject.ts = Date.now();
    }, 100)
}

util.inherits(Client, events.EventEmitter);

// obtain node id (mac of the first network adaptor)
getmac.getMac(function (err, mac) {
    if (err)
        throw err;

    mac = mac.split(process.platform == 'win32' ? '-' : ':').join('').toLowerCase();
    global.application = new Client(mac);
})
