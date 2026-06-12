const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params =
new URLSearchParams(window.location.search);

const token =
params.get("token");

let assignment = null;

window.onload = loadAssignment;

async function loadAssignment() {

    const app =
    document.getElementById("app");

    if (!token) {

        app.innerHTML =
        "<h2>Invalid reviewer link.</h2>";

        return;
    }

    try {

        const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const data =
        await response.json();

        if (!Array.isArray(data) ||
            data.length === 0) {

            app.innerHTML =
            "<h2>Review assignment not found.</h2>";

            return;
        }

        assignment = data[0];

        await renderPage();

    }
    catch(error) {

        console.error(error);

        app.innerHTML =
        "<h2>Error loading assignment.</h2>";
    }
}

/* =========================
   SECURE PDF SIGNED URL
========================= */

async function getSignedPdfUrl(filePath) {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/storage/v1/object/sign/manuscripts/${encodeURIComponent(filePath)}`,
            {
                method: "POST",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    expiresIn: 3600
                })
            }
        );

        const data = await response.json();

        return data.signedURL || null;

    } catch (error) {

        console.error("PDF signing error:", error);

        return null;
    }
}

/* =========================
   MAIN RENDER
========================= */

async function renderPage() {

    const app =
    document.getElementById("app");

    if (assignment.review_submitted) {

        app.innerHTML = `
            <h2>Review Already Submitted</h2>
            <p>Thank you for your review.</p>
        `;

        return;
    }

    if (assignment.invitation_status === "Declined") {

        app.innerHTML = `
            <h2>Invitation Declined</h2>
        `;

        return;
    }

    /* ===== PENDING STATE ===== */

    if (assignment.invitation_status === "Pending") {

        let pdfButtons = "";

        if (assignment.pdf_path) {

            const signedUrl =
            await getSignedPdfUrl(
                assignment.pdf_path
            );

            if (signedUrl) {

                pdfButtons = `
                    <p>
                        <a href="${signedUrl}" target="_blank">
                            📄 View Manuscript
                        </a>
                    </p>

                    <p>
                        <a href="${signedUrl}" download>
                            ⬇ Download PDF
                        </a>
                    </p>
                `;
            }
        }

        app.innerHTML = `
            <h2>${assignment.manuscript_title}</h2>

            <p><b>Article ID:</b> ${assignment.article_id}</p>

            <p>${assignment.abstract || ""}</p>

            ${pdfButtons}

            <button onclick="acceptInvitation()">
                Accept Invitation
            </button>

            <button onclick="declineInvitation()">
                Decline Invitation
            </button>
        `;

        return;
    }

    /* ===== REVIEW FORM ===== */

    renderReviewForm();
}

/* =========================
   ACCEPT / DECLINE
========================= */

async function acceptInvitation() {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({
                invitation_status: "Accepted"
            })
        }
    );

    assignment.invitation_status = "Accepted";

    await renderPage();
}

async function declineInvitation() {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({
                invitation_status: "Declined"
            })
        }
    );

    assignment.invitation_status = "Declined";

    await renderPage();
}

/* =========================
   REVIEW FORM
========================= */

function renderReviewForm() {

    const app =
    document.getElementById("app");

    app.innerHTML = `
        <h2>${assignment.manuscript_title}</h2>

        <p><b>Article ID:</b> ${assignment.article_id}</p>

        <label>Recommendation</label>
        <br>

        <select id="rec">
            <option value="Accept">Accept</option>
            <option value="Minor Revision">Minor Revision</option>
            <option value="Major Revision">Major Revision</option>
            <option value="Reject">Reject</option>
        </select>

        <br><br>

        <label>Comments to Author</label>
        <br>

        <textarea id="author"
            rows="8"
            style="width:100%;"></textarea>

        <br><br>

        <label>Confidential Comments to Editor</label>
        <br>

        <textarea id="editor"
            rows="6"
            style="width:100%;"></textarea>

        <br><br>

        <label>Score (1–10)</label>
        <br>

        <input type="number"
            id="score"
            min="1"
            max="10">

        <br><br>

        <button onclick="submitReview()">
            Submit Review
        </button>
    `;
}

/* =========================
   SUBMIT REVIEW
========================= */

async function submitReview() {

    const rec =
    document.getElementById("rec").value;

    const author =
    document.getElementById("author").value;

    const editor =
    document.getElementById("editor").value;

    const score =
    document.getElementById("score").value;

    try {

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
                    comments_to_author: author,
                    confidential_comments: editor,
                    score: score
                })
            }
        );

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
            {
                method: "PATCH",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({
                    review_submitted: true,
                    invitation_status: "Submitted"
                })
            }
        );

        document.getElementById("app").innerHTML =
        "<h2>Review submitted successfully</h2>";

    }
    catch(error) {

        console.error(error);

        alert("Submission failed");
    }
}
