import configs from "./configs.js";

let inputs;
let categories;
let target;
let oldX;
let oldY;
let locked = false;

const keys = {};
const mouse = {};

export default {
  init,
  loadConfig,
  getKeyName,
  checkInputs,
  update,
  getInputs,
  getAllInputStates
};

async function init(config) {
  inputs = await fetch("./res/inputs.json").then((response) => response.json());
  categories = await fetch("./res/categories.json").then((response) =>
    response.json()
  );

  const container = document.querySelector("#controls");
  let index = 0;
  for (const key in categories) {
    const categoryContainer = document.createElement("div");
    categoryContainer.classList.add("container", "padded");
    categoryContainer.style.gridArea = "a" + index;
    const container2 = document.createElement("div");
    container2.classList.add("controlsContainer");
    const header = document.createElement("h2");
    header.style.gridArea = "header";
    header.textContent = key;
    container2.appendChild(header);
    container2.style.gridTemplateAreas = '"header header"';
    for (const inputKey in categories[key]) {
      container2.style.gridTemplateAreas += `"label${inputKey} input${inputKey}"`;
      const label = document.createElement("label");
      label.classList.add("inputLabel");
      label.style.gridArea = "label" + inputKey;
      label.textContent = inputs[categories[key][inputKey]].label;
      const input = document.createElement("button");
      input.classList.add("inputButton");
      input.dataset.key = categories[key][inputKey];
      input.style.gridArea = "input" + inputKey;
      input.onclick = clickButton;
      container2.appendChild(label);
      container2.appendChild(input);
    }
    categoryContainer.appendChild(container2);
    container.appendChild(categoryContainer);
    index++;
  }

  loadConfig(config);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  document.addEventListener("mousemove", mouseMove)
  document.addEventListener("pointerlockchange", () => locked = document.pointerLockElement != null);
}


function getKeyName(key) {
  if (key == null) return "Unbound";
  if (key.startsWith("key_"))
    return key.replace("key_", "").toUpperCase() + " Key";
  if (key.startsWith("mouse_"))
    return "Mouse " + key.replace("mouse_", "").toUpperCase();
  if (inputs[key]) return inputs[key].name;
  return key;
}

function loadConfig(config) {
  const inputButtons = document.querySelectorAll(".inputButton");
  const disable = document.querySelector("#config").value === "Default";
  for (const inputButton of inputButtons) {
    inputButton.disabled = disable;
    const key = inputButton.dataset.key;
    const value = getKeyName(config[key]);
    if (value == null) {
      inputButton.textContent = "Unbound";
    } else {
      inputButton.textContent = value;
    }
  }
}

function clickButton(event) {
  if (target === event.target) {
    configs.saveKey(target.dataset.key, null);
    target.textContent = "Unbound";
    target = null;
    return;
  }
  if (target != null) {
    target.textContent = getKeyName(
      configs.getActiveConfig()[target.dataset.key]
    );
    target = null;
  }
  target = event.target;
  target.textContent = "...";
  oldX = mouse["mouse_x"];
  oldY = mouse["mouse_y"];
}

function keyDown(event) {
  keys["key_" + event.code.replace("Key", "")] = 1;
  for (const key in inputs) {
    const localKey = localStorage.getItem(key);
    if (localKey === "key_" + event.code.replace("Key", "")) {
      inputs[key].value = 1;
    }
  }
  if (target != null) {
    if (event.key === "Escape") {
      target.textContent = getKeyName(
        configs.getActiveConfig()[target.dataset.key]
      );
      target = null;
      return;
    }
    configs.saveKey(target.dataset.key, "key_" + event.code.replace("Key", ""));
    target.textContent = event.code.replace("Key", "").toUpperCase() + " Key";
    target = null;
  }
}

function keyUp(event) {
  keys["key_" + event.code.replace("Key", "")] = 0;
  for (const key in inputs) {
    const localKey = localStorage.getItem(key);
    if (localKey === "key_" + event.code.replace("Key", "")) {
      inputs[key].value = 0;
    }
  }
}

function mouseMove(event) {
  if (!locked) {
    mouse["mouse_x"] = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouse["mouse_y"] = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
  } else {
    mouse["mouse_x"] = (event.layerX - document.querySelector("#remoteVideo").clientWidth/2)/(document.querySelector("#remoteVideo").clientWidth/2);
    mouse["mouse_y"] = (event.layerY - document.querySelector("#remoteVideo").clientHeight/2)/(document.querySelector("#remoteVideo").clientHeight/2);
  }
  for (const key in inputs) {
    const localKey = localStorage.getItem(key);
    if (localKey === "mouse_x") {
      inputs[key].value = mouse["mouse_x"];
    }
    if (localKey === "mouse_y") {
      inputs[key].value = mouse["mouse_y"];
    }
  }
  if (target != null) {
    if (Math.abs(Math.abs(oldX) - Math.abs(mouse["mouse_x"])) > 0.2) {
      configs.saveKey(target.dataset.key, "mouse_x");
      target.textContent = "Mouse X"
      target = null;
    }
    else if (Math.abs(Math.abs(oldY) - Math.abs(mouse["mouse_y"])) > 0.2) {
      configs.saveKey(target.dataset.key, "mouse_y");
      target.textContent = "Mouse Y"
      target = null;
    }
  }
}

function checkInputs() {
  const gamepad = navigator.getGamepads().filter((g) => g != null)[0];
  if (gamepad == null) return;
  let buttons = gamepad.buttons.map((b) => b.value);
  for (let i = 0; i < buttons.length; i++) {
    for (const key in inputs) {
      const localKey = localStorage.getItem(key);
      if (localKey === "btn_" + i) {
        if (buttons[i] !== Math.round(buttons[i])) {
          if (buttons[i] > 0.75) inputs[key].value = 1;
          else inputs[key].value = 0;
          if (i === 6) inputs["axis_4"].value = buttons[6];
          if (i === 7) inputs["axis_5"].value = buttons[7];
        } else {
          inputs[key].value = buttons[i];
        }
      }
    }
    if (target && buttons[i] === 1) {
      configs.saveKey(target.dataset.key, "btn_" + i);
      target.textContent = getKeyName(
        configs.getActiveConfig()[target.dataset.key]
      );
      target = null;
    }
  }
  let axes = gamepad.axes;
  for (let i = 0; i < axes.length; i++) {
    if (i === 4) break;
    for (const key in inputs) {
      const localKey = localStorage.getItem(key);
      if (localKey === "axis_" + i) {
        inputs[key].value = axes[i];
      }
    }
    if (target && (axes[i] >= 0.9 || axes[i] <= -0.9)) {
      configs.saveKey(target.dataset.key, "axis_" + i);
      target.textContent = getKeyName(
        configs.getActiveConfig()[target.dataset.key]
      );
      target = null;
    }
  }
}

function update() {
  for (const key in inputs) {
    if (document.querySelector("#" + key) == null) continue;
    if (inputs[key].value === 1)
      document.querySelector("#" + key).classList.add("pressed");
    else document.querySelector("#" + key).classList.remove("pressed");
  }
  const leftStick = document.querySelector("#btn_10");
  const leftX = inputs["axis_0"].value * 0.5;
  const leftY = inputs["axis_1"].value * 0.5;
  leftStick.style.transform = 'translate(' + leftX + 'vh, ' + leftY + 'vh)';
  const rightStick = document.querySelector("#btn_11");
  const rightX = inputs["axis_2"].value * 0.5;
  const rightY = inputs["axis_3"].value * 0.5;
  rightStick.style.transform = 'translate(' + rightX + 'vh, ' + rightY + 'vh)';
}

function getInputs() {
  return inputs;
}

function getAllInputStates() {
  const returnInputs = {};
  const gamepad = navigator.getGamepads()[0];

  if (gamepad) {
    gamepad.buttons.forEach((button, index) => {
      if (button.value === Math.round(button.value)) {
        returnInputs[`btn_${index}`] = button.value;
      } else {
        if (button.value > 0.75) returnInputs[`btn_${index}`] = 1;
        else returnInputs[`btn_${index}`] = 0;
      }
    });

    gamepad.axes.forEach((axis, index) => {
      returnInputs[`axis_${index}`] = axis;
    });
    returnInputs["axis_4"] = gamepad.buttons[6].value;
    returnInputs["axis_5"] = gamepad.buttons[7].value;
  }

  const allStates = { ...keys, ...mouse, ...returnInputs };

  Object.keys(allStates).forEach(key => {
    if (document.querySelector("#state_" + key) == null) {
      const element = document.createElement("p");
      element.classList.add("key");
      element.innerText = key;
      element.id = "state_" + key;
      if (key.startsWith("key_")) document.querySelector(".keyboard").appendChild(element);
      else if (key.startsWith("mouse_")) document.querySelector(".mouse").appendChild(element);
      else document.querySelector(".controller").appendChild(element);
    }
    document.querySelector("#state_" + key).style.backgroundColor = (allStates[key] === 0) ? "white" : (allStates[key] > 0) ? "rgba(0,255,0," + Math.abs(allStates[key]) + ")" : "rgba(255,0,0," + Math.abs(allStates[key]) + ")";
  });
  return allStates;
}