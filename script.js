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

let calendarDate = new Date();

Obutton.addEventListener("click", function () {
    sidebar.classList.add("open");
});

Xbutton.addEventListener("click", function () {
    sidebar.classList.remove("open");
});

function previousMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() - 1
    );

    loadCalendar();
}
function nextMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() + 1
    );

    loadCalendar();
}
async function loadCalendar() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        const days =
            document.getElementById("calendar-days");

        if (days) {
            days.innerHTML = `
                <p>You must be logged in to use Scheduling.</p>
            `;
        }

        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleString("default", {
            month: "long"
        });


    document.getElementById(
        "calendar-month"
    ).textContent =
        `${monthName} ${year}`;


    /*
     * Get the first and last day of the month.
     */

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);


    /*
     * Personal calendar events
     */

    const {
        data: personalEvents,
        error: personalError
    } = await supabaseClient
        .from("calendar_events")
        .select(`
            id,
            title,
            description,
            event_type,
            start_time,
            end_time
        `)
        .eq("owner_id", user.id);


    if (personalError) {

        console.error(
            "Calendar event error:",
            personalError
        );

        return;
    }


    /*
     * Tutoring sessions involving this user.
     */

    const {
        data: tutoringSessions,
        error: tutoringError
    } = await supabaseClient
        .from("tutoring_sessions")
        .select(`
            id,
            student_id,
            tutor_id,
            topic_id,
            start_time,
            end_time,
            status,
            topics (
                name
            )
        `)
        .or(
            `student_id.eq.${user.id},tutor_id.eq.${user.id}`
        )
        .eq("status", "accepted");


    if (tutoringError) {

        console.error(
            "Tutoring session error:",
            tutoringError
        );

        return;
    }


    /*
     * Create the calendar.
     */

    renderCalendar(
        year,
        month,
        personalEvents || [],
        tutoringSessions || []
    );
}
function renderCalendar(
    year,
    month,
    personalEvents,
    tutoringSessions
) {

    const calendarDays =
        document.getElementById("calendar-days");


    if (!calendarDays) {
        return;
    }


    calendarDays.innerHTML = "";


    const firstDay =
        new Date(year, month, 1);


    /*
     * JavaScript uses:
     * Sunday = 0
     * Monday = 1
     *
     * We want Monday to be the first
     * column.
     */

    let startingDay =
        firstDay.getDay();

    startingDay =
        startingDay === 0
            ? 6
            : startingDay - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /*
     * Empty cells before the first day.
     */

    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendarDays.appendChild(
            emptyDay
        );
    }


    /*
     * Actual days.
     */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement("div");

        dayElement.className =
            "calendar-day";


        const dateNumber =
            document.createElement("div");

        dateNumber.className =
            "calendar-date";

        dateNumber.textContent =
            day;


        dayElement.appendChild(
            dateNumber
        );


        /*
         * Events occurring on this day.
         */

        const dayEvents =
            personalEvents.filter(
                event => {

                    const eventDate =
                        new Date(
                            event.start_time
                        );

                    return (
                        eventDate.getFullYear() === year &&
                        eventDate.getMonth() === month &&
                        eventDate.getDate() === day
                    );
                }
            );


        dayEvents.forEach(event => {

            const eventElement =
                document.createElement("div");

            eventElement.className =
                "calendar-event";


            const start =
                new Date(
                    event.start_time
                );


            eventElement.textContent =
                `${start.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                })} ${event.title}`;


            dayElement.appendChild(
                eventElement
            );
        });


        /*
         * Tutoring sessions.
         */

        const tutoringDay =
            tutoringSessions.filter(
                session => {

                    const sessionDate =
                        new Date(
                            session.start_time
                        );

                    return (
                        sessionDate.getFullYear() === year &&
                        sessionDate.getMonth() === month &&
                        sessionDate.getDate() === day
                    );
                }
            );


        tutoringDay.forEach(session => {

            const eventElement =
                document.createElement("div");

            eventElement.className =
                "calendar-event tutoring-event";


            const start =
                new Date(
                    session.start_time
                );


            const topicName =
                session.topics?.name ||
                "Tutoring";


            eventElement.textContent =
                `${start.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                })} ${topicName} Tutoring`;


            dayElement.appendChild(
                eventElement
            );
        });


        calendarDays.appendChild(
            dayElement
        );
    }
}
function showPage(page){
    if (page === 'home'){
        content.innerHTML = `
            <h1>Home</h1>
        `;
    }
    else if (page === 'scheduling'){
        showSchedulingPage();
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
async function showCalendar() {

    const schedulingContent =
        document.getElementById("scheduling-content");

    if (!schedulingContent) {
        showSchedulingPage();
        return;
    }


    schedulingContent.innerHTML = `

        <div class="calendar-container">

            <div class="calendar-header">

                <button onclick="previousMonth()">
                    ←
                </button>

                <h2 id="calendar-month"></h2>

                <button onclick="nextMonth()">
                    →
                </button>

            </div>


            <div class="calendar-weekdays">

                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>

            </div>


            <div
                id="calendar-days"
                class="calendar-days"
            ></div>

        </div>

    `;


    await loadCalendar();
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
async function dropTutoringSession(sessionId) {

    const confirmed =
        confirm(
            "Are you sure you want to drop this tutoring session? The tutoring request will be reopened for another tutor."
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .rpc(
                "drop_tutoring_session",
                {
                    session_id: Number(sessionId)
                }
            );


    if (error) {

        alert(
            "Error dropping session: " +
            error.message
        );

        return;
    }


    alert(
        "The session has been dropped and the tutoring request has been reopened."
    );


    // Reload whatever tutor dashboard section
    // is displaying the sessions/requests.
    await loadTutorRequests();
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
                .select("username, is_admin, is_tutor")
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
                    <p><strong>Tutor Account</strong></p>

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

            <p>
                You do not have permission to access the Admin Panel.
            </p>
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

            <hr>

            <h2>Tutoring Requests</h2>

            <div id="admin-tutoring-requests">
                <p>Loading tutoring requests...</p>
            </div>

        </div>
    `;

    await loadPendingPosts();
    await loadTutorApplications();
    await loadAdminTutoringRequests();
}
async function showSchedulingPage() {

    content.innerHTML = `
        <h1 class="title">SCHEDULING</h1>

        <div class="scheduling-navigation">

            <button onclick="showCalendar()">
                Calendar
            </button>

            <button onclick="showTutoringPage()">
                Request Tutoring
            </button>

        </div>

        <div id="scheduling-content">
            <p>Loading calendar...</p>
        </div>
    `;

    await showCalendar();
}
async function loadAdminTutoringRequests() {

    const container =
        document.getElementById(
            "admin-tutoring-requests"
        );

    const { data: requests, error } =
        await supabaseClient
            .rpc("get_tutoring_requests");

    if (error) {

        container.innerHTML = `
            <p>
                Error loading tutoring requests:
                ${escapeHTML(error.message)}
            </p>
        `;

        return;
    }

    if (!openRequests || openRequests.length === 0) {

        container.innerHTML = `
            <p>
                There are currently no tutoring requests.
            </p>
        `;

        return;
    }

    container.innerHTML = openRequests.map(request => `

        <div class="tutoring-request">

            <h3>
                ${escapeHTML(request.topic_name)}
            </h3>

            <p>
                <strong>Student:</strong>
                ${escapeHTML(request.student_username)}
            </p>

            <p>
                <strong>Description:</strong>
            </p>

            <p>
                ${escapeHTML(request.description)}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(request.status)}
            </p>

            <p>
                <strong>Submitted:</strong>
                ${new Date(
                    request.created_at
                ).toLocaleString()}
            </p>

            ${
                request.status === "open"
                ? `
                    <button
                        onclick="adminCloseTutoringRequest('${request.id}')"
                    >
                        Close Request
                    </button>
                `
                : `
                    <button
                        onclick="adminReopenTutoringRequest('${request.id}')"
                    >
                        Reopen Request
                    </button>
                `
            }

        </div>

    `).join("");
}
async function adminCloseTutoringRequest(requestId) {

    const confirmed = confirm(
        "Close this tutoring request?"
    );

    if (!confirmed) {
        return;
    }

    const { error } =
        await supabaseClient
            .rpc("update_tutoring_request_status", {
                request_id: Number(requestId),
                new_status: "closed"
            });

    if (error) {

        alert(
            "Error closing request: " +
            error.message
        );

        return;
    }

    await loadAdminTutoringRequests();
}
async function adminReopenTutoringRequest(requestId) {

    const { error } =
        await supabaseClient
            .rpc("update_tutoring_request_status", {
                request_id: Number(requestId),
                new_status: "open"
            });

    if (error) {

        alert(
            "Error reopening request: " +
            error.message
        );

        return;
    }

    await loadAdminTutoringRequests();
}
async function showTutorDashboard() {

    const profile = await getCurrentProfile();

    if (!profile || !profile.is_tutor) {

        content.innerHTML = `
            <h1 class="title">ACCESS DENIED</h1>

            <div class="account-container">
                <p>You do not have permission to access the Tutor Dashboard.</p>
            </div>
        `;

        return;
    }

    content.innerHTML = `
        <h1 class="title">TUTOR DASHBOARD</h1>

        <div class="account-container">

            <button onclick="showTutorRequests()">
                View Tutoring Requests
            </button>

            <button onclick="showAccountPage()">
                Back to Account
            </button>

        </div>
    `;
}
async function showTutorRequests() {

    const profile = await getCurrentProfile();

    if (!profile || !profile.is_tutor) {

        content.innerHTML = `
            <h1 class="title">ACCESS DENIED</h1>
        `;

        return;
    }

    content.innerHTML = `
        <h1 class="title">TUTORING REQUESTS</h1>

        <div class="account-container">

            <button onclick="showTutorDashboard()">
                Back to Tutor Dashboard
            </button>

            <div id="tutor-requests">
                <p>Loading tutoring requests...</p>
            </div>

        </div>
    `;

    await loadTutorRequests();
}
async function loadTutorRequests() {

    const container =
        document.getElementById("tutor-requests");

    const { data: requests, error } =
        await supabaseClient
            .rpc("get_tutoring_requests");


    if (error) {

        container.innerHTML = `
            <p>
                Error loading tutoring requests:
                ${escapeHTML(error.message)}
            </p>
        `;

        return;
    }


    const openRequests =
        (requests || []).filter(
            request => request.status === "open"
        );


    if (openRequests.length === 0) {

        container.innerHTML = `
            <p>
                There are currently no tutoring requests
                matching your subjects.
            </p>
        `;

        return;
    }


    container.innerHTML =
        openRequests.map(request => {

            let buttons = "";

            if (request.status === "open") {

                buttons = `
                    <button
                        onclick="acceptTutoringRequest('${request.id}')"
                    >
                        Accept
                    </button>
                `;
            }


            return `

                <div class="tutoring-request">

                    <h2>
                        ${escapeHTML(request.topic_name)}
                    </h2>

                    <p>
                        <strong>Student:</strong>
                        ${escapeHTML(request.student_username)}
                    </p>

                    <p>
                        <strong>Request:</strong>
                    </p>

                    <p>
                        ${escapeHTML(request.description)}
                    </p>

                    <p>
                        <strong>Proposed Time:</strong>
                        ${new Date(
                            request.proposed_start
                        ).toLocaleString()}
                        -
                        ${new Date(
                            request.proposed_end
                        ).toLocaleTimeString()}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(request.status)}
                    </p>

                    ${buttons}

                </div>

            `;
        }).join("");
}
async function closeTutoringRequest(requestId) {

    const confirmed = confirm(
        "Close this tutoring request?"
    );

    if (!confirmed) {
        return;
    }

    const { error } =
        await supabaseClient
            .rpc("update_tutoring_request_status", {
                request_id: Number(requestId),
                new_status: "closed"
            });

    if (error) {

        alert(
            "Error closing request: " +
            error.message
        );

        return;
    }

    await loadTutorRequests();
}
async function reopenTutoringRequest(requestId) {

    const { error } =
        await supabaseClient
            .rpc("update_tutoring_request_status", {
                request_id: Number(requestId),
                new_status: "open"
            });

    if (error) {

        alert(
            "Error reopening request: " +
            error.message
        );

        return;
    }

    await loadTutorRequests();
}
async function showTutoringPage() {

    const schedulingContent =
        document.getElementById("scheduling-content");

    if (!schedulingContent) {
        showSchedulingPage();
        return;
    }


    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        schedulingContent.innerHTML = `
            <div class="account-container">

                <h2>Request Tutoring</h2>

                <p>
                    You must be logged in to request tutoring.
                </p>

                <button onclick="showAccountPage()">
                    Go to Account
                </button>

                <button onclick="showCalendar()">
                    Back to Calendar
                </button>

            </div>
        `;

        return;
    }


    const {
        data: topics,
        error: topicError
    } = await supabaseClient
        .from("topics")
        .select("id, name")
        .eq("active", true)
        .order("name");


    if (topicError) {

        schedulingContent.innerHTML = `
            <div class="account-container">

                <h2>Request Tutoring</h2>

                <p>
                    Error loading tutoring topics:
                    ${escapeHTML(topicError.message)}
                </p>

                <button onclick="showCalendar()">
                    Back to Calendar
                </button>

            </div>
        `;

        return;
    }


    schedulingContent.innerHTML = `

        <div class="account-container">

            <h2>Request Tutoring</h2>

            <p>
                Select the subject you need help with and
                explain what you would like help on.
            </p>


            <label for="tutoring-topic">
                Subject
            </label>

            <select id="tutoring-topic">

                <option value="">
                    Select a subject
                </option>

                ${topics.map(topic => `
                    <option value="${topic.id}">
                        ${escapeHTML(topic.name)}
                    </option>
                `).join("")}

            </select>


            <label for="tutoring-description">
                What do you need help with?
            </label>

            <textarea
                id="tutoring-description"
                placeholder="Explain what you need help with..."
            ></textarea>


            <label for="tutoring-date">
                Preferred Date
            </label>

            <input
                type="date"
                id="tutoring-date"
            >


            <label for="tutoring-start">
                Preferred Start Time
            </label>

            <input
                type="time"
                id="tutoring-start"
            >


            <label for="tutoring-end">
                Preferred End Time
            </label>

            <input
                type="time"
                id="tutoring-end"
            >


            <br><br>

            <button onclick="submitTutoringRequest()">
                Submit Request
            </button>

            <button onclick="showCalendar()">
                Cancel
            </button>

            <p id="tutoring-message"></p>

        </div>
    `;
}
async function acceptTutoringRequest(requestId) {

    const confirmed =
        confirm(
            "Accept this tutoring session?"
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .rpc(
                "accept_tutoring_request",
                {
                    request_id: Number(requestId)
                }
            );


    if (error) {

        alert(
            "Error accepting request: " +
            error.message
        );

        return;
    }


    alert(
        "Tutoring session accepted! It has been added to your calendar and the student's calendar."
    );


    await loadTutorRequests();
}
async function declineTutoringRequest(requestId) {

    const confirmed =
        confirm(
            "Decline this tutoring request?"
        );

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id: Number(requestId),
                    new_status: "declined"
                }
            );


    if (error) {

        alert(
            "Error declining request: " +
            error.message
        );

        return;
    }


    await loadTutorRequests();
}
async function submitTutoringRequest() {

    const topicId =
        document
            .getElementById("tutoring-topic")
            .value;

    const description =
        document
            .getElementById("tutoring-description")
            .value
            .trim();

    const date =
        document
            .getElementById("tutoring-date")
            .value;

    const startTime =
        document
            .getElementById("tutoring-start")
            .value;

    const endTime =
        document
            .getElementById("tutoring-end")
            .value;

    const message =
        document.getElementById("tutoring-message");


    if (!topicId) {

        message.textContent =
            "Please select a subject.";

        return;
    }


    if (!description) {

        message.textContent =
            "Please explain what you need help with.";

        return;
    }


    if (!date || !startTime || !endTime) {

        message.textContent =
            "Please select a date and time.";

        return;
    }


    const proposedStart =
        `${date}T${startTime}:00+04:00`;

    const proposedEnd =
        `${date}T${endTime}:00+04:00`;

    if (new Date(proposedEnd) <= new Date(proposedStart)) {

        message.textContent =
            "The end time must be after the start time.";

        return;
    }


    message.textContent =
        "Submitting tutoring request...";


    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "You must be logged in.";

        return;
    }


    const { data: requestId, error } =
        await supabaseClient
            .rpc("create_tutoring_request", {
                p_topic_id: Number(topicId),
                p_description: description,
                p_date: date,
                p_start_time: startTime,
                p_end_time: endTime
            });


    if (error) {

        message.textContent =
            "Error: " + error.message;

        return;
    }


    message.textContent =
        "Your tutoring request has been submitted!";

    setTimeout(() => {
        showTutoringPage();
    }, 1500);
}
async function submitTutorApplication() {

    const reason =
        document.getElementById("tutor-reason").value.trim();

    const message =
        document.getElementById("tutor-message");

    const selectedTopics =
        Array.from(
            document.querySelectorAll(
                'input[name="tutor-topic"]:checked'
            )
        ).map(input => Number(input.value));


    if (!reason) {

        message.textContent =
            "Please explain why you would like to become a tutor.";

        return;
    }


    if (selectedTopics.length === 0) {

        message.textContent =
            "Please select at least one topic.";

        return;
    }


    if (selectedTopics.length > 3) {

        message.textContent =
            "You can select a maximum of 3 topics.";

        return;
    }


    message.textContent =
        "Submitting application...";


    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "You must be logged in to apply.";

        return;
    }


    // Create the application
    const {
        data: application,
        error: applicationError
    } = await supabaseClient
        .from("tutor_applications")
        .insert({
            user_id: user.id,
            reason: reason,
            status: "pending"
        })
        .select("id")
        .single();


    if (applicationError) {

        message.textContent =
            "Error: " + applicationError.message;

        return;
    }


    // Add selected topics to the application
    const topicRows =
        selectedTopics.map(topicId => ({
            application_id: application.id,
            topic_id: topicId
        }));


    const { error: topicError } =
        await supabaseClient
            .from("tutor_application_topics")
            .insert(topicRows);


    if (topicError) {

        // Remove the application if its topics failed
        await supabaseClient
            .from("tutor_applications")
            .delete()
            .eq("id", application.id);

        message.textContent =
            "Error saving topics: " + topicError.message;

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
async function showTutorApplication() {

    const {
        data: topics,
        error
    } = await supabaseClient
        .from("topics")
        .select("id, name")
        .eq("active", true)
        .order("name");

    if (error) {

        content.innerHTML = `
            <h1 class="title">TUTOR APPLICATION</h1>

            <div class="account-container">
                <p>
                    Error loading topics:
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;

        return;
    }

    content.innerHTML = `
        <h1 class="title">TUTOR APPLICATION</h1>

        <div class="account-container">

            <h2>Apply to Become a Tutor</h2>

            <p>
                Select up to three subjects that you would like
                to tutor.
            </p>

            <div id="tutor-topics">

                ${topics.map(topic => `

                    <label>
                        <input
                            type="checkbox"
                            name="tutor-topic"
                            value="${topic.id}"
                        >

                        ${escapeHTML(topic.name)}
                    </label>

                    <br>

                `).join("")}

            </div>

            <br>

            <label for="tutor-reason">
                Why would you like to become a tutor?
            </label>

            <textarea
                id="tutor-reason"
                placeholder="Tell us about yourself and why you would be able to help other students..."
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
async function updateTopicCount() {

    const selected =
        document.querySelectorAll(
            'input[name="tutor-topic"]:checked'
        );

    const count =
        document.getElementById("topic-count");

    count.textContent =
        `${selected.length} / 3 topics selected`;

    if (selected.length >= 3) {

        document
            .querySelectorAll('input[name="tutor-topic"]:not(:checked)')
            .forEach(input => {
                input.disabled = true;
            });

    } else {

        document
            .querySelectorAll('input[name="tutor-topic"]')
            .forEach(input => {
                input.disabled = false;
            });
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
            .select("username, is_admin, is_tutor")
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