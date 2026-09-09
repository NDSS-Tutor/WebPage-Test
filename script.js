
const sidebar = document.querySelector(".side_stuff");
const buttons = document.querySelectorAll("#toggleSidebar");

function popup(){
    alert("V.3");
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
});