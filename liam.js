/*jshint esversion: 6 */
(() => {
    'use strict';
    // content of index.js
    let Setcommands = {
        'state': 202,
    };
    let topic = -1;
    let mqtt = require('mqtt');
    const server_port = 8000;
    let voltAvg = [];
    let arrayLen = 100;
    // Web
    var express = require('express');
    var app = express();
    var appApi = express();
    const http = require('http');
    let mower = {
        'looptime': 0,
        'avgvolt': 0,
        'v_min': 10000,
        'v_max': 0,
        'state': -1,
        'avg_len': 0,
        'state_starttime' : -1,
        'Message':''
    };

    // Server
    var server = http.createServer(app);

    // Socket
    var io = require('socket.io')(server);

    //#region  MQTT

    let mqttToken = "abc123",
        mqttclient;
    var mqttopts = {
        port: 1883,
        host: "palm-home", // host does NOT include port
        // hostname?: string
        // path?: string
        protocol: 'mqtt',
        /**
         *  10 seconds, set to 0 to disable
         */
        keepalive: 60 * 5,
        /**
         * 'mqttjs_' + Math.random().toString(16).substr(2, 8)
         */
        clientId: "Liam_" + Date.now(),
        /**
         * 'MQTT'
         */
        //  protocolId:"mqtt",
        // // /**
        // //  * 4
        // //  */
        // protocolVersion: "4",
        /**
        //  * true, set to false to receive QoS 1 and 2 messages while offline
        //  */
        clean: true,
        /**
         * 1000 milliseconds, interval between two reconnections
         */
        reconnectPeriod: 10 * 1000,
        /**
         * 30 * 1000 milliseconds, time to wait before a CONNACK is received
         */
        connectTimeout: 30 * 10000,
        /**
         * the username required by your broker, if any
         */
        username: "liam_" + Date.now(),
        /**
         * the password required by your broker, if any
         */
        // password?: string
        /**
         * a Store for the incoming packets
        //  */
        // incomingStore?: Store
        // /**
        //  * a Store for the outgoing packets
        //  */
        // outgoingStore?: Store
        // queueQoSZero?: boolean
        // reschedulePings?: boolean
        // servers?: Array<{
        //   host: string
        //   port: number
        // }>
        // /**
        //  * true, set to false to disable re-subscribe functionality
        //  */
        // resubscribe?: boolean
        // /**
        //  * a message that will sent by the broker automatically when the client disconnect badly.
        //  */
        // will?: {
        //   /**
        //    * the topic to publish
        //    */
        //   topic: string
        //   /**
        //    * the message to publish
        //    */
        //   payload: string
        //   /**
        //    * the QoS
        //    */
        //   qos: QoS
        //   /**
        //    * the retain flag
        //    */
        //   retain: boolean
    };

    mqttclient = mqtt.connect(mqttopts);

    mqttclient.on('error', (error) => {
        console.log("# MQTT LIAM ERROR");
    });

    mqttclient.on('offline', (error) => {
        console.log("# MQTT LIAM host offline");
    });

    mqttclient.on('close', (error) => {
        console.log("# MQTT LIAM connection closed");
    });

    mqttclient.on('connect', () => {
        console.log("# MQTT is connected");
        mqttclient.subscribe('#');
    });

    mqttclient.on('message', (topic, message) => {

        try {
            console.log("Topic was" + topic);
            console.log("New message" + message);

            if(topic == "/liam/1/event")
            {
                cosnole.log("emiiting to gui.");
                cosnole.dir(message);
                let temp={
                    Message:message
                }
                io.emit('GUI_Message',temp);
            }
            console.dir(message.toString());
            switch (topic) {
                case "/liam1/event":
                    let JMessage = JSON.parse(message);
                    if (mower.state != JMessage.State) {
                        var d = new Date();
                        voltAvg.length = 0; // set array to zero
                        mower.state_starttime = d.toLocaleTimeString();
                    }
                    if(JMessage.State === 0)
                    {
                        /// Mowing
                    }
                    else if (JMessage.State === 1)
                    {
                        //Launching
                    }
                    else if( JMessage.State === 2)
                    {
                        //// Docking
                    }
                    else if (JMessage.State === 3) {
                        /// Chargeing
                        /**
                         * Check charge time at least 90 min
                         * check diff between min and max no more then .5 V
                         * If true check if it's mowingtime, --> set mowing.
                         */
                    }
                    else if( JMessage.State === 4)
                    {
                        //// IDLE
                    }
                    if (voltAvg.length >= arrayLen) {
                        voltAvg.shift();
                    }

                    voltAvg.push(JMessage.SOC)
                    let n = 0;
                    let v = 0;
                    let current = 0;
                    mower.v_min = 10000;
                    mower.v_max = 0;
                    for (let index = 0; index < voltAvg.length; index++) {
                        current = voltAvg[index];
                        v += current
                        n++;
                        if (mower.v_min > current)
                            mower.v_min = current;
                        if (mower.v_max < current)
                            mower.v_max = current;
                    }
                    let temp = JSON.stringify(mower);
                    mower.avgvolt = (Math.floor(v / n) / 100);
                    mower.looptime = JMessage.Looptime;
                    mower.state = JMessage.State;
                    mower["avg_len"] = n;

                    if (temp != JSON.stringify(mower))
                        io.emit('battery_avg', mower);
                    break;
                default:
                    break;

            }
        } catch (error) {
            console.log("ERROR in mqttclient.on(message :" + error);
        }
    });

    //#endregion


    //#region WEBSOCKET CLIENT --> SERVER
    io.on('connection', (client) => {
        console.log('_ Websocket client connected');
        client.emit('mower__Init', mower);
        client.on('join', (data) => {
            client.emit('battery_avg', mower);

        }); // Join

        client.on('disconnect', () => {
            mower.Message = "Mower disconnected";
            console.log(mower.Message);
            client.emit('GUI_Message',mower.Message);
        });
        client.on('mower__action', (mower) => {
            let mowerJson = {};
            let cmd = -1;
            try {
                switch (mower.set_get) {
                    case 'set':
                        console.log('set value');
                        topic = '/liam1/cmd/set';
                        cmd = Setcommands[mower.command];
                        if (cmd === -1)
                            console.log("Detta gick inte bra. ");
                        mowerJson[0] = cmd;
                        mowerJson[1] = mower.value;
                        mowerJson[99] = "123";
                        console.dir(mower);
                        break;
                    case 'get':
                        console.log(' get value');
                        break;
                    default:
                        console.log("Defalut value");
                        break;
                }
            } catch (error) {
                console.log("Could nor parse json");
                console.dir(mower);
            }
            publishCommnad(mowerJson);
        });
    });

    //#region WEBSOCKET CLIENT --> SERVER




    app.use(express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/node_modules'));


    app.get('/.', function (req, res, next) {
        console.log("=========================");
        res.send(404,'Sorry no such entry');
    });
    app.get('/Liam', function (req, res, next) {
        console.log("=========================");
        res.sendFile(__dirname + '/public/html/index.html');
    });
    //#region Server
    server.listen(server_port, function () {
        console.log("> Server listening on : " + server_port);
    });

    server.on('error', function (e) {
        console.log("HTTPPORT is occupied, start as sudo or change port");
        console.log(e);
    });

    function publishCommnad(mowerJson) {
        console.log("detta är vad som kommer skickas mot klipparen.");
        console.dir(mowerJson);
        if (topic != -1)
            mqttclient.publish(topic, JSON.stringify(mowerJson) + '\r\n');
    }
})();
