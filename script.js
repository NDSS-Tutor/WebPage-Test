const sidebar = document.querySelector(".side_stuff");
const content = document.getElementById("content");
const Obutton = document.querySelector("#openSide");
const Xbutton = document.querySelector("#closeSide");

Obutton.addEventListener("click", function() {
    sidebar.classList.add("open");
});
Xbutton.addEventListener("click", function() {
    sidebar.classList.remove("open");
});

function showPage(page){
    if (page === 'home'){
        content.innerHTML = `
            <button id="openSide">O</button>
            <h1>Home</h1>
        `;
    }
    if (page === 'scheduling'){
        content.innerHTML = `
            <button id="openSide">O</button>
            <h1>Scheduling</h1>
        `;
    }
    if (page === 'ph'){
        
    }
}