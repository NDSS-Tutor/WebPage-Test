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

let notificationSubscription = null;
let messageSubscription = null;


/* =========================================================
   SIDEBAR
   ========================================================= */

if (Obutton) {
    Obutton.addEventListener("click", function () {
        sidebar.classList.add("open");
    });
}

if (Xbutton) {
    Xbutton.addEventListener("click", function () {
        sidebar.classList.remove("open");
    });
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    await updateNotificationBadge();

    initializeNotificationRealtime();

});


/* =========================================================
   NOTIFICATION SYSTEM
   ========================================================= */

function findAccountSidebarButton() {

    const possibleButtons = document.querySelectorAll(
        ".sidebarBTN"
    );

    for (const button of possibleButtons) {

        const onclick =
            button.getAttribute("onclick") || "";

        if (
            onclick.includes("showPage('account')") ||
            onclick.includes('showPage("account")') ||
            onclick.includes("showPage(`account`)")
        ) {
            return button;
        }
    }

    return null;
}


function addNotificationBadge() {

    const accountButton =
        findAccountSidebarButton();

    if (!accountButton) {
        return;
    }

    let badge =
        accountButton.querySelector(".notification-badge");

    if (!badge) {

        badge =
            document.createElement("span");

        badge.className =
            "notification-badge";

        accountButton.appendChild(badge);
    }

    return badge;
}


async function updateNotificationBadge() {

    const badge =
        addNotificationBadge();

    if (!badge) {
        return;
    }

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();

    if (!user) {

        badge.style.display = "none";

        return;
    }


    const {
        count,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq("user_id", user.id)
            .eq("is_read", false);


    if (error) {

        console.error(
            "Notification count error:",
            error
        );

        badge.style.display = "none";

        return;
    }


    if (!count || count <= 0) {

        badge.style.display =
            "none";

        return;
    }


    badge.textContent =
        count > 99
            ? "99+"
            : count;

    badge.style.display =
        "flex";
}


function initializeNotificationRealtime() {

    if (notificationSubscription) {
        return;
    }


    notificationSubscription =
        supabaseClient
            .channel("notification-updates")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications"
                },
                async () => {

                    await updateNotificationBadge();

                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications"
                },
                async () => {

                    await updateNotificationBadge();

                }
            )
            .subscribe();
}


async function loadNotifications() {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();

    if (!user) {
        return [];
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(`
                id,
                type,
                title,
                message,
                related_session_id,
                is_read,
                created_at
            `)
            .eq("user_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(50);


    if (error) {

        console.error(
            "Notification loading error:",
            error
        );

        return [];
    }


    return data || [];
}


async function markNotificationRead(notificationId) {

    const { error } =
        await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq("id", notificationId);


    if (error) {

        console.error(
            "Notification read error:",
            error
        );

        return;
    }


    await updateNotificationBadge();
}


async function markAllNotificationsRead() {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();

    if (!user) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq("user_id", user.id)
            .eq("is_read", false);


    if (error) {

        alert(
            "Error marking notifications as read: " +
            error.message
        );

        return;
    }


    await showAccountPage();
}


function notificationIcon(type) {

    switch (type) {

        case "message":
            return "💬";

        case "session":
            return "📅";

        case "note":
            return "📝";

        case "progress":
            return "📈";

        case "request":
            return "📚";

        default:
            return "🔔";
    }
}


function formatNotificationDate(date) {

    return new Date(date).toLocaleString(
        [],
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


async function renderNotifications() {

    const container =
        document.getElementById(
            "notifications-list"
        );

    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Loading notifications...</p>";


    const notifications =
        await loadNotifications();


    if (!notifications.length) {

        container.innerHTML = `
            <div class="empty-state">
                <p>You have no notifications.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        notifications.map(notification => `

            <div
                class="notification-item ${
                    notification.is_read
                        ? "notification-read"
                        : "notification-unread"
                }"
                onclick="openNotification(
                    '${notification.id}',
                    '${notification.related_session_id || ""}'
                )"
            >

                <div class="notification-icon">
                    ${notificationIcon(notification.type)}
                </div>

                <div class="notification-content">

                    <strong>
                        ${escapeHTML(notification.title)}
                    </strong>

                    <p>
                        ${escapeHTML(notification.message)}
                    </p>

                    <small>
                        ${formatNotificationDate(
                            notification.created_at
                        )}
                    </small>

                </div>

            </div>

        `).join("");
}


async function openNotification(
    notificationId,
    sessionId
) {

    await markNotificationRead(
        notificationId
    );


    if (sessionId) {

        await openSessionDetails(
            sessionId
        );

        return;
    }


    await showAccountPage();
}


/* =========================================================
   CALENDAR NAVIGATION
   ========================================================= */

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


/* =========================================================
   CALENDAR LOADING
   ========================================================= */

async function loadCalendar() {

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        const days =
            document.getElementById(
                "calendar-days"
            );

        if (days) {

            days.innerHTML = `
                <p>
                    You must be logged in
                    to use Scheduling.
                </p>
            `;
        }

        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleString(
            "default",
            {
                month: "long"
            }
        );


    const monthElement =
        document.getElementById(
            "calendar-month"
        );


    if (monthElement) {

        monthElement.textContent =
            `${monthName} ${year}`;
    }


    const {
        data: personalEvents,
        error: personalError
    } =
        await supabaseClient
            .from("calendar_events")
            .select(`
                id,
                title,
                description,
                event_type,
                start_time,
                end_time
            `)
            .eq(
                "owner_id",
                user.id
            );


    if (personalError) {

        console.error(
            "Calendar event error:",
            personalError
        );

        return;
    }


    const {
        data: tutoringSessions,
        error: tutoringError
    } =
        await supabaseClient
            .from("tutoring_sessions")
            .select(`
                id,
                student_id,
                tutor_id,
                topic_id,
                start_time,
                end_time,
                status,
                location,
                topics (
                    name
                )
            `)
            .or(
                `student_id.eq.${user.id},tutor_id.eq.${user.id}`
            )
            .eq(
                "status",
                "accepted"
            );


    if (tutoringError) {

        console.error(
            "Tutoring session error:",
            tutoringError
        );

        return;
    }


    renderCalendar(
        year,
        month,
        personalEvents || [],
        tutoringSessions || []
    );
}


/* =========================================================
   CALENDAR RENDERING
   ========================================================= */

function renderCalendar(
    year,
    month,
    personalEvents,
    tutoringSessions
) {

    const calendarDays =
        document.getElementById(
            "calendar-days"
        );


    if (!calendarDays) {
        return;
    }


    calendarDays.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


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


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        const emptyDay =
            document.createElement(
                "div"
            );

        emptyDay.className =
            "calendar-day empty";

        calendarDays.appendChild(
            emptyDay
        );
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement(
                "div"
            );

        dayElement.className =
            "calendar-day";


        const dateNumber =
            document.createElement(
                "div"
            );

        dateNumber.className =
            "calendar-date";

        dateNumber.textContent =
            day;


        dayElement.appendChild(
            dateNumber
        );


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


        dayEvents.forEach(
            event => {

                const eventElement =
                    document.createElement(
                        "div"
                    );

                eventElement.className =
                    "calendar-event";


                const start =
                    new Date(
                        event.start_time
                    );


                const location =
                    session.location || "Location not specified";

                eventElement.textContent =
                    `${start.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit"
                    })} ${topicName} Tutoring`;

                eventElement.title =
                    `Location: ${location}`;


                dayElement.appendChild(
                    eventElement
                );
            }
        );


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


        tutoringDay.forEach(
            session => {

                const eventElement =
                    document.createElement(
                        "div"
                    );


                eventElement.className =
                    "calendar-event tutoring-event session-calendar-event";


                const start =
                    new Date(
                        session.start_time
                    );


                const topicName =
                    session.topics?.name ||
                    "Tutoring";


                eventElement.innerHTML = `
                    <span class="session-event-time">
                        ${start.toLocaleTimeString(
                            [],
                            {
                                hour: "numeric",
                                minute: "2-digit"
                            }
                        )}
                    </span>

                    <span class="session-event-title">
                        ${escapeHTML(topicName)}
                        Tutoring
                    </span>
                `;


                eventElement.title =
                    "Click to open tutoring session";


                eventElement.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        openSessionDetails(
                            session.id
                        );
                    }
                );


                dayElement.appendChild(
                    eventElement
                );
            }
        );


        calendarDays.appendChild(
            dayElement
        );
    }
}


/* =========================================================
   SESSION DETAILS
   ========================================================= */

async function openSessionDetails(
    sessionId
) {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {

        alert(
            "You must be logged in."
        );

        return;
    }


    const {
        data: session,
        error
    } =
        await supabaseClient
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
            .eq(
                "id",
                sessionId
            )
            .single();


    if (error || !session) {

        alert(
            "Unable to load this tutoring session."
        );

        return;
    }


    if (
        session.student_id !== user.id &&
        session.tutor_id !== user.id
    ) {

        alert(
            "You do not have access to this session."
        );

        return;
    }


    const isTutor =
        session.tutor_id === user.id;


    const topicName =
        session.topics?.name ||
        "Tutoring";


    createSessionModal();


    const modal =
        document.getElementById(
            "session-modal"
        );


    const modalContent =
        document.getElementById(
            "session-modal-content"
        );


    modalContent.innerHTML = `

        <div class="session-modal-header">

            <div>

                <h2>
                    ${escapeHTML(topicName)}
                    Tutoring
                </h2>

                <p>
                    ${new Date(
                        session.start_time
                    ).toLocaleString()}
                </p>

            </div>

            <button
                class="session-modal-close"
                onclick="closeSessionModal()"
            >
                ×
            </button>

        </div>


        <div class="session-tabs">

            <button
                class="session-tab"
                onclick="showSessionTab(
                    'notes',
                    '${session.id}'
                )"
            >
                📝 Notes
            </button>

            <button
                class="session-tab"
                onclick="showSessionTab(
                    'progress',
                    '${session.id}'
                )"
            >
                📈 Progress
            </button>

        </div>


        <div
            id="session-tab-content"
            class="session-tab-content"
        >
            <p>Loading...</p>
        </div>

    `;


    modal.classList.add(
        "session-modal-visible"
    );


    await showSessionTab(
        "notes",
        session.id
    );


    initializeMessageRealtime(
        session.id
    );
}


function createSessionModal() {

    if (
        document.getElementById(
            "session-modal"
        )
    ) {
        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "session-modal";

    modal.className =
        "session-modal";


    modal.innerHTML = `

        <div
            class="session-modal-backdrop"
            onclick="closeSessionModal()"
        ></div>

        <div
            class="session-modal-box"
        >

            <div
                id="session-modal-content"
            ></div>

        </div>

    `;


    document.body.appendChild(
        modal
    );
}


function closeSessionModal() {

    const modal =
        document.getElementById(
            "session-modal"
        );


    if (modal) {

        modal.classList.remove(
            "session-modal-visible"
        );
    }


    if (messageSubscription) {

        supabaseClient.removeChannel(
            messageSubscription
        );

        messageSubscription = null;
    }
}


async function showSessionTab(
    tab,
    sessionId
) {

    document
        .querySelectorAll(
            ".session-tab"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );
        });


    const buttons =
        document.querySelectorAll(
            ".session-tab"
        );


    buttons.forEach(
        button => {

            if (
                button.getAttribute(
                    "onclick"
                )?.includes(
                    `'${tab}'`
                )
            ) {

                button.classList.add(
                    "active"
                );
            }
        }
    );


    const container =
        document.getElementById(
            "session-tab-content"
        );


    if (!container) {
        return;
    }

    if (tab === "notes") {

        await renderSessionNotes(
            sessionId
        );

        return;
    }


    if (tab === "progress") {

        await renderSessionProgress(
            sessionId
        );

        return;
    }
}

/* =========================================================
   SESSION NOTES
   ========================================================= */

async function renderSessionNotes(
    sessionId
) {

    const container =
        document.getElementById(
            "session-tab-content"
        );


    if (!container) {
        return;
    }


    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    const {
        data: session
    } =
        await supabaseClient
            .from("tutoring_sessions")
            .select(
                "id, tutor_id, student_id"
            )
            .eq(
                "id",
                sessionId
            )
            .single();


    if (!session) {

        container.innerHTML =
            "<p>Session not found.</p>";

        return;
    }


    const isTutor =
        session.tutor_id === user.id;


    const {
        data: notes,
        error
    } =
        await supabaseClient
            .from("session_notes")
            .select(`
                id,
                session_id,
                author_id,
                content,
                visible_to_student,
                created_at,
                updated_at,
                profiles (
                    username
                )
            `)
            .eq(
                "session_id",
                sessionId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading notes:
                ${escapeHTML(error.message)}
            </p>
        `;

        return;
    }


    const visibleNotes =
        isTutor
            ? notes || []
            : (notes || []).filter(
                note =>
                    note.visible_to_student
            );


    container.innerHTML = `

        <div class="session-notes">

            <div class="section-heading">

                <div>

                    <h3>Session Notes</h3>

                    <p>
                        ${
                            isTutor
                                ? "Add notes about this student's session."
                                : "Notes shared by your tutor."
                        }
                    </p>

                </div>

            </div>


            ${
                isTutor
                    ? `
                        <form
                            class="note-form"
                            onsubmit="
                                saveSessionNote(
                                    event,
                                    '${sessionId}'
                                )
                            "
                        >

                            <textarea
                                id="session-note-input"
                                placeholder="Write a note about this session..."
                                maxlength="5000"
                                required
                            ></textarea>

                            <label class="checkbox-label">

                                <input
                                    type="checkbox"
                                    id="note-visible-to-student"
                                    checked
                                >

                                Make this note visible
                                to the student

                            </label>

                            <button type="submit">
                                Add Note
                            </button>

                        </form>
                    `
                    : ""
            }


            <div class="notes-list">

                ${
                    !visibleNotes.length
                        ? `
                            <div class="empty-state">
                                <p>
                                    No notes have been added yet.
                                </p>
                            </div>
                        `
                        : visibleNotes.map(
                            note => `

                                <div
                                    class="session-note-card"
                                >

                                    <div
                                        class="note-card-header"
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                note.profiles?.username ||
                                                "Tutor"
                                            )}
                                        </strong>

                                        <small>
                                            ${new Date(
                                                note.created_at
                                            ).toLocaleString()}
                                        </small>

                                    </div>

                                    <p>
                                        ${escapeHTML(
                                            note.content
                                        )}
                                    </p>

                                    ${
                                        isTutor
                                            ? `
                                                <span
                                                    class="
                                                        note-visibility
                                                        ${
                                                            note.visible_to_student
                                                                ? "visible"
                                                                : "private"
                                                        }
                                                ">
                                                    ${
                                                        note.visible_to_student
                                                            ? "Visible to student"
                                                            : "Private tutor note"
                                                    }
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>

                            `
                        ).join("")
                }

            </div>

        </div>

    `;
}


async function saveSessionNote(
    event,
    sessionId
) {

    event.preventDefault();


    const input =
        document.getElementById(
            "session-note-input"
        );


    const visibility =
        document.getElementById(
            "note-visible-to-student"
        );


    const content =
        input?.value.trim();


    if (!content) {
        return;
    }


    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("session_notes")
            .insert({
                session_id: Number(sessionId),
                author_id: user.id,
                content: content,
                visible_to_student:
                    visibility
                        ? visibility.checked
                        : true
            });


    if (error) {

        alert(
            "Error saving note: " +
            error.message
        );

        return;
    }


    await renderSessionNotes(
        sessionId
    );
}


/* =========================================================
   STUDENT PROGRESS
   ========================================================= */

async function renderSessionProgress(
    sessionId
) {

    const container =
        document.getElementById(
            "session-tab-content"
        );


    if (!container) {
        return;
    }


    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    const {
        data: session,
        error: sessionError
    } =
        await supabaseClient
            .from("tutoring_sessions")
            .select(`
                id,
                student_id,
                tutor_id,
                topic_id,
                topics (
                    name
                )
            `)
            .eq(
                "id",
                sessionId
            )
            .single();


    if (
        sessionError ||
        !session
    ) {

        container.innerHTML =
            "<p>Session not found.</p>";

        return;
    }


    const isTutor =
        session.tutor_id === user.id;


    const {
        data: progress,
        error
    } =
        await supabaseClient
            .from("student_progress")
            .select(`
                id,
                student_id,
                tutor_id,
                topic_id,
                title,
                description,
                status,
                created_at,
                updated_at,
                profiles!student_progress_tutor_id_fkey (
                    username
                )
            `)
            .eq(
                "student_id",
                session.student_id
            )
            .eq(
                "topic_id",
                session.topic_id
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading progress:
                ${escapeHTML(error.message)}
            </p>
        `;

        return;
    }


    container.innerHTML = `

        <div class="progress-section">

            <div class="section-heading">

                <div>

                    <h3>
                        Student Progress
                    </h3>

                    <p>
                        ${escapeHTML(
                            session.topics?.name ||
                            "Tutoring"
                        )}
                    </p>

                </div>

            </div>


            ${
                isTutor
                    ? `
                        <form
                            class="progress-form"
                            onsubmit="
                                saveStudentProgress(
                                    event,
                                    '${session.id}',
                                    '${session.student_id}',
                                    '${session.topic_id}'
                                )
                            "
                        >

                            <label
                                for="progress-title"
                            >
                                Topic / Skill
                            </label>

                            <input
                                type="text"
                                id="progress-title"
                                placeholder="e.g. Quadratic equations"
                                maxlength="200"
                                required
                            >

                            <label
                                for="progress-description"
                            >
                                Progress Notes
                            </label>

                            <textarea
                                id="progress-description"
                                placeholder="Describe what the student understands, what needs work, or what they should practice next..."
                                maxlength="5000"
                                required
                            ></textarea>

                            <label
                                for="progress-status"
                            >
                                Status
                            </label>

                            <select
                                id="progress-status"
                            >

                                <option value="needs_work">
                                    Needs Work
                                </option>

                                <option value="in_progress">
                                    In Progress
                                </option>

                                <option value="developing">
                                    Developing
                                </option>

                                <option value="understood">
                                    Understood
                                </option>

                                <option value="mastered">
                                    Mastered
                                </option>

                            </select>

                            <button type="submit">
                                Save Progress
                            </button>

                        </form>
                    `
                    : ""
            }


            <div class="progress-list">

                ${
                    !progress?.length
                        ? `
                            <div class="empty-state">
                                <p>
                                    No progress has been recorded
                                    for this subject yet.
                                </p>
                            </div>
                        `
                        : progress.map(
                            item => `

                                <div
                                    class="progress-card"
                                >

                                    <div
                                        class="progress-card-header"
                                    >

                                        <h4>
                                            ${escapeHTML(
                                                item.title
                                            )}
                                        </h4>

                                        <span
                                            class="
                                                progress-status
                                                status-${escapeAttribute(
                                                    item.status
                                                )}
                                            "
                                        >
                                            ${formatProgressStatus(
                                                item.status
                                            )}
                                        </span>

                                    </div>

                                    <p>
                                        ${escapeHTML(
                                            item.description
                                        )}
                                    </p>

                                    <small>
                                        Last updated:
                                        ${new Date(
                                            item.updated_at
                                        ).toLocaleString()}
                                    </small>

                                </div>

                            `
                        ).join("")
                }

            </div>

        </div>

    `;
}


function formatProgressStatus(
    status
) {

    const labels = {

        needs_work:
            "Needs Work",

        in_progress:
            "In Progress",

        developing:
            "Developing",

        understood:
            "Understood",

        mastered:
            "Mastered"
    };


    return (
        labels[status] ||
        status
    );
}


async function saveStudentProgress(
    event,
    sessionId,
    studentId,
    topicId
) {

    event.preventDefault();


    const title =
        document
            .getElementById(
                "progress-title"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "progress-description"
            )
            .value
            .trim();


    const status =
        document
            .getElementById(
                "progress-status"
            )
            .value;


    if (!title || !description) {

        alert(
            "Please enter a topic and progress description."
        );

        return;
    }


    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {
        return;
    }


    const {
        data: existing
    } =
        await supabaseClient
            .from("student_progress")
            .select("id")
            .eq(
                "student_id",
                studentId
            )
            .eq(
                "tutor_id",
                user.id
            )
            .eq(
                "topic_id",
                topicId
            )
            .eq(
                "title",
                title
            )
            .maybeSingle();


    let error;


    if (existing) {

        ({
            error
        } =
            await supabaseClient
                .from("student_progress")
                .update({
                    description:
                        description,
                    status:
                        status,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    existing.id
                ));

    } else {

        ({
            error
        } =
            await supabaseClient
                .from("student_progress")
                .insert({
                    student_id:
                        studentId,
                    tutor_id:
                        user.id,
                    topic_id:
                        topicId,
                    title:
                        title,
                    description:
                        description,
                    status:
                        status
                }));
    }


    if (error) {

        alert(
            "Error saving progress: " +
            error.message
        );

        return;
    }


    await renderSessionProgress(
        sessionId
    );
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(page) {

    if (page === "home") {

        content.innerHTML = `
            <h1>Home</h1>
        `;

    }

    else if (page === "scheduling") {

        showSchedulingPage();

    }

    else if (page === "resources") {

        showPostsPage();

    }

    else if (page === "tools") {

        content.innerHTML = `
            <h1>Study Tools</h1>
        `;

    }

    else if (page === "groups") {

        content.innerHTML = `
            <h1>Study Groups</h1>
        `;

    }

    else if (page === "account") {

        showAccountPage();

    }

    else if (page === "site-info") {

        content.innerHTML = `
            <h1 class="title">
                SITE INFO
            </h1>
        `;
    }
}


/* =========================================================
   SCHEDULING
   ========================================================= */

async function showCalendar() {

    const schedulingContent =
        document.getElementById(
            "scheduling-content"
        );


    if (!schedulingContent) {

        showSchedulingPage();

        return;
    }


    schedulingContent.innerHTML = `

        <div class="calendar-container">

            <div class="calendar-header">

                <button
                    onclick="previousMonth()"
                >
                    ←
                </button>

                <h2 id="calendar-month"></h2>

                <button
                    onclick="nextMonth()"
                >
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


async function showSchedulingPage() {

    content.innerHTML = `

        <h1 class="title">
            SCHEDULING
        </h1>

        <div class="scheduling-navigation">

            <button
                onclick="showCalendar()"
            >
                Calendar
            </button>

            <button
                onclick="showTutoringPage()"
            >
                Request Tutoring
            </button>

        </div>

        <div id="scheduling-content">
            <p>
                Loading calendar...
            </p>
        </div>

    `;


    await showCalendar();
}


/* =========================================================
   POSTS
   ========================================================= */

async function showPostsPage() {

    content.innerHTML = `

        <h1 class="title">
            POSTS
        </h1>

        <div class="posts-container">

            <button
                onclick="showCreatePost()"
            >
                + Create Post
            </button>

            <div id="posts-list">
                <p>
                    Loading posts...
                </p>
            </div>

        </div>

    `;

    await loadPosts();
}


function showCreatePost() {

    content.innerHTML = `

        <h1 class="title">
            CREATE POST
        </h1>

        <div class="post-form">

            <label for="post-title">
                Title
            </label>

            <input
                type="text"
                id="post-title"
                placeholder="Post title"
            >


            <label for="post-category">
                Category
            </label>

            <select id="post-category">

                <option value="Book">
                    Book
                </option>

                <option value="Website">
                    Website
                </option>

                <option value="Article">
                    Article
                </option>

                <option value="Video">
                    Video
                </option>

                <option value="Study Resource">
                    Study Resource
                </option>

                <option value="Tool">
                    Tool
                </option>

                <option value="Recommendation">
                    Recommendation
                </option>

                <option value="Other">
                    Other
                </option>

            </select>


            <label for="post-description">
                Description
            </label>

            <textarea
                id="post-description"
                placeholder="Explain what makes this resource useful..."
            ></textarea>


            <label for="post-link">
                Link (optional)
            </label>

            <input
                type="url"
                id="post-link"
                placeholder="https://example.com"
            >


            <button
                onclick="createPost()"
            >
                Submit for Review
            </button>


            <button
                onclick="showPostsPage()"
            >
                Cancel
            </button>


            <p id="post-message"></p>

        </div>
    `;
}


async function createPost() {

    const title =
        document
            .getElementById(
                "post-title"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "post-description"
            )
            .value
            .trim();


    const link =
        document
            .getElementById(
                "post-link"
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                "post-category"
            )
            .value;


    const message =
        document.getElementById(
            "post-message"
        );


    if (!title || !description) {

        message.textContent =
            "Please enter a title and description.";

        return;
    }


    message.textContent =
        "Submitting post...";


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        message.textContent =
            "You must be logged in to create a post.";

        return;
    }


    const { error } =
        await supabaseClient
            .from("posts")
            .insert({
                user_id:
                    user.id,
                title:
                    title,
                description:
                    description,
                link:
                    link || null,
                category:
                    category,
                status:
                    "pending"
            });


    if (error) {

        message.textContent =
            "Error: " +
            error.message;

        return;
    }


    message.textContent =
        "Post submitted for review!";


    setTimeout(
        () => {
            showPostsPage();
        },
        1500
    );
}


async function loadPosts() {

    const postsList =
        document.getElementById(
            "posts-list"
        );


    const {
        data: posts,
        error
    } =
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
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        postsList.innerHTML =
            `<p>
                Error loading posts:
                ${escapeHTML(error.message)}
            </p>`;

        return;
    }


    if (
        !posts ||
        posts.length === 0
    ) {

        postsList.innerHTML =
            `<p>
                No approved posts yet.
            </p>`;

        return;
    }


    postsList.innerHTML =
        posts.map(
            post => `

                <article class="post">

                    <h2>
                        ${escapeHTML(
                            post.title
                        )}
                    </h2>

                    <p class="post-category">
                        ${escapeHTML(
                            post.category
                        )}
                    </p>

                    <p class="post-description">
                        ${escapeHTML(
                            post.description
                        )}
                    </p>

                    ${
                        post.link
                            ? `
                                <a
                                    href="${escapeAttribute(
                                        post.link
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Resource
                                </a>
                            `
                            : ""
                    }

                    <p class="post-author">
                        Posted by:
                        ${escapeHTML(
                            post.profiles?.username ||
                            "Unknown"
                        )}
                    </p>

                    <p class="post-date">
                        ${new Date(
                            post.created_at
                        ).toLocaleDateString()}
                    </p>

                </article>

            `
        ).join("");
}


/* =========================================================
   ACCOUNT
   ========================================================= */

async function showAccountPage() {

    const {
        data: { session }
    } =
        await supabaseClient.auth.getSession();


    if (session) {

        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "username, is_admin, is_tutor"
                )
                .eq(
                    "id",
                    session.user.id
                )
                .single();


        if (
            error ||
            !profile
        ) {

            await supabaseClient.auth.signOut();

            content.innerHTML = `

                <h1 class="title">
                    ACCOUNT
                </h1>

                <div class="account-container">

                    <p>
                        Your account is no longer available.
                    </p>

                    <p>
                        Please create a new account
                        or log in with another account.
                    </p>

                </div>

            `;

            return;
        }


        const notifications =
            await loadNotifications();


        content.innerHTML = `

            <h1 class="title">
                ACCOUNT
            </h1>


            <div class="account-container">

                <h2>
                    Logged In
                </h2>


                <p>
                    Username:
                    <strong>
                        ${escapeHTML(
                            profile.username
                        )}
                    </strong>
                </p>


                ${
                    profile.is_admin
                        ? `
                            <p>
                                <strong>
                                    Administrator
                                </strong>
                            </p>

                            <button
                                onclick="showAdminPage()"
                            >
                                Admin Panel
                            </button>
                        `
                        : ""
                }


                ${
                    profile.is_tutor
                        ? `
                            <p>
                                <strong>
                                    Tutor Account
                                </strong>
                            </p>

                            <button
                                onclick="showTutorDashboard()"
                            >
                                Tutor Dashboard
                            </button>
                        `
                        : `
                            <button
                                onclick="showTutorApplication()"
                            >
                                Apply to Become a Tutor
                            </button>
                        `
                }


                <hr>


                <div class="notifications-section">

                    <div class="notifications-heading">

                        <div>

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                ${
                                    notifications.filter(
                                        notification =>
                                            !notification.is_read
                                    ).length
                                }
                                unread
                            </p>

                        </div>

                        ${
                            notifications.some(
                                notification =>
                                    !notification.is_read
                            )
                                ? `
                                    <button
                                        onclick="
                                            markAllNotificationsRead()
                                        "
                                    >
                                        Mark All Read
                                    </button>
                                `
                                : ""
                        }

                    </div>


                    <div
                        id="notifications-list"
                        class="notifications-list"
                    ></div>

                </div>


                <hr>


                <button
                    onclick="logOut()"
                >
                    Log Out
                </button>

            </div>

        `;


        await renderNotifications();

        await updateNotificationBadge();

    } else {

        content.innerHTML = `

            <h1 class="title">
                ACCOUNT
            </h1>

            <div class="account-container">

                <h2>
                    Create Account
                </h2>


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


                <button
                    onclick="signUp()"
                >
                    Create Account
                </button>


                <hr>


                <h2>
                    Log In
                </h2>


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


                <button
                    onclick="logIn()"
                >
                    Log In
                </button>


                <p id="account-message"></p>

            </div>

        `;
    }
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function signUp() {

    const username =
        document
            .getElementById(
                "signup-username"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "signup-password"
            )
            .value;


    const message =
        document.getElementById(
            "account-message"
        );


    if (!username || !password) {

        message.textContent =
            "Please enter a username and password.";

        return;
    }


    if (
        !/^[a-zA-Z0-9_-]+$/.test(
            username
        )
    ) {

        message.textContent =
            "Username can only contain letters, numbers, _ and -.";

        return;
    }


    message.textContent =
        "Creating account...";


    const authEmail =
        username.toLowerCase() +
        "@site19.local";


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({
            email:
                authEmail,
            password:
                password,
            options: {
                data: {
                    username:
                        username
                }
            }
        });


    if (error) {

        message.textContent =
            "Error: " +
            error.message;

        return;
    }


    if (!data.user) {

        message.textContent =
            "Account could not be created.";

        return;
    }


    showAccountPage();
}


async function logIn() {

    const username =
        document
            .getElementById(
                "login-username"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "login-password"
            )
            .value;


    const message =
        document.getElementById(
            "account-message"
        );


    if (!username || !password) {

        message.textContent =
            "Please enter a username and password.";

        return;
    }


    message.textContent =
        "Logging in...";


    const authEmail =
        username.toLowerCase() +
        "@site19.local";


    const {
        error
    } =
        await supabaseClient.auth.signInWithPassword({
            email:
                authEmail,
            password:
                password
        });


    if (error) {

        message.textContent =
            "Error: " +
            error.message;

        return;
    }


    await updateNotificationBadge();

    showAccountPage();
}


async function logOut() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert(
            "Error logging out: " +
            error.message
        );

        return;
    }


    const badge =
        addNotificationBadge();


    if (badge) {

        badge.style.display =
            "none";
    }


    showAccountPage();
}


/* =========================================================
   PROFILE
   ========================================================= */

async function getCurrentProfile() {

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (
        userError ||
        !user
    ) {

        return null;
    }


    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "username, is_admin, is_tutor"
            )
            .eq(
                "id",
                user.id
            )
            .single();


    if (profileError) {

        return null;
    }


    return profile;
}


/* =========================================================
   TUTOR DASHBOARD
   ========================================================= */

async function showTutorDashboard() {

    const profile =
        await getCurrentProfile();


    if (
        !profile ||
        !profile.is_tutor
    ) {

        content.innerHTML = `

            <h1 class="title">
                ACCESS DENIED
            </h1>

            <div class="account-container">

                <p>
                    You do not have permission
                    to access the Tutor Dashboard.
                </p>

            </div>

        `;

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            TUTOR DASHBOARD
        </h1>


        <div class="account-container tutor-dashboard">

            <button
                onclick="showTutorRequests()"
            >
                View Tutoring Requests
            </button>


            <button
                onclick="showTutorSessions()"
            >
                My Sessions
            </button>


            <button
                onclick="showTutorStudents()"
            >
                My Students
            </button>


            <button
                onclick="showCalendarFromTutorDashboard()"
            >
                Calendar
            </button>


            <button
                onclick="showAccountPage()"
            >
                Back to Account
            </button>

        </div>

    `;
}


async function showCalendarFromTutorDashboard() {

    showPage("scheduling");
}


async function showTutorRequests() {

    const profile =
        await getCurrentProfile();


    if (
        !profile ||
        !profile.is_tutor
    ) {

        content.innerHTML = `
            <h1 class="title">
                ACCESS DENIED
            </h1>
        `;

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            TUTORING REQUESTS
        </h1>


        <div class="account-container">

            <button
                onclick="showTutorDashboard()"
            >
                Back to Tutor Dashboard
            </button>


            <div id="tutor-requests">

                <p>
                    Loading tutoring requests...
                </p>

            </div>

        </div>

    `;


    await loadTutorRequests();
}


async function showTutorSessions() {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    const profile =
        await getCurrentProfile();


    if (
        !user ||
        !profile?.is_tutor
    ) {

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            MY SESSIONS
        </h1>


        <div class="account-container">

            <button
                onclick="showTutorDashboard()"
            >
                Back to Tutor Dashboard
            </button>


            <div id="tutor-session-list">

                <p>
                    Loading sessions...
                </p>

            </div>

        </div>

    `;


    const {
        data: sessions,
        error
    } =
        await supabaseClient
            .from("tutoring_sessions")
            .select(`
                id,
                student_id,
                start_time,
                end_time,
                status,
                topics (
                    name
                )
            `)
            .eq(
                "tutor_id",
                user.id
            )
            .eq(
                "status",
                "accepted"
            )
            .order(
                "start_time",
                {
                    ascending: true
                }
            );


    const container =
        document.getElementById(
            "tutor-session-list"
        );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading sessions:
                ${escapeHTML(
                    error.message
                )}
            </p>
        `;

        return;
    }


    if (!sessions?.length) {

        container.innerHTML = `
            <p>
                You do not have any tutoring sessions yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        sessions.map(
            session => `

                <div class="tutoring-request">

                    <h3>
                        ${escapeHTML(
                            session.topics?.name ||
                            "Tutoring"
                        )}
                    </h3>

                    <p>
                        ${new Date(
                            session.start_time
                        ).toLocaleString()}
                    </p>

                    <button
                        onclick="
                            openSessionDetails(
                                '${session.id}'
                            )
                        "
                    >
                        Open Session
                    </button>

                </div>

            `
        ).join("");
}


async function showTutorStudents() {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();


    const profile =
        await getCurrentProfile();


    if (
        !user ||
        !profile?.is_tutor
    ) {

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            MY STUDENTS
        </h1>


        <div class="account-container">

            <button
                onclick="showTutorDashboard()"
            >
                Back to Tutor Dashboard
            </button>


            <div id="tutor-students">

                <p>
                    Loading students...
                </p>

            </div>

        </div>

    `;


    const {
        data: sessions,
        error
    } =
        await supabaseClient
            .from("tutoring_sessions")
            .select(`
                id,
                student_id,
                start_time,
                topics (
                    name
                )
            `)
            .eq(
                "tutor_id",
                user.id
            )
            .eq(
                "status",
                "accepted"
            );


    const container =
        document.getElementById(
            "tutor-students"
        );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading students:
                ${escapeHTML(
                    error.message
                )}
            </p>
        `;

        return;
    }


    const uniqueStudents =
        [
            ...new Map(
                (sessions || []).map(
                    session => [
                        session.student_id,
                        session
                    ]
                )
            ).values()
        ];


    if (!uniqueStudents.length) {

        container.innerHTML = `
            <p>
                You do not have any students yet.
            </p>
        `;

        return;
    }


    const studentIds =
        uniqueStudents.map(
            session =>
                session.student_id
        );


    const {
        data: profiles
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username"
            )
            .in(
                "id",
                studentIds
            );


    container.innerHTML =
        uniqueStudents.map(
            session => {

                const student =
                    profiles?.find(
                        profile =>
                            profile.id ===
                            session.student_id
                    );


                return `

                    <div class="tutoring-request">

                        <h3>
                            ${escapeHTML(
                                student?.username ||
                                "Student"
                            )}
                        </h3>

                        <p>
                            Subject:
                            ${escapeHTML(
                                session.topics?.name ||
                                "Tutoring"
                            )}
                        </p>

                        <button
                            onclick="
                                openSessionDetails(
                                    '${session.id}'
                                )
                            "
                        >
                            Open Session
                        </button>

                    </div>

                `;
            }
        ).join("");
}


/* =========================================================
   TUTORING REQUESTS
   ========================================================= */

async function loadTutorRequests() {

    const container =
        document.getElementById("tutor-requests");


    const {
        data: requests,
        error
    } = await supabaseClient
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
            request =>
                request.status === "open"
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


    /*
     * Get the requested locations for these requests.
     */
    const requestIds =
        openRequests.map(
            request => Number(request.id)
        );


    const {
        data: locations,
        error: locationError
    } = await supabaseClient
        .from("tutoring_request_locations")
        .select(`
            request_id,
            location
        `)
        .in(
            "request_id",
            requestIds
        );


    if (locationError) {

        console.error(
            "Location loading error:",
            locationError
        );
    }


    const locationMap =
        new Map(
            (locations || []).map(
                row => [
                    Number(row.request_id),
                    row.location
                ]
            )
        );


    container.innerHTML =
        openRequests
            .map(request => {

                const location =
                    locationMap.get(
                        Number(request.id)
                    ) ||
                    "No location provided";


                return `

                    <div class="tutoring-request">

                        <h2>
                            ${escapeHTML(
                                request.topic_name
                            )}
                        </h2>


                        <p>
                            <strong>Student:</strong>
                            ${escapeHTML(
                                request.student_username
                            )}
                        </p>


                        <p>
                            <strong>Request:</strong>
                        </p>

                        <p>
                            ${escapeHTML(
                                request.description
                            )}
                        </p>


                        <p>
                            <strong>Preferred Location:</strong>
                            ${escapeHTML(location)}
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
                            ${escapeHTML(
                                request.status
                            )}
                        </p>


                        <button
                            onclick="acceptTutoringRequest('${request.id}')"
                        >
                            Accept
                        </button>

                    </div>

                `;

            })
            .join("");
}


async function acceptTutoringRequest(requestId) {

    const confirmed =
        confirm(
            "Accept this tutoring session?"
        );


    if (!confirmed) {
        return;
    }


    /*
     * Accept the request using your existing RPC.
     */
    const {
        error
    } = await supabaseClient
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


    /*
     * Copy the requested location from the request
     * onto the newly-created tutoring session.
     */
    const {
        error: locationError
    } = await supabaseClient
        .rpc(
            "copy_tutoring_request_location",
            {
                p_request_id: Number(requestId)
            }
        );


    if (locationError) {

        console.error(
            "Location could not be attached to session:",
            locationError
        );

        alert(
            "The tutoring session was accepted, but its location could not be attached. Please check the request."
        );

        await loadTutorRequests();

        return;
    }


    alert(
        "Tutoring session accepted! It has been added to your calendar with the requested location."
    );


    await loadTutorRequests();
}


async function declineTutoringRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Decline this tutoring request?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id:
                        Number(requestId),
                    new_status:
                        "declined"
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


async function closeTutoringRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Close this tutoring request?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id:
                        Number(requestId),
                    new_status:
                        "closed"
                }
            );


    if (error) {

        alert(
            "Error closing request: " +
            error.message
        );

        return;
    }


    await loadTutorRequests();
}


async function reopenTutoringRequest(
    requestId
) {

    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id:
                        Number(requestId),
                    new_status:
                        "open"
                }
            );


    if (error) {

        alert(
            "Error reopening request: " +
            error.message
        );

        return;
    }


    await loadTutorRequests();
}


async function dropTutoringSession(
    sessionId
) {

    const confirmed =
        confirm(
            "Are you sure you want to drop this tutoring session? The tutoring request will be reopened for another tutor."
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "drop_tutoring_session",
                {
                    session_id:
                        Number(sessionId)
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


    await loadTutorRequests();
}


/* =========================================================
   TUTORING REQUEST PAGE
   ========================================================= */

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
                Select the subject you need help with,
                explain what you need help on, and
                provide your preferred tutoring location.
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


            <label for="tutoring-location">
                Preferred Location
            </label>

            <input
                type="text"
                id="tutoring-location"
                placeholder="Example: School library, Room 204, Online..."
                maxlength="200"
            >


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

    const location =
        document
            .getElementById("tutoring-location")
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


    const selectedDate =
        new Date(`${date}T00:00:00`);

    const today =
        new Date();

    today.setHours(0, 0, 0, 0);


    const maxDate =
        new Date(today);

    maxDate.setMonth(
        maxDate.getMonth() + 2
    );

    maxDate.setHours(
        0,
        0,
        0,
        0
    );


    if (
        !date ||
        selectedDate < today ||
        selectedDate > maxDate
    ) {

        message.textContent =
            "Tutoring requests can only be made for today through two months from today.";

        return;
    }


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


    if (!location) {

        message.textContent =
            "Please enter a preferred tutoring location.";

        return;
    }


    if (
        !startTime ||
        !endTime
    ) {

        message.textContent =
            "Please select a date and time.";

        return;
    }


    const proposedStart =
        `${date}T${startTime}:00+04:00`;

    const proposedEnd =
        `${date}T${endTime}:00+04:00`;


    if (
        new Date(proposedEnd) <=
        new Date(proposedStart)
    ) {

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


    /*
     * First create the tutoring request using
     * your existing RPC.
     */
    const {
        data: requestId,
        error: requestError
    } = await supabaseClient
        .rpc(
            "create_tutoring_request",
            {
                p_topic_id: Number(topicId),
                p_description: description,
                p_date: date,
                p_start_time: startTime,
                p_end_time: endTime
            }
        );


    if (requestError) {

        message.textContent =
            "Error: " +
            requestError.message;

        return;
    }


    /*
     * Save the requested location separately.
     */
    const {
        error: locationError
    } = await supabaseClient
        .from("tutoring_request_locations")
        .insert({
            request_id: Number(requestId),
            location: location
        });


    if (locationError) {

        /*
         * The tutoring request exists, but its location
         * could not be saved.
         */
        message.textContent =
            "The tutoring request was created, but the location could not be saved: " +
            locationError.message;

        return;
    }


    message.textContent =
        "Your tutoring request has been submitted!";


    setTimeout(() => {

        showTutoringPage();

    }, 1500);
}


/* =========================================================
   ADMIN
   ========================================================= */

async function showAdminPage() {

    const profile =
        await getCurrentProfile();


    if (
        !profile ||
        !profile.is_admin
    ) {

        content.innerHTML = `

            <h1 class="title">
                ACCESS DENIED
            </h1>

            <p>
                You do not have permission
                to access the Admin Panel.
            </p>

        `;

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            ADMIN PANEL
        </h1>


        <div class="admin-container">

            <h2>
                Pending Posts
            </h2>

            <div id="pending-posts">
                <p>
                    Loading pending posts...
                </p>
            </div>


            <hr>


            <h2>
                Tutor Applications
            </h2>

            <div id="tutor-applications">
                <p>
                    Loading tutor applications...
                </p>
            </div>


            <hr>


            <h2>
                Tutoring Requests
            </h2>

            <div id="admin-tutoring-requests">
                <p>
                    Loading tutoring requests...
                </p>
            </div>

        </div>

    `;


    await loadPendingPosts();
    await loadTutorApplications();
    await loadAdminTutoringRequests();
}


async function loadAdminTutoringRequests() {

    const container =
        document.getElementById(
            "admin-tutoring-requests"
        );


    const {
        data: requests,
        error
    } =
        await supabaseClient
            .rpc(
                "get_tutoring_requests"
            );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading tutoring requests:
                ${escapeHTML(
                    error.message
                )}
            </p>
        `;

        return;
    }


    const openRequests =
        (requests || []).filter(
            request =>
                request.status === "open"
        );


    if (
        openRequests.length === 0
    ) {

        container.innerHTML = `
            <p>
                There are currently no tutoring requests.
            </p>
        `;

        return;
    }


    container.innerHTML =
        openRequests.map(
            request => `

                <div class="tutoring-request">

                    <h3>
                        ${escapeHTML(
                            request.topic_name
                        )}
                    </h3>

                    <p>
                        <strong>
                            Student:
                        </strong>

                        ${escapeHTML(
                            request.student_username
                        )}
                    </p>

                    <p>
                        <strong>
                            Description:
                        </strong>
                    </p>

                    <p>
                        ${escapeHTML(
                            request.description
                        )}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${escapeHTML(
                            request.status
                        )}
                    </p>

                    <p>
                        <strong>
                            Submitted:
                        </strong>

                        ${new Date(
                            request.created_at
                        ).toLocaleString()}
                    </p>


                    <button
                        onclick="
                            adminCloseTutoringRequest(
                                '${request.id}'
                            )
                        "
                    >
                        Close Request
                    </button>

                </div>

            `
        ).join("");
}


async function adminCloseTutoringRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Close this tutoring request?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id:
                        Number(requestId),
                    new_status:
                        "closed"
                }
            );


    if (error) {

        alert(
            "Error closing request: " +
            error.message
        );

        return;
    }


    await loadAdminTutoringRequests();
}


async function adminReopenTutoringRequest(
    requestId
) {

    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_tutoring_request_status",
                {
                    request_id:
                        Number(requestId),
                    new_status:
                        "open"
                }
            );


    if (error) {

        alert(
            "Error reopening request: " +
            error.message
        );

        return;
    }


    await loadAdminTutoringRequests();
}


/* =========================================================
   TUTOR APPLICATIONS
   ========================================================= */

async function submitTutorApplication() {

    const reason =
        document
            .getElementById(
                "tutor-reason"
            )
            .value
            .trim();


    const message =
        document.getElementById(
            "tutor-message"
        );


    const selectedTopics =
        Array.from(
            document.querySelectorAll(
                'input[name="tutor-topic"]:checked'
            )
        ).map(
            input =>
                Number(input.value)
        );


    if (!reason) {

        message.textContent =
            "Please explain why you would like to become a tutor.";

        return;
    }


    if (
        selectedTopics.length === 0
    ) {

        message.textContent =
            "Please select at least one topic.";

        return;
    }


    if (
        selectedTopics.length > 3
    ) {

        message.textContent =
            "You can select a maximum of 3 topics.";

        return;
    }


    message.textContent =
        "Submitting application...";


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (
        userError ||
        !user
    ) {

        message.textContent =
            "You must be logged in to apply.";

        return;
    }


    const {
        data: application,
        error: applicationError
    } =
        await supabaseClient
            .from(
                "tutor_applications"
            )
            .insert({
                user_id:
                    user.id,
                reason:
                    reason,
                status:
                    "pending"
            })
            .select(
                "id"
            )
            .single();


    if (applicationError) {

        message.textContent =
            "Error: " +
            applicationError.message;

        return;
    }


    const topicRows =
        selectedTopics.map(
            topicId => ({
                application_id:
                    application.id,
                topic_id:
                    topicId
            })
        );


    const {
        error: topicError
    } =
        await supabaseClient
            .from(
                "tutor_application_topics"
            )
            .insert(
                topicRows
            );


    if (topicError) {

        await supabaseClient
            .from(
                "tutor_applications"
            )
            .delete()
            .eq(
                "id",
                application.id
            );


        message.textContent =
            "Error saving topics: " +
            topicError.message;

        return;
    }


    message.textContent =
        "Your tutor application has been submitted!";
}


async function loadTutorApplications() {

    const container =
        document.getElementById(
            "tutor-applications"
        );


    const {
        data: applications,
        error
    } =
        await supabaseClient
            .from(
                "tutor_applications"
            )
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
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading tutor applications:
                ${escapeHTML(
                    error.message
                )}
            </p>
        `;

        return;
    }


    if (
        !applications ||
        applications.length === 0
    ) {

        container.innerHTML = `
            <p>
                No tutor applications are
                currently waiting for review.
            </p>
        `;

        return;
    }


    container.innerHTML =
        applications.map(
            application => `

                <div class="tutor-application">

                    <h3>
                        ${escapeHTML(
                            application.profiles?.username ||
                            "Unknown User"
                        )}
                    </h3>

                    <p>
                        <strong>
                            Application:
                        </strong>
                    </p>

                    <p>
                        ${escapeHTML(
                            application.reason
                        )}
                    </p>

                    <p>
                        <strong>
                            Submitted:
                        </strong>

                        ${new Date(
                            application.created_at
                        ).toLocaleString()}
                    </p>

                    <button
                        onclick="
                            approveTutorApplication(
                                '${application.id}'
                            )
                        "
                    >
                        Approve
                    </button>

                    <button
                        onclick="
                            rejectTutorApplication(
                                '${application.id}'
                            )
                        "
                    >
                        Reject
                    </button>

                </div>

            `
        ).join("");
}


async function approveTutorApplication(
    applicationId
) {

    const confirmed =
        confirm(
            "Approve this user as a tutor?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "approve_tutor_application",
                {
                    application_id:
                        applicationId
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


async function rejectTutorApplication(
    applicationId
) {

    const confirmed =
        confirm(
            "Reject and permanently delete this tutor application?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "reject_tutor_application",
                {
                    application_id:
                        applicationId
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
    } =
        await supabaseClient
            .from("topics")
            .select(
                "id, name"
            )
            .eq(
                "active",
                true
            )
            .order(
                "name"
            );


    if (error) {

        content.innerHTML = `

            <h1 class="title">
                TUTOR APPLICATION
            </h1>

            <div class="account-container">

                <p>
                    Error loading topics:
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

        return;
    }


    content.innerHTML = `

        <h1 class="title">
            TUTOR APPLICATION
        </h1>


        <div class="account-container">

            <h2>
                Apply to Become a Tutor
            </h2>


            <p>
                Select up to three subjects
                that you would like to tutor.
            </p>


            <div id="tutor-topics">

                ${
                    topics.map(
                        topic => `

                            <label>

                                <input
                                    type="checkbox"
                                    name="tutor-topic"
                                    value="${topic.id}"
                                    onchange="updateTopicCount()"
                                >

                                ${escapeHTML(
                                    topic.name
                                )}

                            </label>

                        `
                    ).join("")
                }

            </div>


            <p id="topic-count">
                0 / 3 topics selected
            </p>


            <label
                for="tutor-reason"
            >
                Why would you like to become a tutor?
            </label>


            <textarea
                id="tutor-reason"
                placeholder="Tell us about yourself and why you would be able to help other students..."
            ></textarea>


            <button
                onclick="submitTutorApplication()"
            >
                Submit Application
            </button>


            <button
                onclick="showAccountPage()"
            >
                Cancel
            </button>


            <p id="tutor-message"></p>

        </div>

    `;
}


function updateTopicCount() {

    const selected =
        document.querySelectorAll(
            'input[name="tutor-topic"]:checked'
        );


    const count =
        document.getElementById(
            "topic-count"
        );


    if (count) {

        count.textContent =
            `${selected.length} / 3 topics selected`;
    }


    document
        .querySelectorAll(
            'input[name="tutor-topic"]:not(:checked)'
        )
        .forEach(
            input => {

                input.disabled =
                    selected.length >= 3;
            }
        );
}


/* =========================================================
   ADMIN POSTS
   ========================================================= */

async function loadPendingPosts() {

    const container =
        document.getElementById(
            "pending-posts"
        );


    const {
        data: posts,
        error
    } =
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
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        container.innerHTML = `
            <p>
                Error loading posts:
                ${escapeHTML(
                    error.message
                )}
            </p>
        `;

        return;
    }


    if (
        !posts ||
        posts.length === 0
    ) {

        container.innerHTML = `
            <p>
                No posts are currently
                waiting for review.
            </p>
        `;

        return;
    }


    container.innerHTML =
        posts.map(
            post => `

                <div class="pending-post">

                    <h2>
                        Post Review
                    </h2>

                    <p>
                        <strong>
                            Submitted by:
                        </strong>

                        ${escapeHTML(
                            post.profiles?.username ||
                            "Unknown"
                        )}
                    </p>


                    <label>
                        Title
                    </label>

                    <input
                        type="text"
                        id="edit-title-${post.id}"
                        value="${escapeAttribute(
                            post.title
                        )}"
                    >


                    <label>
                        Category
                    </label>

                    <select
                        id="edit-category-${post.id}"
                    >

                        ${[
                            "Book",
                            "Website",
                            "Article",
                            "Video",
                            "Study Resource",
                            "Tool",
                            "Recommendation",
                            "Other"
                        ].map(
                            category => `
                                <option
                                    value="${category}"
                                    ${
                                        post.category ===
                                        category
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${category}
                                </option>
                            `
                        ).join("")}

                    </select>


                    <label>
                        Description
                    </label>

                    <textarea
                        id="edit-description-${post.id}"
                    >${escapeHTML(
                        post.description
                    )}</textarea>


                    <label>
                        Link
                    </label>

                    <input
                        type="url"
                        id="edit-link-${post.id}"
                        value="${escapeAttribute(
                            post.link || ""
                        )}"
                    >


                    <p>
                        <strong>
                            Submitted:
                        </strong>

                        ${new Date(
                            post.created_at
                        ).toLocaleString()}
                    </p>


                    <button
                        onclick="
                            editPost(
                                '${post.id}'
                            )
                        "
                    >
                        Save Changes
                    </button>


                    <button
                        onclick="
                            approvePost(
                                '${post.id}'
                            )
                        "
                    >
                        Approve
                    </button>


                    <button
                        onclick="
                            rejectPost(
                                '${post.id}'
                            )
                        "
                    >
                        Reject & Delete
                    </button>

                </div>

            `
        ).join("");
}


async function editPost(
    postId
) {

    const title =
        document
            .getElementById(
                `edit-title-${postId}`
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                `edit-category-${postId}`
            )
            .value;


    const description =
        document
            .getElementById(
                `edit-description-${postId}`
            )
            .value
            .trim();


    const link =
        document
            .getElementById(
                `edit-link-${postId}`
            )
            .value
            .trim();


    if (
        !title ||
        !description
    ) {

        alert(
            "Title and description cannot be empty."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .update({
                title:
                    title,
                category:
                    category,
                description:
                    description,
                link:
                    link || null
            })
            .eq(
                "id",
                postId
            );


    if (error) {

        alert(
            "Error saving changes: " +
            error.message
        );

        return;
    }


    alert(
        "Post updated successfully!"
    );


    await loadPendingPosts();
}


async function approvePost(
    postId
) {

    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .update({
                status:
                    "approved"
            })
            .eq(
                "id",
                postId
            );


    if (error) {

        alert(
            "Error approving post: " +
            error.message
        );

        return;
    }


    await loadPendingPosts();
}


async function rejectPost(
    postId
) {

    const confirmed =
        confirm(
            "Are you sure you want to reject and permanently delete this post?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .delete()
            .eq(
                "id",
                postId
            );


    if (error) {

        alert(
            "Error deleting post: " +
            error.message
        );

        return;
    }


    await loadPendingPosts();
}


/* =========================================================
   ESCAPING
   ========================================================= */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text ?? "";


    return div.innerHTML;
}


function escapeAttribute(
    text
) {

    return String(
        text ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}