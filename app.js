const SerialPort = require("serialport");
const SerialPortParser = require("@serialport/parser-readline");
const GPS = require("gps");
const portGPS = new SerialPort("/dev/ttyAMA0", { baudRate: 9600 });
const portArduino = new SerialPort("/dev/ttyACM0", { baudRate: 2000000 });
const gps = new GPS();
const parser = portGPS.pipe(new SerialPortParser());
const PubNub = require('pubnub');
const uuid = PubNub.generateUUID();
const fs = require('fs');

let lat = 0;
let lon = 0;
let logs = [];

const pubnub = new PubNub({
    publishKey: "pub-c-34e290c9-f8c9-4b63-ac2e-eef4eba4f559",
    subscribeKey: "sub-c-91b08fd6-0858-11eb-9576-5e64fbbe0f1d",
    uuid: uuid
});

logger= (data) => {
    fs.appendFile('log.json', data + ',\n', error => {
        if (error) throw error;
    });
};

async function pushMessage(
    lat,
    lon,
    speed,
    channel = 'NGHIANC_CHANNEL'
) {
    const date = new Date();
    const publishConfig = {
        channel: channel,
        message: { publisher: uuid, latitude: lat, longitude: lon, speed: speed }
    }

    pubnub.publish(publishConfig, (status, response) => {
        console.log(response);

        const log = {
            latitude: lat, 
            longitude: lon,
            speed: speed, 
            created_at: date.getDate() + '/' 
            + (date.getMonth() + 1) + "/" 
            + date.getFullYear() + " " 
            + date.getHours() + ":" 
            + date.getMinutes() + ":" 
            + date.getSeconds()
        };
        logger(JSON.stringify(log, null, 4));
    })
}

gps.on("data", async data => {
    try {
        if(data.type == "GGA") {
            if(data.quality != null) {
                lat = data.lat;
                lon = data.lon;
            } else {
                console.log("no gps fix available");
            }
        }
    } catch (e) {

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