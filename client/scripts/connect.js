export default {
    connect,
    setInputs
}

let inputs;

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
        buttons: [],
        axes: [],
    }

    for (const key in inputs) {
        if (key.startsWith("btn_")) data.buttons.push(inputs[key].value);
        if (key.startsWith("axis_")) data.axes.push(inputs[key].value);
    }

    remote.send(data);
}


