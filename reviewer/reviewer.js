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
            `${SUPABASE_URL}/rest/v1/review_assignments?secure_token=eq.${encodeURIComponent(token)}`,
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

        renderPage();

    }
    catch(error) {

        console.error(error);

        app.innerHTML =
        "<h2>Error loading assignment.</h2>";
    }
}

function renderPage() {

    const app =
    document.getElementById("app");

    if (assignment.review_submitted) {

        app.innerHTML = `
        <h2>
        Review Already Submitted
        </h2>

        <p>
        Thank you for completing your review.
        </p>
        `;

        return;
    }

    if (assignment.invitation_status === "Declined") {

        app.innerHTML = `
        <h2>
        Invitation Declined
        </h2>

        <p>
        Thank you for your response.
        </p>
        `;

        return;
    }

    if (assignment.invitation_status === "Pending") {

        app.innerHTML = `

        <h2>
        ${assignment.manuscript_title}
        </h2>

        <p>
        <strong>Article ID:</strong>
        ${assignment.article_id}
        </p>

        <p>
        <strong>Abstract:</strong>
        ${assignment.abstract || ""}
        </p>

        ${assignment.pdf_path ? `

<p>
<a href="${SUPABASE_URL}/storage/v1/object/public/manuscripts/${assignment.pdf_path}"
   target="_blank">
   📄 View Manuscript
</a>
</p>

<p>
<a href="${SUPABASE_URL}/storage/v1/object/public/manuscripts/${assignment.pdf_path}"
   download>
   ⬇ Download PDF
</a>
</p>

` : ""}

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

async function acceptInvitation() {

    try {

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?secure_token=eq.${encodeURIComponent(token)}`,
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

        renderReviewForm();

    }
    catch(error) {

        console.error(error);

        alert(
        "Unable to accept invitation."
        );
    }
}

async function declineInvitation() {

    try {

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?secure_token=eq.${encodeURIComponent(token)}`,
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

        alert(
        "Unable to decline invitation."
        );
    }
}

function renderReviewForm() {

    const app =
    document.getElementById("app");

    app.innerHTML = `

    <h2>
    ${assignment.manuscript_title}
    </h2>

    <p>
    <strong>Article ID:</strong>
    ${assignment.article_id}
    </p>

    ${assignment.pdf_path ? `

<p>
<a href="${SUPABASE_URL}/storage/v1/object/public/manuscripts/${assignment.pdf_path}"
   target="_blank">
   📄 View Manuscript
</a>
</p>

<p>
<a href="${SUPABASE_URL}/storage/v1/object/public/manuscripts/${assignment.pdf_path}"
   download>
   ⬇ Download PDF
</a>
</p>

` : ""}

    <label>
    Recommendation
    </label>

    <br>

    <select id="recommendation">

        <option value="Accept">
        Accept
        </option>

        <option value="Minor Revision">
        Minor Revision
        </option>

        <option value="Major Revision">
        Major Revision
        </option>

        <option value="Reject">
        Reject
        </option>

    </select>

    <br><br>

    <label>
    Comments to Author
    </label>

    <br>

    <textarea
        id="comments_author"
        rows="8"
        style="width:100%;"></textarea>

    <br><br>

    <label>
    Confidential Comments to Editor
    </label>

    <br>

    <textarea
        id="confidential_comments"
        rows="6"
        style="width:100%;"></textarea>

    <br><br>

    <label>
    Overall Score (1-10)
    </label>

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

async function submitReview() {

    const recommendation =
    document.getElementById(
    "recommendation").value;

    const commentsAuthor =
    document.getElementById(
    "comments_author").value;

    const confidentialComments =
    document.getElementById(
    "confidential_comments").value;

    const score =
    document.getElementById(
    "score").value;

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

            alert(
            "Failed to submit review."
            );

            return;
        }

        await fetch(
            `${SUPABASE_URL}/rest/v1/review_assignments?secure_token=eq.${encodeURIComponent(token)}`,
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

        <h2>
        Review Submitted Successfully
        </h2>

        <p>
        Thank you for your review.
        </p>

        `;

    }
    catch(error) {

        console.error(error);

        alert(
        "Error while submitting review."
        );
    }
}
