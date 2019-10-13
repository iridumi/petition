//(function signPetition() {
let canvas = document.getElementById("canvas");
//let submit = document.querySelector("#submit");
let hidden = document.getElementById("hidden");
let c = canvas.getContext("2d");
let signing = false;
let x, y;

canvas.addEventListener("mousedown", function(e) {
    x = e.pageX - canvas.offsetLeft;
    y = e.pageY - canvas.offsetTop;
    signing = true;
});

canvas.addEventListener("mousemove", function(e) {
    if (signing === true) {
        draw(c, x, y, e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;
    }
});

document.addEventListener("mouseup", function(e) {
    if (signing === true) {
        draw(c, x, y, e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        x = 0;
        y = 0;
        signing = false;
    }
});

function draw(c, xInit, yInit, xFin, yFin) {
    c.beginPath();
    c.strokeStyle = "blue";
    c.lineWidth = 4;
    c.moveTo(xInit, yInit);
    c.lineTo(xFin, yFin);
    c.stroke();
    c.closePath();
    hidden.value = canvas.toDataURL();
}

// submit.addEventListener("click", () => {
//     hidden.value = canvas.toDataURL();
//     //console.log(hidden.value);
// });
//})();
