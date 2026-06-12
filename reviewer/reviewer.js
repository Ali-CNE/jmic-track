const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

// ─── Bucket Configuration ────────────────────────────────────────────────────
// Set this to the name of your Supabase Storage bucket that holds manuscripts.
// The `manuscript_pdf_path` column in review_assignments should store only the
// object path inside this bucket (e.g. "2025/JMIC-042/manuscript.pdf").
const MANUSCRIPT_BUCKET = "manuscripts";

// How long (in seconds) a signed URL stays valid after generation.
// 3600 = 1 hour. Increase for longer review sessions if needed.
const SIGNED_URL_EXPIRY = 3600;

// ─── State ───────────────────────────────────────────────────────────────────

const params =
new URLSearchParams(window.location.search);

const token =
params.get("token");

let assignment = null;

// Cache the signed URL so we don't regenerate it on every re-render.
let cachedSignedUrl = null;

// ─── Entry Point ─────────────────────────────────────────────────────────────

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

        // Pre-generate the signed URL once after loading the assignment,
        // so it is ready before any render function needs it.
        await refreshSignedUrl();

        renderPage();

    }
    catch(error) {

        console.error(error);

        app.innerHTML =
        "<h2>Error loading assignment.</h2>";
    }
}

// ─── Signed URL Generation ────────────────────────────────────────────────────

/**
 * Generates a short-lived signed URL for the manuscript PDF stored in Supabase
 * Storage and caches it in `cachedSignedUrl`.
 *
 * The assignment row must have a `manuscript_pdf_path` column containing the
 * object path within MANUSCRIPT_BUCKET (not a full URL). Example value:
 *   "2025/JMIC-042/manuscript.pdf"
 *
 * Returns the signed URL string on success, or null if no path is available
 * or the request fails.
 */
async function refreshSignedUrl() {

    const path = assignment.manuscript_pdf_path;

    if (!path) {

        cachedSignedUrl = null;

        return null;
    }

    try {

        const response =
        await fetch(
            `${SUPABASE_URL}/storage/v1/object/sign/${MANUSCRIPT_BUCKET}/${encodeURIComponent(path)}`,
            {
                method: "POST",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                    "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                    expiresIn: SIGNED_URL_EXPIRY
                })
            }
        );

        if (!response.ok) {

            const err = await response.text();

            console.error(
                "Signed URL generation failed:",
                err
            );

            cachedSignedUrl = null;

            return null;
        }

        const data = await response.json();

        // Supabase returns { signedURL: "/storage/v1/object/sign/..." }
        // Prefix with the project URL to get an absolute link.
        cachedSignedUrl =
            `${SUPABASE_URL}${data.signedURL}`;

        return cachedSignedUrl;

    }
    catch(error) {

        console.error(
            "Error generating signed URL:",
            error
        );

        cachedSignedUrl = null;

        return null;
    }
}

/**
 * Returns HTML for the manuscript PDF links using the cached signed URL.
 * If no signed URL is available, returns an empty string.
 */
function pdfLinksHtml() {

    if (!cachedSignedUrl) return "";

    return `
    <p>
        <a href="${cachedSignedUrl}"
           target="_blank"
           rel="noopener noreferrer">
           📄 View Manuscript
        </a>
    </p>
    <p>
        <a href="${cachedSignedUrl}"
           download>
           ⬇ Download PDF
        </a>
    </p>
    `;
}

// ─── Render Functions ─────────────────────────────────────────────────────────

function renderPage() {

    const app =
    document.getElementById("app");

    if (assignment.review_submitted) {

        app.innerHTML = `
        <h2>Review Already Submitted</h2>
        <p>Thank you for completing your review.</p>
        `;

        return;
    }

    if (assignment.invitation_status === "Declined") {

        app.innerHTML = `
        <h2>Invitation Declined</h2>
        <p>Thank you for your response.</p>
        `;

        return;
    }

    if (assignment.invitation_status === "Pending") {

        app.innerHTML = `
        <h2>${assignment.manuscript_title}</h2>

        <p>
        <strong>Article ID:</strong>
        ${assignment.article_id}
        </p>

        <p>
        <strong>Abstract:</strong>
        ${assignment.abstract || ""}
        </p>

        ${pdfLinksHtml()}

        <button onclick="acceptInvitation()">
        Accept Invitation
        </button>

        <button onclick="declineInvitation()">
        Decline Invitation
        </button>
        `;

        return;
    }

    renderReviewForm();
}

// ─── Invitation Actions ───────────────────────────────────────────────────────

async function acceptInvitation() {

    try {

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
            {
                method: "PATCH",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                    "Content-Type":
                    "application/json",
                    "Prefer":
                    "return=representation"
                },
                body: JSON.stringify({
                    invitation_status:
                    "Accepted"
                })
            }
        );

        assignment.invitation_status =
        "Accepted";

        // Refresh the signed URL before re-rendering the review form
        // in case time has passed since the initial load.
        await refreshSignedUrl();

        renderReviewForm();

    }
    catch(error) {

        console.error(error);

        alert("Unable to accept invitation.");
    }
}

async function declineInvitation() {

    try {

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
            {
                method: "PATCH",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                    "Content-Type":
                    "application/json",
                    "Prefer":
                    "return=representation"
                },
                body: JSON.stringify({
                    invitation_status:
                    "Declined"
                })
            }
        );

        assignment.invitation_status =
        "Declined";

        renderPage();

    }
    catch(error) {

        console.error(error);

        alert("Unable to decline invitation.");
    }
}

// ─── Review Form ──────────────────────────────────────────────────────────────

function renderReviewForm() {

    const app =
    document.getElementById("app");

    app.innerHTML = `

    <h2>${assignment.manuscript_title}</h2>

    <p>
    <strong>Article ID:</strong>
    ${assignment.article_id}
    </p>

    ${pdfLinksHtml()}

    <label>Recommendation</label>
    <br>
    <select id="recommendation">
        <option value="Accept">Accept</option>
        <option value="Minor Revision">Minor Revision</option>
        <option value="Major Revision">Major Revision</option>
        <option value="Reject">Reject</option>
    </select>

    <br><br>

    <label>Comments to Author</label>
    <br>
    <textarea
        id="comments_author"
        rows="8"
        style="width:100%;"></textarea>

    <br><br>

    <label>Confidential Comments to Editor</label>
    <br>
    <textarea
        id="confidential_comments"
        rows="6"
        style="width:100%;"></textarea>

    <br><br>

    <label>Overall Score (1–10)</label>
    <br>
    <input
        type="number"
        id="score"
        min="1"
        max="10">

    <br><br>

    <button onclick="submitReview()">
    Submit Review
    </button>

    `;
}

// ─── Review Submission ────────────────────────────────────────────────────────

async function submitReview() {

    const recommendation =
    document.getElementById("recommendation").value;

    const commentsAuthor =
    document.getElementById("comments_author").value;

    const confidentialComments =
    document.getElementById("confidential_comments").value;

    const score =
    document.getElementById("score").value;

    try {

        const reviewResponse =
        await fetch(
            `${SUPABASE_URL}/rest/v1/reviews`,
            {
                method: "POST",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                    "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                    article_id:
                    assignment.article_id,

                    reviewer_email:
                    assignment.reviewer_email,

                    recommendation:
                    recommendation,

                    comments_to_author:
                    commentsAuthor,

                    confidential_comments:
                    confidentialComments,

                    score:
                    score
                })
            }
        );

        if (!reviewResponse.ok) {

            const error =
            await reviewResponse.text();

            console.error(error);

            alert("Failed to submit review.");

            return;
        }

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
            {
                method: "PATCH",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,
                    "Content-Type":
                    "application/json",
                    "Prefer":
                    "return=representation"
                },
                body: JSON.stringify({
                    review_submitted: true,
                    invitation_status:
                    "Submitted"
                })
            }
        );

        document.getElementById("app")
        .innerHTML = `
        <h2>Review Submitted Successfully</h2>
        <p>Thank you for your review.</p>
        `;

    }
    catch(error) {

        console.error(error);

        alert("Error while submitting review.");
    }
}
