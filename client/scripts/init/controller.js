document.addEventListener("DOMContentLoaded", async () => {
    document.querySelector("#controllerContainer").innerHTML = await fetch("../res/images/controller.svg").then(response => response.text());
});