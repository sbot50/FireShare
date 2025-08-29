const list = await fetch("../res/data/translation.json").then((response) => response.json());

const inputs = await fetch("../res/data/inputs.json").then((response) => response.json());

function keyToButton(key) {
    return inputs[list[key]];
}

function buttonToKey(button) {
    return Object.keys(list).find(key => list[key] === button.internal);
}

export default { keyToButton, buttonToKey };