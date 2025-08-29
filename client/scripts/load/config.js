import init from "../init/controls.js"; //Dependency
import translate from "../util/translate.js";
let configName;
let config;
let clickedButton;
let ignore = false;
let mouse_x;
let mouse_y;

document.addEventListener("keydown", (event) => keyPressed(event));
document.addEventListener("keyup", (event) => keyReleased(event));
document.addEventListener("mousemove", (event) => mouseMoved(event));
document.addEventListener("mousedown", (event) => mouseClicked(event));
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.body.addEventListener("click", (event) => cancelBind(event));
init.then(async () => {
    const buttons = document.body.querySelectorAll("#controls .inputButton");
    buttons.forEach((button) => {
        button.addEventListener("click", () => changeButton(button));
        button.nextElementSibling.addEventListener("click", () => unbindButton(button));
    });

    configName = localStorage.getItem("lastConfig") || "Default";
    config = await getConfig(configName);
    loadConfig();

    document.querySelector("#config").addEventListener("change", async () => {
        if (document.querySelector("#config").value === "New") {
            await showAlert();
            loadConfig();
        } else {
            configName = document.querySelector("#config").value;
            config = await getConfig(configName);
            loadConfig();
        }
        localStorage.setItem("lastConfig", configName);
    });
});

async function showAlert() {
    const name = prompt("Enter config name");
    if (name) {
        const config = await fetch("../res/data/default.json").then((response) => response.json());
        localStorage.setItem("config_" + name, JSON.stringify(config));

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        document.querySelector("#config").insertBefore(option, document.querySelector("#config").lastElementChild);
        document.querySelector("#config").value = name;
    } else {
        document.querySelector("#config").value = configName;
    }
}

async function changeButton(button) {
    if (button.disabled) return;
    if (button === clickedButton) {
        clickedButton = null;
        const value = {
            input: `\${mouse_left}`,
            negative: false,
            advanced: false,
        }
        setButton(button, value);
        return;
    }
    ignore = true;
    clickedButton = button;
    button.textContent = "...";
}

async function unbindButton(button) {
    if (button.disabled) return;
    setButton(button, null);
}

async function getConfig(name) {
    let config;
    if (name === "Default") {
        config = await fetch("../res/data/default.json").then((response) => response.json());
    } else {
        config = JSON.parse(localStorage.getItem("config_" + name));
    }

    return config;
}

function loadConfig() {
    const buttons = document.body.querySelectorAll("#controls .inputButton");
    buttons.forEach((button) => {
        button.disabled = configName === "Default";
        const key = button.dataset.key;
        const value = config[key];
        setButton(button, value);
    });
}

function setButton(button, value) {
    if (!value || !value.input.match(/^\${.*?}$/) && !value.advanced) {
        button.textContent = "Unbound";
        button.dataset.value = "0";
    } else {
        const splitKey = value.input
            .replace("${", "")
            .replace("}", "")
            .split("-");
        const buttonKey = splitKey[splitKey.length - 1];
        if (buttonKey.startsWith("btn") || buttonKey.startsWith("axis")) {
            const translated = translate.keyToButton(buttonKey);
            button.textContent = translated.label;
            button.dataset.value = JSON.stringify(value);
            if (buttonKey.startsWith("axis") && value.negative)
                button.textContent = translated.label
                    .replace("Up", "Down")
                    .replace("Left", "Right");
        } else if (buttonKey.startsWith("key")) {
            const keyText = buttonKey.replace("key_", "");
            button.textContent = keyText.charAt(0).toUpperCase() + keyText.slice(1).toLowerCase() + " Key";
            button.dataset.value = JSON.stringify(value);
        } else if (buttonKey.startsWith("mouse")) {
            const keyText = buttonKey.replace("mouse_", "");
            button.textContent = "Mouse " + keyText.charAt(0).toUpperCase() + keyText.slice(1).toLowerCase();
            button.dataset.value = JSON.stringify(value);
        }
    }
}

function keyPressed(event) {
    if (!clickedButton) return;
    const key = "key_" + event.code.replace("Key", "");
    const value = {
        input: `\${${key}}`,
        negative: false,
        advanced: false,
    }
    setButton(clickedButton, value);
    clickedButton = null;
}

function keyReleased(event) {

}

function mouseMoved(event) {
    if (!clickedButton) return;

    const x = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
    const y = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
    const x_movement = Math.abs(Math.abs(mouse_x) - Math.abs(x));
    const y_movement = Math.abs(Math.abs(mouse_y) - Math.abs(y));

    const value = {
        negative: false,
        advanced: false,
    }
    if (x_movement > 0.2) {
        value.input = `\${mouse_x}`;
        setButton(clickedButton, value);
        clickedButton = null;
    } else if (y_movement > 0.2) {
        value.input = `\${mouse_y}`;
        setButton(clickedButton, value);
        clickedButton = null;
    }
}

function mouseClicked(event) {
    if (!clickedButton) return;
    event.preventDefault();
    if (event.button === 1) {
        const value = {
            input: `\${mouse_middle}`,
            negative: false,
            advanced: false,
        }
        setButton(clickedButton, value);
        clickedButton = null;
    } else if (event.button === 2) {
        const value = {
            input: `\${mouse_right}`,
            negative: false,
            advanced: false,
        }
        setButton(clickedButton, value);
        clickedButton = null;
    }
}

function cancelBind(event) {
    if (!ignore && clickedButton) {
        setButton(clickedButton, JSON.parse(clickedButton.dataset.value));
        clickedButton = null;
    } else {
        mouse_x = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
        mouse_y = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
        ignore = false;
    }
}