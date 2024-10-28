import configs from "./configs.js";

let inputs;
let categories;
let target;

export default {
  init,
  loadConfig,
  getKeyName,
  checkInputs,
  update,
  getInputs
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
}

function getKeyName(key) {
  if (key == null) return "Unbound";
  if (key.startsWith("key_"))
    return key.replace("key_", "").toUpperCase() + " Key";
  if (inputs[key]) return inputs[key].name;
  return key;
}

function loadConfig(config) {
  const inputButtons = document.querySelectorAll(".inputButton");
  const disable = document.querySelector("#config").value == "Default";
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
  if (target == event.target) {
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
}

function keyDown(event) {
  for (const key in inputs) {
    const localKey = localStorage.getItem(key);
    if (localKey == "key_" + event.code.replace("Key", "")) {
      inputs[key].value = 1;
      break;
    }
  }
  if (target != null) {
    if (event.key == "Escape") {
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
  for (const key in inputs) {
    const localKey = localStorage.getItem(key);
    if (localKey == "key_" + event.code.replace("Key", "")) {
      inputs[key].value = 0;
      break;
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
      if (localKey == "btn_" + i) {
        inputs[key].value = buttons[i];
        break;
      }
    }
    if (target && buttons[i] == 1) {
      configs.saveKey(target.dataset.key, "btn_" + i);
      target.textContent = getKeyName(
        configs.getActiveConfig()[target.dataset.key]
      );
      target = null;
    }
  }
  let axes = gamepad.axes;
  for (let i = 0; i < axes.length; i++) {
    for (const key in inputs) {
      const localKey = localStorage.getItem(key);
      if (localKey == "axis_" + i) {
        inputs[key].value = axes[i];
        break;
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
    if (inputs[key].value == 1)
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
