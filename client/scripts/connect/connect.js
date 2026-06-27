import interpolate from "../../../res/util/interpolator.js";

const id = encodeURIComponent(localStorage.getItem("clientID"));
const nickname = localStorage.getItem("nickname");

let remote;
let oldControls = {};
let properDisconnect = false;
let stoppedDisconnect = false;
let peer;
let pageLoadTime = Date.now();

document.querySelector("#disconnect").addEventListener("click", () => disconnect());

document.getElementById('unmuteBtn').addEventListener('click', () => {
    const video = document.getElementById('localStream');

    // Unmute the video element
    video.muted = false;

    // Optional: Hide the unmute button once clicked
    document.getElementById('unmuteBtn').style.display = 'none';

    console.log("Video unmuted. Current volume:", video.volume);
});

async function disconnect() {
    remote.send({
        rtype: "disconnect"
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    location.href = "/client";
}

connect();

function connect() {
    const hash = Math.random().toFixed(6).substring(2);
    peer = new Peer('netshare-' + hash + "-" + encodeURIComponent(nickname) + "-" + id);
    peer.on("open", () => clientOpen(peer));
    peer.on("call", (call) => handleIncomingCall(call));
    peer.on("error", (err) => {
        console.error("Peer error:", err);
        hostClose();
    });
}

function clientOpen(local) {
    remote = local.connect("netshare-" + id);
    remote.on("open", () => hostOpen(remote));
    remote.on("data", (data) => hostData(remote, data));
    remote.on("close", () => hostClose());
    remote.on("error", (err) => {
        console.log(err);
        hostClose();
    });
}

function handleIncomingCall(call) {
    call.answer();
    call.on("stream", (stream) => {
        const videoElement = document.getElementById("localStream");
        videoElement.srcObject = stream;
        videoElement.style.display = "block";
        document.querySelector(".stream-placeholder").style.display = "none";
    });
    call.on("error", (err) => {
        console.error("Call error:", err);
    });
}

function hostOpen(remote) {
    remote.send({
        rtype: "connect",
        nickname: nickname
    });

    setInterval(() => controlsData(remote), 10);
}

function hostData(remote, data) {
    if (data.rtype === "ping") {
        remote.send({
            rtype: "pong"
        });
    }
    else if (data.rtype === "disconnect") {
        properDisconnect = true;
        stoppedDisconnect = data.stopped;
    }
}

function hostClose() {
    if (peer) {
        peer.destroy();
    }

    const timeSinceLoad = Date.now() - pageLoadTime;
    if (timeSinceLoad < 5000) {
        location.href = "/client?nohost=true";
    } else {
        location.href = "/client?disconnected=true&proper=" + properDisconnect + "&stopped=" + stoppedDisconnect;
    }
}

function controlsData(remote) {
    const controls = calcSticks(interpolate());

    const data = {};
    for (const key of Object.keys(controls)) {
        if (controls[key] !== oldControls[key]) {
            if (
                key === "left_y" ||
                key === "left_x" ||
                key === "right_y" ||
                key === "right_x" ||
                key === "left_trigger" ||
                key === "right_trigger"
            ) {
                let value = controls[key];
                if (key === "left_trigger" ||
                    key === "right_trigger"
                ) value = Math.abs(value);
                data[key] = value;
            }
            else {
                let value = Math.abs(controls[key]);
                if (value > 0.75) value = 1;
                else value = 0;
                data[key] = value;
            }
        }
    }
    oldControls = controls;

    if (Object.keys(data).length > 0) {
        remote.send({
            rtype: "controls",
            data: data
        });
    }
}

function calcSticks(controls) {
    controls["left_y"] = Math.abs(controls["left_up"])*-1 + Math.abs(controls["left_down"]);
    controls["left_x"] = Math.abs(controls["left_left"])*-1 + Math.abs(controls["left_right"]);
    controls["right_y"] = Math.abs(controls["right_up"])*-1 + Math.abs(controls["right_down"]);
    controls["right_x"] = Math.abs(controls["right_left"])*-1 + Math.abs(controls["right_right"]);
    delete controls["left_up"];
    delete controls["left_down"];
    delete controls["left_left"];
    delete controls["left_right"];
    delete controls["right_up"];
    delete controls["right_down"];
    delete controls["right_left"];
    delete controls["right_right"];
    return controls;
}