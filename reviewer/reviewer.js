const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

let assignment = null;

loadAssignment();

async function loadAssignment() {

```
const app = document.getElementById("app");

if (!token) {
    app.innerHTML =
        "<p class='error'>Invalid reviewer link.</p>";
    return;
}

try {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {

        app.innerHTML =
            "<p class='error'>Review assignment not found.</p>";

        return;
    }

    assignment = data[0];

    renderState();

} catch (error) {

    console.error(error);

    app.innerHTML =
        "<p class='error'>Unable to load assignment.</p>";
}
```

}

function renderState() {

```
const app = document.getElementById("app");

if (assignment.review_submitted) {

    app.innerHTML = `
    <h2 class="success">
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

    const pdfButtons =
        assignment.manuscript_pdf_url
            ?
            `
            <div style="margin-top:20px;margin-bottom:20px;">

                <a href="${assignment.manuscript_pdf_url}"
                   target="_blank"
                   class="pdf-btn">
                   📄 View Manuscript
                </a>

                <a href="${assignment.manuscript_pdf_url}"
                   download
                   class="pdf-btn">
                   ⬇ Download PDF
                </a>

            </div>
            `
            : "";

    app.innerHTML = `

    <h2>${assignment.manuscript_title}</h2>

    <div class="manuscript-info">

        <p>
        <strong>Article ID:</strong>
        ${assignment.article_id}
        </p>

        <p>
        <strong>Due Date:</strong>
        ${assignment.due_date || "-"}
        </p>

        <p>
        <strong>Abstract:</strong>
        </p>

        <p>
        ${assignment.abstract || "Not available"}
        </p>

        ${pdfButtons}

    </div>

    <button onclick="acceptInvitation()">
    Accept Invitation
    </button>

    <button
        onclick="declineInvitation()"
        style="background:#999;margin-left:10px;">
    Decline
    </button>

    `;

    return;
}

if (
    assignment.invitation_status === "Accepted" ||
    assignment.invitation_status === "Submitted"
) {

    renderReviewForm();
}
```

}

async function acceptInvitation() {

```
try {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                invitation_status: "Accepted"
            })
        }
    );

    assignment.invitation_status = "Accepted";

    renderReviewForm();

} catch (error) {

    console.error(error);

    alert("Unable to accept invitation.");
}
```

}

async function declineInvitation() {

```
try {

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                invitation_status: "Declined"
            })
        }
    );

    assignment.invitation_status = "Declined";

    renderState();

} catch (error) {

    console.error(error);

    alert("Unable to decline invitation.");
}
```

}

function renderReviewForm() {

```
const app = document.getElementById("app");

const pdfButtons =
    assignment.manuscript_pdf_url
        ?
        `
        <div style="margin-bottom:20px;">

            <a href="${assignment.manuscript_pdf_url}"
               target="_blank"
               class="pdf-btn">
               📄 View Manuscript
            </a>

            <a href="${assignment.manuscript_pdf_url}"
               download
               class="pdf-btn">
               ⬇ Download PDF
            </a>

        </div>
        `
        : "";

app.innerHTML = `

<h2>${assignment.manuscript_title}</h2>

<div class="manuscript-info">

    <p>
    <strong>Article ID:</strong>
    ${assignment.article_id}
    </p>

    ${pdfButtons}

</div>

<div class="review-section">

    <label>Recommendation</label>

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

    <label>Comments to Author</label>

    <textarea
        id="commentsAuthor"></textarea>

    <label>
    Confidential Comments to Editor
    </label>

    <textarea
        id="commentsEditor"></textarea>

    <label>
    Overall Score (1-10)
    </label>

    <input
        type="number"
        id="score"
        min="1"
        max="10">

    <button onclick="submitReview()">
    Submit Review
    </button>

</div>

`;
```

}

async function submitReview() {

```
const recommendation =
    document.getElementById("recommendation").value;

const commentsAuthor =
    document.getElementById("commentsAuthor").value;

const commentsEditor =
    document.getElementById("commentsEditor").value;

const score =
    document.getElementById("score").value;

try {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/reviews`,
        {
            method: "POST",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
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
                    commentsEditor,

                score:
                    score

            })
        }
    );

    if (!response.ok) {

        throw new Error(
            "Review submission failed."
        );
    }

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,
        {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                review_submitted: true,
                invitation_status: "Submitted",
                status: "Submitted"
            })
        }
    );

    document.getElementById("app").innerHTML = `

    <h2 class="success">
    Review Submitted Successfully
    </h2>

    <p>
    Thank you for your valuable review.
    </p>

    `;

} catch (error) {

    console.error(error);

    alert(
        "Failed to submit review."
    );
}
```

}
