import init from "../init/controls.js"; //Dependency
const inputs = await fetch("../res/data/inputs.json").then((response) => response.json());

let buttons;
const kb_keys = {};
const mouse = {};
const controller = {};

document.addEventListener("keydown", (event) => keyDown(event));
document.addEventListener("keyup", (event) => keyUp(event));
document.addEventListener("mousemove", (event) => mouseMoved(event));
document.addEventListener("mousedown", (event) => mouseDown(event));
document.addEventListener("mouseup", (event) => mouseUp(event));
init.then(async () => {
    buttons = document.body.querySelectorAll("#controls .inputButton");
    setInterval(() => {
        const stickLeft = {
            stick: null,
            x: 0,
            y: 0
        };
        const stickRight = {
            stick: null,
            x: 0,
            y: 0
        };
        buttons.forEach((button) => {
            let value = button.dataset.value;
            const keys = value.match(/\${(.*?)}/g) || [];
            for (let key of keys) {
                key = key.replace("${", "").replace("}", "");
                let keyValue = 0;
                if (Object.keys(kb_keys).includes(key)) keyValue = kb_keys[key];
                else if (Object.keys(mouse).includes(key)) keyValue = mouse[key];
                else if (Object.keys(controller).includes(key)) keyValue = controller[key];
                value = value.replace("${" + key + "}", keyValue.toString());
            }
            value = window.math.evaluate(value);
            const node = document.querySelector(`#${inputs[button.dataset.key].id}`);
            const sectionTitle = button.parentNode.parentNode.firstElementChild.textContent;
            if (sectionTitle === "Left Stick") {
                value *= 0.5;
                stickLeft.stick = document.querySelector(`#${inputs[button.dataset.key].id}`);

                const buttonLabel = button.parentNode.previousElementSibling.textContent;
                if (buttonLabel.includes("Down") || buttonLabel.includes("Stick Left")) value *= -1;
                if (buttonLabel.includes("Up") || buttonLabel.includes("Down")) stickLeft.y -= value;
                else stickLeft.x += value;
            } else if (sectionTitle === "Right Stick") {
                value *= 0.5;
                stickRight.stick = document.querySelector(`#${inputs[button.dataset.key].id}`);

                const buttonLabel = button.parentNode.previousElementSibling.textContent;
                if (buttonLabel.includes("Down") || buttonLabel.includes("Stick Left")) value *= -1;
                if (buttonLabel.includes("Up") || buttonLabel.includes("Down")) stickRight.y -= value;
                else stickRight.x += value;
            } else {
                if (value > 0.75) node.classList.add("pressed");
                else node.classList.remove("pressed");
            }
        });
        console.log(stickLeft.x, stickLeft.y);
        stickLeft.stick.style.transform = `translate(${stickLeft.x}vh, ${stickLeft.y}vh)`;
        stickRight.stick.style.transform = `translate(${stickRight.x}vh, ${stickRight.y}vh)`;
    },1);
});

function keyDown(event) {
    const key = "key_" + event.code.replace("Key", "");
    kb_keys[key] = 1;
}

function keyUp(event) {
    const key = "key_" + event.code.replace("Key", "");
    kb_keys[key] = 0;
}

function mouseMoved(event) {
    mouse["mouse_x"] = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouse["mouse_y"] = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
}

function mouseDown(event) {
    if (event.button === 0) mouse["mouse_left"] = 1;
    if (event.button === 1) mouse["mouse_middle"] = 1;
    if (event.button === 2) mouse["mouse_right"] = 1;
}

function mouseUp(event) {
    if (event.button === 0) mouse["mouse_left"] = 0;
    if (event.button === 1) mouse["mouse_middle"] = 0;
    if (event.button === 2) mouse["mouse_right"] = 0;
}