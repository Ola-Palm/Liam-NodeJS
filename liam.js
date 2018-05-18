/*jshint esversion: 6 */
(() => {
        'use strict';
        // content of index.js

        let mqtt = require('mqtt');
        const server_port = 8081;
        let voltAvg=[];
        let arrayLen = 50;
        // Web
        var express = require('express');
        var app = express();
        var appApi = express();
        const http = require('http');
        let mower ={
            'looptime':0,
            'avgvolt':0,
            'v_min' : 10000,
            'v_max' : 0,
            'state' : 0,
            'avg_len':0
        }

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
            clientId: "liam.js",
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
            username: "liam.js",
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

        mqttclient.on('error', (error) =>
        {
            console.log("# MQTT Baresip ERROR");
        });

        mqttclient.on('offline', (error) =>
        {
            console.log("# MQTT Baresip host offline");
        });

        mqttclient.on('close', (error) =>
        {
            console.log("# MQTT Baresip connection closed");
        });

        mqttclient.on('connect', () =>
        {
            console.log("# MQTT is connected");

            mqttclient.subscribe('#');
        });

        mqttclient.on('message', (topic, message) =>
        {
            console.dir(message.toString('utf8'));
            switch (topic) {

                case "/liam1/event":
                    let JMessage = JSON.parse(message);
                    if(voltAvg.length >= arrayLen )
                    {
                        voltAvg.shift();
                    }

                    voltAvg.push(JMessage.SOC)
                    let n = 0;
                    let v = 0;
                    let current=0;
                    mower.V_min=10000;
                    mower.V_max=0;
                    for (let index = 0; index < voltAvg.length; index++) {
                        current = voltAvg[index];
                        v+= current
                        n++;
                        if(mower.v_min>current)
                            mower.v_min = current;
                        if(mower.v_max<current)
                            mower.v_max = current;
                    }
                    let temp = JSON.stringify(mower);
                    mower.avgvolt = (Math.floor(v / n) / 100);
                    mower.looptime = JMessage.Looptime;
                    mower.state = JMessage.State;
                    mower["avg_len"] =  n;

                    if (temp != JSON.stringify(mower))
                        io.emit('battery_avg', mower);
                    break;
                default:
                    break;

                }
        });

        //#endregion


          //#region WEBSOCKET CLIENT --> SERVER
    io.on('connection', (client) =>
    {
        console.log('_ Websocket client connected');
        client.on('join', (data) =>
        {
            console.log("Client connected");
            client.emit('battery_avg',mower);

        }); // Join

        client.on('disconnect', () =>
        {
        });
    });

    //#region WEBSOCKET CLIENT --> SERVER




        app.use(express.static(__dirname + '/public'));
        app.use(express.static(__dirname + '/node_modules'));



        app.get('/ccm', function (req, res, next)
    {
        console.log("=========================");
        res.sendFile(__dirname + '/public/html/index.html');
    });
   //#region Server
   server.listen(server_port, function ()
   {
       console.log("> Server listening on : " +server_port);
   });

   server.on('error', function (e)
   {
       console.log("HTTPPORT is occupied, start as sudo or change port");
       console.log(e);
   });

}
)();
