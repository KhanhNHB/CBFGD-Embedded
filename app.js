const SerialPort = require("serialport");
const SerialPortParser = require("@serialport/parser-readline");
const GPS = require("gps");
const Request = require("request-promise");

const portGPS = new SerialPort("/dev/ttyAMA0", { baudRate: 9600 });
const portArduino = new SerialPort("/dev/ttyACM0", { baudRate: 2000000 });

const gps = new GPS();

const parser = portGPS.pipe(new SerialPortParser());

gps.on("data", async data => {
    if(data.type == "GGA") {
        if(data.quality != null) {
            console.log(" [" + data.lat + ", " + data.lon + "]");
        } else {
            console.log("no gps fix available");
        }
    }
});

parser.on("data", data => {
    try {
        gps.update(data);
    } catch (e) {
        throw e;
    }
});

portArduino.on('open', onOpen);
portArduino.on('data', onData);

function onOpen() {
   console.log('Open connection');
};

function onData(data) {
   console.log(new Date() + "-> " + data);
};

portArduino.on('error', err => {
   console.log('Error: ' + err.message);
});
