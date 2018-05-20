(() => {
    "use strict";
    var socket = io.connect();
    let localMower = {
        state: -1
    };
    window.onload = function () {
        this.console.log("laddat");

        /// start mowing button
        var mowingButton = document.getElementById('mower_State_action_button_start');
        mowingButton.value = "Start mowing";

        mowingButton.addEventListener('click', function (e) {
            // push data to server. server komunicate with liam.
            let n = localMower.state = 3 ? 1 : 0;
            let mower = {
                set_get: 'set',
                command: 'state',
                value: n
            };
            socket.emit("mower__action", mower);
        });
        // idle button
        var idleButton = document.getElementById('mower_State_action_button_stop');
        idleButton.value = "Set IDLE";

        idleButton.addEventListener('click', function (e) {
            // push data to server. server komunicate with liam.
            let mower = {
                set_get: 'set',
                command: 'state',
                value: 4
            };
            socket.emit("mower__action", mower);
        });
        var dockingButton = document.getElementById('mower_State_action_button_dock');
        dockingButton.value = "Set DOCK";

        dockingButton.addEventListener('click', function (e) {
            // push data to server. server komunicate with liam.
            let mower = {
                set_get: 'set',
                command: 'state',
                value: 2
            };
            socket.emit("mower__action", mower);
        });

    }; // End window.onload

    socket.on("connect", function (data) {});
    socket.on("mower__Init", function (data) {
        // localMower.state = data.state;
        console.dir(data);
        // localMower.state = data.state;
        var node = document.getElementById("battery_soc_current");
        node.innerHTML = "Avg Volt:" + data.avgvolt + " out of:" + data.avg_len + " readings";
        node = document.getElementById("control_looptime");
        node.innerHTML = "Looptime  is :" + data.looptime;
        node = document.getElementById('control_state');
        node.innerHTML = "State is " + data.state;
        node = document.getElementById("battery_soc_avg");
        node.innerHTML = "Volt Diff :" + (data.v_max - data.v_min) / 100 + " / Min: " + data.v_min / 100 + "V  / Max :" + data.v_max / 100 + "V";

        node = document.getElementById("control_runtime");

        if (localMower.state != data.state) {
            localMower.state = data.state;

            if (localMower.state === 0) {
                node.innerHTML = "Mowing Start time :" + data.state_starttime;
            } else if (localMower.state === 2) {
                node.innerHTML = "Docking Start time :" + data.state_starttime;
            } else if (localMower.state === 3) {
                node.innerHTML = "Charging Start time :" + data.state_starttime;
            }

        }
    });
    socket.on("battery_avg", function (data) {
        console.dir(data);
        // localMower.state = data.state;
        var node = document.getElementById("battery_soc_current");
        node.innerHTML = "Avg Volt:" + data.avgvolt + " out of:" + data.avg_len + " readings";
        node = document.getElementById("control_looptime");
        node.innerHTML = "Looptime  is :" + data.looptime;
        node = document.getElementById('control_state');
        node.innerHTML = "State is " + data.state;
        node = document.getElementById("battery_soc_avg");
        node.innerHTML = "Volt Diff :" + (data.v_max - data.v_min) / 100 + " / Min: " + data.v_min / 100 + "V  / Max :" + data.v_max / 100 + "V";

        node = document.getElementById("control_runtime");

        if (localMower.state != data.state) {
            localMower.state = data.state;

            if (localMower.state === 0) {
                node.innerHTML = "Mowing Start time :" + data.state_starttime;
            } else if (localMower.state === 2) {
                node.innerHTML = "Docking Start time :" + data.state_starttime;
            } else if (localMower.state === 3) {
                node.innerHTML = "Charging Start time :" + data.state_starttime;
            }

        }
    });

})()
