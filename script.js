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
    else if (page === 'resources'){
        showPostsPage();
    }
    else if (page === 'tools'){
        content.innerHTML = `
            <h1>Study Tools</h1>
        `;
    }
    else if (page === 'groups'){
        content.innerHTML = `
            <h1>Study Groups</h1>
        `;
    }
    else if (page === 'account'){
        showAccountPage();
    }
    else if (page === 'site-info'){
        content.innerHTML = `
            <h1 class="title">SITE INFO</h1>
        `;
    }
}
async function showPostsPage() {

    content.innerHTML = `
        <h1 class="title">POSTS</h1>

        <div class="posts-container">

            <button onclick="showCreatePost()">
                + Create Post
            </button>

            <div id="posts-list">
                <p>Loading posts...</p>
            </div>

        </div>
    `;

    await loadPosts();
}
function showCreatePost() {

    content.innerHTML = `
        <h1 class="title">CREATE POST</h1>

        <div class="post-form">

            <label for="post-title">Title</label>

            <input
                type="text"
                id="post-title"
                placeholder="Post title"
            >

            <label for="post-category">Category</label>

            <select id="post-category">
                <option value="Book">Book</option>
                <option value="Website">Website</option>
                <option value="Article">Article</option>
                <option value="Video">Video</option>
                <option value="Study Resource">Study Resource</option>
                <option value="Tool">Tool</option>
                <option value="Recommendation">Recommendation</option>
                <option value="Other">Other</option>
            </select>

            <label for="post-description">Description</label>

            <textarea
                id="post-description"
                placeholder="Explain what makes this resource useful..."
            ></textarea>

            <label for="post-link">Link (optional)</label>

            <input
                type="url"
                id="post-link"
                placeholder="https://example.com"
            >

            <button onclick="createPost()">
                Submit for Review
            </button>

            <button onclick="showPostsPage()">
                Cancel
            </button>

            <p id="post-message"></p>

        </div>
    `;
}
async function createPost() {

    const title =
        document.getElementById("post-title").value.trim();

    const description =
        document.getElementById("post-description").value.trim();

    const link =
        document.getElementById("post-link").value.trim();

    const category =
        document.getElementById("post-category").value;

    const message =
        document.getElementById("post-message");


    if (!title || !description) {

        message.textContent =
            "Please enter a title and description.";

        return;
    }


    message.textContent = "Submitting post...";


    // Get the currently logged-in user
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "You must be logged in to create a post.";

        return;
    }


    const { error } =
        await supabaseClient
            .from("posts")
            .insert({
                user_id: user.id,
                title: title,
                description: description,
                link: link || null,
                category: category,
                status: "pending"
            });


    if (error) {

        message.textContent =
            "Error: " + error.message;

        return;
    }


    message.textContent =
        "Post submitted for review!";


    setTimeout(() => {
        showPostsPage();
    }, 1500);
}
async function loadPosts() {

    const postsList =
        document.getElementById("posts-list");

    const { data: posts, error } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                title,
                description,
                link,
                category,
                created_at,
                profiles (
                    username
                )
            `)
            .eq("status", "approved")
            .order("created_at", { ascending: false });


    if (error) {

        postsList.innerHTML =
            `<p>Error loading posts: ${error.message}</p>`;

        return;
    }


    if (!posts || posts.length === 0) {

        postsList.innerHTML =
            `<p>No approved posts yet.</p>`;

        return;
    }


    postsList.innerHTML = posts.map(post => `

        <article class="post">

            <h2>${escapeHTML(post.title)}</h2>

            <p class="post-category">
                ${escapeHTML(post.category)}
            </p>

            <p>
                ${escapeHTML(post.description)}
            </p>

            ${
                post.link
                ? `<a href="${escapeAttribute(post.link)}"
                      target="_blank"
                      rel="noopener noreferrer">
                      View Resource
                   </a>`
                : ""
            }

            <p class="post-author">
                Posted by:
                ${escapeHTML(post.profiles?.username || "Unknown")}
            </p>

            <p class="post-date">
                ${new Date(post.created_at).toLocaleDateString()}
            </p>

        </article>

    `).join("");
}
async function showAccountPage() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (session) {

        const { data: profile, error } =
            await supabaseClient
                .from("profiles")
                .select("username")
                .eq("id", session.user.id)
                .single();

        if (error || !profile) {

            await supabaseClient.auth.signOut();

            content.innerHTML = `
                <h1 class="title">ACCOUNT</h1>

                <div class="account-container">
                    <p>Your account is no longer available.</p>
                    <p>Please create a new account or log in with another account.</p>
                </div>
            `;

            return;
        }

        content.innerHTML = `
            <h1 class="title">ACCOUNT</h1>

            <div class="account-container">
                <h2>Logged In</h2>

                <p>Username: <strong>${profile.username}</strong></p>

                <button onclick="logOut()">Log Out</button>
            </div>
        `;

    } else {

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

    showAccountPage();
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

    showAccountPage();
}
async function logOut() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Error logging out: " + error.message);
        return;
    }

    showAccountPage();
}
async function checkAdmin() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        return;
    }

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("username, is_admin")
            .eq("id", user.id)
            .single();

    if (error) {
        return;
    }

    if (profile.is_admin) {
        console.log("ADMIN ACCOUNT");
    }
}

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
function escapeAttribute(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}