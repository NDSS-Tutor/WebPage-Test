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
                .select("username, is_admin")
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

                ${profile.is_admin ? `
                    <p><strong>Administrator</strong></p>

                    <button onclick="showAdminPage()">
                        Admin Panel
                    </button>
                ` : ""}
                ${profile.is_tutor ? `
                    <p><strong>Tutor</strong></p>

                    <button onclick="showTutorDashboard()">
                        Tutor Dashboard
                    </button>
                ` : `
                    <button onclick="showTutorApplication()">
                        Apply to Become a Tutor
                    </button>
                `}

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
async function showAdminPage() {

    const profile = await getCurrentProfile();

    if (!profile || !profile.is_admin) {
        content.innerHTML = `
            <h1 class="title">ACCESS DENIED</h1>
            <p>You do not have permission to access the Admin Panel.</p>
        `;
        return;
    }

    content.innerHTML = `
        <h1 class="title">ADMIN PANEL</h1>

        <div class="admin-container">

            <h2>Pending Posts</h2>

            <div id="pending-posts">
                <p>Loading pending posts...</p>
            </div>

            <hr>

            <h2>Tutor Applications</h2>

            <div id="tutor-applications">
                <p>Loading tutor applications...</p>
            </div>

        </div>
    `;

    await loadPendingPosts();
    await loadTutorApplications();
}
async function showTutorApplication() {

    content.innerHTML = `
        <h1 class="title">TUTOR APPLICATION</h1>

        <div class="account-container">

            <h2>Apply to Become a Tutor</h2>

            <p>
                Tell us what subject or subjects you would like
                to tutor and why you think you would be able to
                help other students.
            </p>

            <textarea
                id="tutor-reason"
                placeholder="Tell us about yourself and what you would like to tutor..."
            ></textarea>

            <button onclick="submitTutorApplication()">
                Submit Application
            </button>

            <button onclick="showAccountPage()">
                Cancel
            </button>

            <p id="tutor-message"></p>

        </div>
    `;
}
async function submitTutorApplication() {

    const reason =
        document.getElementById("tutor-reason").value.trim();

    const message =
        document.getElementById("tutor-message");


    if (!reason) {

        message.textContent =
            "Please explain why you would like to become a tutor.";

        return;
    }


    message.textContent = "Submitting application...";


    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "You must be logged in to apply.";

        return;
    }


    const { error } =
        await supabaseClient
            .from("tutor_applications")
            .insert({
                user_id: user.id,
                reason: reason,
                status: "pending"
            });


    if (error) {

        message.textContent =
            "Error: " + error.message;

        return;
    }


    message.textContent =
        "Your tutor application has been submitted!";
}
async function loadTutorApplications() {

    const container =
        document.getElementById("tutor-applications");

    const { data: applications, error } =
        await supabaseClient
            .from("tutor_applications")
            .select(`
                id,
                user_id,
                reason,
                status,
                created_at,
                profiles (
                    username
                )
            `)
            .eq("status", "pending")
            .order("created_at", { ascending: true });


    if (error) {

        container.innerHTML = `
            <p>
                Error loading tutor applications:
                ${escapeHTML(error.message)}
            </p>
        `;

        return;
    }


    if (!applications || applications.length === 0) {

        container.innerHTML = `
            <p>No tutor applications are currently waiting for review.</p>
        `;

        return;
    }


    container.innerHTML = applications.map(application => `

        <div class="tutor-application">

            <h3>
                ${escapeHTML(
                    application.profiles?.username || "Unknown User"
                )}
            </h3>

            <p>
                <strong>Application:</strong>
            </p>

            <p>
                ${escapeHTML(application.reason)}
            </p>

            <p>
                <strong>Submitted:</strong>
                ${new Date(application.created_at).toLocaleString()}
            </p>

            <button
                onclick="approveTutorApplication('${application.id}')"
            >
                Approve
            </button>

            <button
                onclick="rejectTutorApplication('${application.id}')"
            >
                Reject
            </button>

        </div>

    `).join("");
}
async function approveTutorApplication(applicationId) {

    const confirmed =
        confirm(
            "Approve this user as a tutor?"
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .rpc(
                "approve_tutor_application",
                {
                    application_id: applicationId
                }
            );


    if (error) {

        alert(
            "Error approving tutor application: " +
            error.message
        );

        return;
    }


    await loadTutorApplications();
}
async function rejectTutorApplication(applicationId) {

    const confirmed =
        confirm(
            "Reject and permanently delete this tutor application?"
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .rpc(
                "reject_tutor_application",
                {
                    application_id: applicationId
                }
            );


    if (error) {

        alert(
            "Error rejecting tutor application: " +
            error.message
        );

        return;
    }


    await loadTutorApplications();
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
async function getCurrentProfile() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("username, is_admin")
            .eq("id", user.id)
            .single();

    if (profileError) {
        return null;
    }

    return profile;
}
async function loadPendingPosts() {

    const container =
        document.getElementById("pending-posts");

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
            .eq("status", "pending")
            .order("created_at", { ascending: true });

    if (error) {
        container.innerHTML = `
            <p>Error loading posts: ${escapeHTML(error.message)}</p>
        `;
        return;
    }

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <p>No posts are currently waiting for review.</p>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `

        <div class="pending-post">

            <h2>Post Review</h2>

            <p>
                <strong>Submitted by:</strong>
                ${escapeHTML(post.profiles?.username || "Unknown")}
            </p>

            <label>Title</label>

            <input
                type="text"
                id="edit-title-${post.id}"
                value="${escapeAttribute(post.title)}"
            >

            <label>Category</label>

            <select id="edit-category-${post.id}">

                <option value="Book"
                    ${post.category === "Book" ? "selected" : ""}>
                    Book
                </option>

                <option value="Website"
                    ${post.category === "Website" ? "selected" : ""}>
                    Website
                </option>

                <option value="Article"
                    ${post.category === "Article" ? "selected" : ""}>
                    Article
                </option>

                <option value="Video"
                    ${post.category === "Video" ? "selected" : ""}>
                    Video
                </option>

                <option value="Study Resource"
                    ${post.category === "Study Resource" ? "selected" : ""}>
                    Study Resource
                </option>

                <option value="Tool"
                    ${post.category === "Tool" ? "selected" : ""}>
                    Tool
                </option>

                <option value="Recommendation"
                    ${post.category === "Recommendation" ? "selected" : ""}>
                    Recommendation
                </option>

                <option value="Other"
                    ${post.category === "Other" ? "selected" : ""}>
                    Other
                </option>

            </select>

            <label>Description</label>

            <textarea
                id="edit-description-${post.id}"
            >${escapeHTML(post.description)}</textarea>

            <label>Link</label>

            <input
                type="url"
                id="edit-link-${post.id}"
                value="${escapeAttribute(post.link || "")}"
            >

            <p>
                <strong>Submitted:</strong>
                ${new Date(post.created_at).toLocaleString()}
            </p>

            <button onclick="editPost('${post.id}')">
                Save Changes
            </button>

            <button onclick="approvePost('${post.id}')">
                Approve
            </button>

            <button onclick="rejectPost('${post.id}')">
                Reject & Delete
            </button>

        </div>

    `).join("");
}
async function editPost(postId) {

    const title =
        document.getElementById(`edit-title-${postId}`).value.trim();

    const category =
        document.getElementById(`edit-category-${postId}`).value;

    const description =
        document.getElementById(`edit-description-${postId}`).value.trim();

    const link =
        document.getElementById(`edit-link-${postId}`).value.trim();


    if (!title || !description) {
        alert("Title and description cannot be empty.");
        return;
    }


    const { error } =
        await supabaseClient
            .from("posts")
            .update({
                title: title,
                category: category,
                description: description,
                link: link || null
            })
            .eq("id", postId);


    if (error) {
        alert("Error saving changes: " + error.message);
        return;
    }


    alert("Post updated successfully!");

    await loadPendingPosts();
}
async function approvePost(postId) {

    const { error } =
        await supabaseClient
            .from("posts")
            .update({
                status: "approved"
            })
            .eq("id", postId);

    if (error) {
        alert("Error approving post: " + error.message);
        return;
    }

    await loadPendingPosts();
}
async function rejectPost(postId) {

    const confirmed =
        confirm("Are you sure you want to reject and permanently delete this post?");

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("posts")
            .delete()
            .eq("id", postId);


    if (error) {
        alert("Error deleting post: " + error.message);
        return;
    }


    await loadPendingPosts();
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