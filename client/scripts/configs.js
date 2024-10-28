let defaultConfig;

export default {
    init,
    loadConfig,
    saveConfig,
    deleteConfig,
    getActiveConfig,
    getActiveConfigName,
    exists,
    getDefault,
    saveKey,
    exportConfig,
    importConfig,
    rename
};

let configs = JSON.parse(localStorage.getItem("configs"));

async function init() {
    defaultConfig = await fetch("./res/default.json").then(response => response.json());
    if (configs == null) {
        configs = {
            "Default": defaultConfig
        };
        localStorage.setItem("configs", JSON.stringify(configs));
    }
    if (configs["Default"] == null) {
        configs["Default"] = defaultConfig;
        localStorage.setItem("configs", JSON.stringify(configs));
    }

    const configSelect = document.querySelector("#config");
    for (const name in configs) {
        if (name == "Default") continue;
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        configSelect.insertBefore(option, configSelect.lastElementChild);
    }

    loadConfig(localStorage.getItem("config") || "Default");
    configSelect.value = localStorage.getItem("config") || "Default";
}

function loadConfig(name) {
    if (configs == null) return;
    if (configs[name] == null) return;
    for (const key in configs[name]) {
        localStorage.setItem(key, configs[name][key]);
    }
    localStorage.setItem("config", name);
    return configs[name];
}

function saveConfig(name, config) {
    if (configs == null) null;
    if (name == "Default") return;
    if (configs[name] == null) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        const configSelect = document.querySelector("#config");
        configSelect.insertBefore(option, configSelect.lastElementChild);
        configSelect.value = name;
    }
    configs[name] = config;
    localStorage.setItem("configs", JSON.stringify(configs));
}

function deleteConfig(name) {
    if (configs == null) return;
    if (name == "Default") return;
    delete configs[name];
    localStorage.setItem("configs", JSON.stringify(configs));
}

function getActiveConfig() {
    return configs[document.querySelector("#config").value];
}

function getActiveConfigName() {
    return document.querySelector("#config").value;
}

function exists(name) {
    if (configs == null) return false;
    return name in configs;
}

function getDefault() {
    return defaultConfig;
}

function saveKey(key, value) {
    const config = getActiveConfig();
    config[key] = value;
    saveConfig(document.querySelector("#config").value, config);
    localStorage.setItem(key, value);
}

function exportConfig() {
    const config = getActiveConfig();
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.json";
    link.click();
    URL.revokeObjectURL(url);
}

function importConfig(config, name) {
    if (name == null) name = document.querySelector("#config").value;
    saveConfig(name, config);
    loadConfig(name);
}

function rename(name) {
    if (name == null || name == "New" || exists(name)) return;
    const config = getActiveConfig();
    const oldName = document.querySelector("#config").value;

    const configSelect = document.querySelector("#config");
    const option = configSelect.querySelector(`option[value="${oldName}"]`);
    option.textContent = name;
    option.value = name;
    configSelect.value = name;

    configs[name] = {};
    saveConfig(name, config);
    deleteConfig(oldName);
    
    loadConfig(name);
}
