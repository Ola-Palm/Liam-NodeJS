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
        'battery':-1,
        'avgvolt': 0,
        'v_min': 10000,
        'v_max': 0,
        'state': -1,
        'avg_len': 0,
        'state_starttime' : -1,
        'message':'',
        'update_time':''
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
            var mJson = JSON.parse(message);

            switch (topic.toString().toLowerCase()) {
                case "/liam/1/event/lastmessage":
                    mower.message = mJson.message;
                    break;
                case "/liam/1/event/battery":
                    mower.battery = mJson.battery;
                    break;
                case "/liam/1/event/state":
                    mower.state = mJson.state;
                    break;
                case "/liam/1/event/looptime":
                    mower.looptime = mJson.looptime;
                    break;
                default:
                    break;
            }
            mower.update_time = new Date().toLocaleDateString();
            console.log("Detta är JSON");
            console.dir(mJson);
            io.emit('GUI_Message', mower);
        } catch (error) {
            console.log("ERROR in mqttclient.on(message :" + error);
        }
    });

    //#endregion


    //#region WEBSOCKET CLIENT --> SERVER
    io.on('connection', (client) => {
        console.log('_ Websocket client connected');
        client.emit('GUI_Message', mower);
        client.on('join', (data) => {
            client.emit('GUI_Message', mower);

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
                console.log("detta är mower commad");
                console.log(Setcommands[mower.command]);
                switch (mower.set_get) {
                    case 'set':
                        console.log('set value');
                        topic = '/liam1/cmd/set';
                        cmd = Setcommands[mower.command];
                        if (cmd === -1)
                            console.log("Detta gick inte bra. ");
                        mowerJson[0] = cmd;
                        mowerJson[1] = mower.value;
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
