(() => {
    "use strict";
    var socket = io.connect();

    window.onload = function () {
        this.console.log("laddat");

        const button = document.getElementById('mower_State_action_button');
        button.addEventListener('click', function(e) {
          // push data to server. server komunicate with liam.
        });
    }; // End window.onload

    socket.on("connect", function (data) {
        console.log("What data comes out? :" + data);
    });
    socket.on("battery_avg", function (data) {
        console.dir(data);
        var node = document.getElementById("battery_soc_current");
        node.innerHTML = "Avg Volt:"+ data.avgvolt + " out of:"+data.avg_len + " readings";
        node = document.getElementById("control_looptime");
        node.innerHTML = "Looptime  is :" + data.looptime;
        node = document.getElementById('control_state');
        node.innerHTML = "State is " + data.state;
        node = document.getElementById("battery_soc_avg");
        node.innerHTML = "Volt Diff :" +(data.v_max - data.v_min)/100 + " / Min: " +data.v_min/100 +"V  / Max :"+ data.v_max/100 +"V";
        node = document.getElementById("mower_State_action_button");

    });

})()
