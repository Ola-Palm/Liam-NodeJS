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
            if(localMower.state ===-1)
                localMower.state = 3;
            let n = localMower.state == 3 ? 1 : 0;
            console.log("Värdet på n == "+ n);
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
                value: 6
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
    socket.on("GUI_Message", function (data) {
        try {
            // localMower.state = data.state;
            let node = document.getElementById("control_looptime");
            node.innerHTML = "Looptime  is :" + data.looptime;
            node = document.getElementById('control_state');
            node.innerHTML = "State is " + data.statename;
            if (localMower.state != data.state) {
                localMower.state = data.state;
    
                if (localMower.state === "MOWING") {
                    node.innerHTML = "Mowing Start time :" + new Date().toLocaleDateString();
                } else if (localMower.state === "DOCKING") {
                    node.innerHTML = "Docking Start time :"  + new Date().toLocaleDateString();
                } else if (localMower.state === "CHARGE") {
                    node.innerHTML = "Charging Start time :"  + new Date().toLocaleDateString();
                }

            }
            node = document.getElementById('control_message');
            node.innerHTML = data.message;
            node = document.getElementById("battery_soc_current");
            node.innerHTML = "Battery :"+data.battery;    
        } catch (error) {
            console.log(error.message)
        }
        
    });// GUI_Message

})()
