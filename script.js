
const sidebar = document.querySelector(".side_stuff");
const Obutton = document.querySelector("#openSide");
const Xbutton = document.querySelector("#closeSide");

function popup(){
    alert("V.3");
}

Obutton.addEventListener("click", function() {
    sidebar.classList.add("open");
});
Xbutton.addEventListener("click", function() {
    sidebar.classList.remove("open");
});