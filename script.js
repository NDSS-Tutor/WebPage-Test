const SUPABASE_URL = "https://syxmioodlxwyoyqpezum.supabase.co/rest/v1/g";
const SUPABASE_KEY = "sb_publishable_CTHgfFkjGTCTKWo9AUC6Fw_99m3JKQE";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

alert("Supabase loaded:", supabaseClient);


const sidebar = document.querySelector(".side_bar");
const content = document.getElementById("content");
const Obutton = document.querySelector("#openSide");
const Xbutton = document.querySelector("#closeSide");

Obutton.addEventListener("click", function () {
    sidebar.classList.add("open");
});

Xbutton.addEventListener("click", function () {
    sidebar.classList.remove("open");
});


function showPage(page){
    if (page === 'home'){
        content.innerHTML = `
            <h1>Home</h1>
        `;
    }
    else if (page === 'scheduling'){
        content.innerHTML = `
            <h1>Scheduling</h1>
        `;
    }
    else if (page === 'site-info'){
        content.innerHTML = `
            <h1 class="title">SITE INFO</h1>
        `;
    }
    else if (page === 'ph'){
        
    }
}