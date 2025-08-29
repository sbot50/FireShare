const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.classList) node.classList.contains("hover") ? addHover(node) : null;
            if (node.querySelectorAll) {
                const hoverChildren = node.querySelectorAll(".hover");
                hoverChildren.forEach((child) => addHover(child));
            }
        });
    });
});

let hover;

document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    hover = document.querySelector("#hover");

    const elements = document.body.querySelectorAll(".hover");
    elements.forEach((element) => addHover(element));
});

function addHover(element) {
    element.addEventListener("mouseover", () => startHover(element));
    element.addEventListener("mouseout", endHover);
}

function startHover(element) {
    hover.style.display = "block";
    hover.innerHTML = element.dataset.hoverText || "";
    hover.style.left = element.getBoundingClientRect().left + "px";
    hover.style.top = element.getBoundingClientRect().bottom + "px";
}

function endHover() {
    hover.style.display = "none";
    hover.innerHTML = "";
    hover.style.left = "";
    hover.style.top = "";
}