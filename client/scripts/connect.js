export default {
    connect,
    setInputs
}

let inputs;
let olddata;

function setInputs(inputList) {
    inputs = inputList;
}

function connect() {
  document.querySelector("#body").style.display = "none";
  document.querySelector(".sidebar").style.display = "none";
  const nickname = document.querySelector("#nickname").value;
  localStorage.setItem("nickname", nickname);

  const hash = Math.random().toFixed(6).substring(2);
  const local = new Peer(
    "fireshare-" + hash + "-" + location.hash.substring(2)
  );

  local.on("open", () => {
    const remote = local.connect("fireshare-" + location.hash.substring(2));
    remote.on("open", () =>
      remote.send({
        nick: nickname,
      })
    );

    remote.on("data", (data) => {
      if (data.ping) {
        const ping = Date.now() - data.ping;
        console.log("Ping: " + ping + "ms");
      }
    });

    remote.on("close", () => location.reload());

    setInterval(() => sendInputs(remote), 10);
  });

  local.on("call", (call) => {
    const vid = document.querySelector("#remoteVideo");
    vid.style.display = "block";

    call.on("stream", (stream) => vid.srcObject = stream);
    call.answer();
  });
  document.querySelector("#remoteVideo").requestPointerLock();
}

function sendInputs(remote) {
    const data = {
        buttons: {},
        axes: {},
    }

    for (const key in inputs) {
        if (key.startsWith("btn_")) {
            if (olddata == null || inputs[key].value !== olddata.buttons[inputs[key].name.toLowerCase()]) data.buttons[inputs[key].name.toLowerCase()] = inputs[key].value;
        }
        if (key.startsWith("axis_")) {
            if (olddata == null || inputs[key].value !== olddata.axes[inputs[key].name.toLowerCase()]) {
                if (inputs[key].value > 0.1 || inputs[key].value < -0.1) data.axes[inputs[key].name.toLowerCase()] = inputs[key].value;
                if (olddata != null && olddata.axes[inputs[key].name.toLowerCase()] !== 0 && (inputs[key].value < 0.1 && inputs[key].value > -0.1)) data.axes[inputs[key].name.toLowerCase()] = 0;
            }
        }
    }

    if (Object.keys(data.buttons).length !== 0 || Object.keys(data.axes).length !== 0) {
        remote.send(data);
        console.log(inputs);
    }
    if (olddata == null) olddata = data;
    for (const key in data.buttons) {
        olddata.buttons[key] = data.buttons[key];
    }
    for (const key in data.axes) {
        olddata.axes[key] = data.axes[key];
    }
}

