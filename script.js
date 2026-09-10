const sidebar = document.querySelector(".side_stuff");
const content = document.getElementById("content");
const Obutton = document.querySelector("#openSide");
const Xbutton = document.querySelector("#closeSide");

function openSide(){
    sidebar.classList.add("open");
}
function closeSide(){
    sidebar.classList.remove("open");
}
Obutton.addEventListener("click", openSide())
Xbutton.addEventListener("click", closeSide())


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
    Obutton = document.querySelector("#openSide");
    Obutton.addEventListener("click", openSide())
}