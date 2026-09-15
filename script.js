const SUPABASE_URL = "https://syxmioodlxwyoyqpezum.supabase.co";
const SUPABASE_KEY = "sb_publishable_CTHgfFkjGTCTKWo9AUC6Fw_99m3JKQE";
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


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
    else if (page === 'account'){
        content.innerHTML = `
            <h1 class="title">ACCOUNT</h1>
            <div class="account-container">
                <h2>Create Account</h2>
                <input
                    type="text"
                    id="signup-username"
                    placeholder="Username"
                >
                <input
                    type="password"
                    id="signup-password"
                    placeholder="Password"
                >
                <button onclick="signUp()">Create Account</button>
                <hr>
                <h2>Log In</h2>
                <input
                    type="text"
                    id="login-username"
                    placeholder="Username"
                >
                <input
                    type="password"
                    id="login-password"
                    placeholder="Password"
                >
                <button onclick="logIn()">Log In</button>
                <p id="account-message"></p>
            </div>
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

async function signUp() {

    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;

    const message = document.getElementById("account-message");

    if (!username || !password) {
        message.textContent = "Please enter a username and password.";
        return;
    }

    // Only allow safe username characters
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        message.textContent =
            "Username can only contain letters, numbers, _ and -.";
        return;
    }

    message.textContent = "Creating account...";

    // Create an internal email address for Supabase Auth
    const authEmail = username.toLowerCase() + "@site19.local";

    const { data, error } = await supabaseClient.auth.signUp({
        email: authEmail,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    if (!data.user) {
        message.textContent = "Account could not be created.";
        return;
    }

    message.textContent = "Account created successfully!";
}

async function logIn() {

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    const message = document.getElementById("account-message");

    if (!username || !password) {
        message.textContent = "Please enter a username and password.";
        return;
    }

    message.textContent = "Logging in...";

    const authEmail = username.toLowerCase() + "@site19.local";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: authEmail,
            password: password
        });

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Logged in successfully!";
}