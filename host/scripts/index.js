if (!location.hash) location.hash = "#" + Math.random().toFixed(6).substring(2);

window.onload = ready;

function ready() {
  document.querySelector("#stream").checked = false;
  document.querySelector("#fps").disabled = true;
  document.querySelector("#height").disabled = true;

  document.querySelector("#stream").onchange = () => {
    document.querySelector("#fps").disabled =
      !document.querySelector("#stream").checked;
    document.querySelector("#height").disabled =
      !document.querySelector("#stream").checked;
  };

  document.querySelector("#shareBtn").onclick = share;
  document.querySelector("#getScriptBtn").onclick = downloadScript;
}

async function share() {
  document.querySelector("#body").style.display = "none";
  document.querySelector("#streamContainer").style.display = "flex";
  const local = new Peer("fireshare-" + location.hash.substring(2));

  let stream;
  if (document.querySelector("#stream").checked) {
    document.querySelector("#localVideo").style.display = "block";
    stream = await streamVideo();
    document.querySelector("#localVideo").srcObject = stream;
  }

  const webSocket = new WebSocket("ws://127.0.0.1:6731");
  webSocket.addEventListener("error", () => {
    const error = document.createElement("h2");
    error.innerText = "Failed to connect to controller websocket.";
    document
      .querySelector("#streamContainer")
      .insertBefore(error, document.querySelector("#localVideo"));
  });

  let idCounter = 0;
  local.on("connection", (remote) => {
    const remoteVideo = stream == null ? null : local.call(remote.peer, stream);

    let id = idCounter++;
    remote.on("data", (data) => {
      if (data.nick) {
        const div = addConnection(remote, data, remoteVideo);

        remote.on("close", () => {
          div.remove();
          if (remoteVideo) remoteVideo.close();
        });
      }
      if (webSocket.readyState == WebSocket.OPEN) {
        if (data.buttons && data.axes) {
          webSocket.send(JSON.stringify({ ...data, id }));
        }
      }
      if (data.ping) remote.send(data);
    });

    remote.on("close", () => {
      if (webSocket.readyState == WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ close: true, id }));
      }
    });
  });
}

async function streamVideo() {
  return await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: document.querySelector("#fps").value },
      height: { ideal: document.querySelector("#height").value },
    },
    audio: true,
    surfaceSwitching: "include",
  });
}

function addConnection(remote, data, remoteVideo) {
  const div = document.createElement("div");
  const label = document.createElement("label");
  label.textContent = data.nick + " ";

  const button = document.createElement("button");
  button.textContent = "Disconnect";
  button.onclick = () => {
    remote.close();
    if (remoteVideo) remoteVideo.close();
    div.remove();
  };

  div.appendChild(label);
  div.appendChild(button);
  document.querySelector("#connectionList").appendChild(div);

  return div;
}

async function downloadScript() {
    const txt = await fetch("./res/fireshare-linux.py").then(response => response.text());
    const blob = new Blob([txt], { type: "application/py" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fireshare-linux.py";
    link.click();
    URL.revokeObjectURL(url);
}
