const SerialPort = require("serialport");
const SerialPortParser = require("@serialport/parser-readline");
const GPS = require("gps");
const portGPS = new SerialPort("/dev/ttyAMA0", { baudRate: 9600 });
const portArduino = new SerialPort("/dev/ttyACM0", { baudRate: 2000000 });
const gps = new GPS();
const parser = portGPS.pipe(new SerialPortParser());

let lat = 0;
let lon = 0;

async function pushMessage(
    lat,
    lon,
    speed,
    topicName = 'projects/cbfgd-project/topics/gps_topic'
) {
    const { PubSub } = require('@google-cloud/pubsub');

    const pubSubClient = new PubSub();
    const data = JSON.stringify({lat: lat, lon: lon, speed: speed});

    publishMessage = async () => {
        const dataBuffer = Buffer.from(data);
        await pubSubClient.topic(topicName).publish(dataBuffer);
    }

    publishMessage();
}

gps.on("data", async data => {
    if(data.type == "GGA") {
        if(data.quality != null) {
            lat = data.lat;
            lon = data.lon;
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
    pushMessage(lat, lon, Buffer.from(data).toString());
};

portArduino.on('error', err => {
   console.log('Error: ' + err.message);
});