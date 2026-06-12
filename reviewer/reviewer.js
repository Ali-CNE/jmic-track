const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

let assignment = null;

window.onload = loadAssignment;

async function loadAssignment() {

    const app = document.getElementById("app");

    if (!token) {
        app.innerHTML = "Invalid or missing token.";
        return;
    }

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            app.innerHTML = "No assignment found.";
            return;
        }

        assignment = data[0];

        renderPage();

    } catch (err) {
        console.error(err);
        app.innerHTML = "Error loading assignment.";
    }
}

function renderPage() {

    const app = document.getElementById("app");

    let pdfButtons = "";

    if (assignment.manuscript_pdf_url) {
        pdfButtons = `
            <div style="margin:10px 0;">
                <a href="${assignment.manuscript_pdf_url}" target="_blank">
                    View Manuscript
                </a>
                <br>
                <a href="${assignment.manuscript_pdf_url}" download>
                    Download PDF
                </a>
            </div>
        `;
    }

    if (assignment.review_submitted) {
        app.innerHTML = "<h2>Review already submitted.</h2>";
        return;
    }

    if (assignment.invitation_status === "Declined") {
        app.innerHTML = "<h2>Invitation declined.</h2>";
        return;
    }

    if (assignment.invitation_status === "Pending") {

        app.innerHTML = `
            <h2>${assignment.manuscript_title}</h2>

            <p><b>Article ID:</b> ${assignment.article_id}</p>

            <p>${assignment.abstract || ""}</p>

            ${pdfButtons}

            <button onclick="acceptInvitation()">Accept</button>
            <button onclick="declineInvitation()">Decline</button>
        `;

        return;
    }

    renderReviewForm();
}

async function acceptInvitation() {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
		"Prefer": "return=representation"
            },
		const result = await response.json();
		console.log(result);
            body: JSON.stringify({
                invitation_status: "Accepted"
            })
        }
    );

    assignment.invitation_status = "Accepted";
    renderReviewForm();
}

async function declineInvitation() {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
		"Prefer": "return=representation"
            },
		const result = await response.json();
		console.log(result);
            body: JSON.stringify({
                invitation_status: "Declined"
            })
        }
    );

    assignment.invitation_status = "Declined";
    renderPage();
}

function renderReviewForm() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <h2>${assignment.manuscript_title}</h2>

        <p><b>Article ID:</b> ${assignment.article_id}</p>

        ${assignment.manuscript_pdf_url ? `
            <a href="${assignment.manuscript_pdf_url}" target="_blank">View Manuscript</a>
            <br>
        ` : ""}

        <select id="rec">
            <option>Accept</option>
            <option>Minor Revision</option>
            <option>Major Revision</option>
            <option>Reject</option>
        </select>

        <br><br>

        <textarea id="comments" placeholder="Comments to author"></textarea>

        <br><br>

	<label>Confidential Comments to Editor</label>

<textarea
    id="editor"
    rows="6"></textarea>

<label>Overall Score (1-10)</label>

<input
    type="number"
    id="score"
    min="1"
    max="10">

        <button onclick="submitReview()">Submit Review</button>
    `;
}

async function submitReview() {

    const rec = document.getElementById("rec").value;
    const author =
document.getElementById("author").value;

const editor =
document.getElementById("editor").value;

const score =
document.getElementById("score").value;

body: JSON.stringify({
    article_id: assignment.article_id,
    reviewer_email: assignment.reviewer_email,
    recommendation: rec,
    comments_to_author: author,
    confidential_comments: editor,
    score: score
})

    await fetch(
        `${SUPABASE_URL}/rest/v1/reviews`,
        {
            method: "POST",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                article_id: assignment.article_id,
                reviewer_email: assignment.reviewer_email,
                recommendation: rec,
                comments_to_author: comments
            })
        }
    );

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
		"Prefer": "return=representation"
            },
            body: JSON.stringify({
                review_submitted: true,
                invitation_status: "Submitted"
            })
        }
    );

    document.getElementById("app").innerHTML =
        "<h2>Review submitted successfully.</h2>";
}   
