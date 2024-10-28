if (!location.hash) location.hash = "#" + Math.random().toFixed(6).substring(2);

window.onload = ready;

import configs from "./configs.js";
import inputView from "./inputView.js";
import connect from "./connect.js";

async function ready() {
  if (localStorage.getItem("nickname") != null) document.querySelector("#nickname").value = localStorage.getItem("nickname");
  document.querySelector("#controllerContainer").innerHTML = await fetch("./res/controller.svg").then(response => response.text());
  await configs.init();
  await inputView.init(configs.getActiveConfig());

  document.querySelector("#config").onchange = setConfig;
  document.querySelector("#nickname").onchange = setNickname;
  document.querySelector("#export").onclick = configs.exportConfig;
  document.querySelector("#import").onclick = importConfig;
  document.querySelector("#import_new").onclick = () => importConfig(true);
  document.querySelector("#rename").onclick = rename;
  document.querySelector("#delete").onclick = deleteConfig;
  document.querySelector("#connect").onclick = connect.connect;

  setInterval(() => {
    inputView.checkInputs();
    inputView.update();
    connect.setInputs(inputView.getInputs());
  }, 10);
}

async function setConfig() {
  const name = document.querySelector("#config").value;
  if (configs.exists(name)) {
    configs.loadConfig(name);
    inputView.loadConfig(configs.getActiveConfig());
    return;
  }
  if (name == "New") {
    let newConfigName;
    while (true) {
      newConfigName = prompt("Name for the new config:");
      if (newConfigName == null || newConfigName == "New" || configs.exists(newConfigName)) continue;
      break;
    }
    configs.saveConfig(newConfigName, configs.getDefault());
    configs.loadConfig(newConfigName);
    inputView.loadConfig(configs.getActiveConfig());
  }
}

function setNickname() {
  localStorage.setItem("nickname", document.querySelector("#nickname").value);
}

function importConfig(name) {
  if (configs.getActiveConfigName() == "Default") return;
  if (name != true) name = null;
  else {
    while (true) {
      name = prompt("Name for the new config:");
      if (name == null || name == "New" || configs.exists(name)) continue;
      break;
    }
  }
  const link = document.createElement("input");
  link.type = "file";
  link.accept = ".json";
  link.onchange = () => {
    const file = link.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      configs.importConfig(JSON.parse(reader.result), name);
      inputView.loadConfig(configs.getActiveConfig());
    };
    reader.readAsText(file);
  };
  link.click();
}

function rename() {
  if (configs.getActiveConfigName() == "Default") return;
  let name;
  while (true) {
    name = prompt("New name for config:");
    if (name == null || name == "New" || configs.exists(name)) continue;
    break;
  }
  configs.rename(name);
  inputView.loadConfig(configs.getActiveConfig());
}

function deleteConfig() {
  if (configs.getActiveConfigName() == "Default") return;
  if (confirm("Are you sure you want to delete this config?")) {
    const configSelect = document.querySelector("#config");
    const oldName = configSelect.value;
    const option = configSelect.querySelector(`option[value="${oldName}"]`);
    const previousOption = configSelect.querySelector(`option[value="${oldName}"]`).previousElementSibling;
    configs.deleteConfig(configs.getActiveConfigName());
    option.remove();
    configSelect.value = previousOption.value;
    configs.loadConfig(configs.getActiveConfigName());
    inputView.loadConfig(configs.getActiveConfig());
  }
}