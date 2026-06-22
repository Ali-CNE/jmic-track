const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params =
new URLSearchParams(window.location.search);

const articleId =
params.get("id");

let manuscript = null;

window.onload = loadPage;

async function loadPage() {

    await loadManuscript();

    await loadReviewers();

    await loadReviews();
}

const storedEditor =
sessionStorage.getItem("editor");

if(storedEditor){

    currentEditor =
    JSON.parse(storedEditor);

}

if(
    currentEditor &&
    currentEditor.role !== "Editor-in-Chief"
){

    document.getElementById(
    "assignEditorTitle"
    ).style.display = "none";

    document.getElementById(
    "editorSelect"
    ).style.display = "none";

    document.getElementById(
    "assignEditorButton"
    ).style.display = "none";
}

loadEditors();
loadAssignedEditor();

/* ==========================
   MANUSCRIPT
========================== */

async function loadManuscript() {

    const response =
    await fetch(
        `${SUPABASE_URL}/rest/v1/manuscripts?article_id=eq.${encodeURIComponent(articleId)}`,
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

    if (!data.length) {

        document.getElementById(
            "manuscriptInfo"
        ).innerHTML =
        "Manuscript not found.";

        return;
    }

    manuscript = data[0];

    let pdfButton = "";

    if (manuscript.pdf_path) {

        const pdfURL =
        `${SUPABASE_URL}/storage/v1/object/public/manuscripts/${manuscript.pdf_path}`;

        pdfButton = `
            <p>
            <a href="${pdfURL}"
            target="_blank">
            📄 View Manuscript
            </a>
            </p>
        `;
    }

    document.getElementById(
        "manuscriptInfo"
    ).innerHTML = `

        <h2>${manuscript.title}</h2>

        <p>
        <strong>Article ID:</strong>
        ${manuscript.article_id}
        </p>

        <p>
        <strong>Author:</strong>
        ${manuscript.corresponding_author}
        </p>

        <p>
        <strong>Status:</strong>
        ${manuscript.status}
        </p>

        <p>
        <strong>Assigned Editor:</strong>
        ${manuscript.assigned_editor || "-"}
        </p>

        ${pdfButton}

    `;
loadEditors();
loadAssignedEditor();
}

/*==========================
Assign Editor
==========================*/

async function loadEditors() {

    const response =
    await fetch(
    `${SUPABASE_URL}/rest/v1/editors?select=editor_name,editor_email,role`,
    {
        headers:{
            apikey:SUPABASE_KEY,
            Authorization:
            `Bearer ${SUPABASE_KEY}`
        }
    });

    const editors =
    await response.json();

    const select =
    document.getElementById(
    "editorSelect"
    );

    select.innerHTML =
    '<option value="">Select Editor</option>';

    editors.forEach(editor=>{

        select.innerHTML += `
        <option value="${editor.editor_email}">
        ${editor.editor_name}
        (${editor.role})
        </option>
        `;
    });
}


async function assignEditor() {

    const editorEmail =
    document.getElementById(
    "editorSelect"
    ).value;

    if(!editorEmail){

        alert(
        "Select an editor."
        );

        return;
    }

    const response =
    await fetch(
    `${SUPABASE_URL}/rest/v1/editor_assignments`,
    {
        method:"POST",
        headers:{
            apikey:SUPABASE_KEY,
            Authorization:
            `Bearer ${SUPABASE_KEY}`,
            "Content-Type":
            "application/json"
        },
        body:JSON.stringify({

            article_id:
            manuscript.article_id,

            editor_email:
            editorEmail,

            active:true

        })
    });

    if(response.ok){

        alert(
        "Editor assigned successfully."
        );

        loadAssignedEditor();
    }
}


async function loadAssignedEditor() {

    const response =
    await fetch(
    `${SUPABASE_URL}/rest/v1/editor_assignments?article_id=eq.${manuscript.article_id}&active=eq.true`,
    {
        headers:{
            apikey:SUPABASE_KEY,
            Authorization:
            `Bearer ${SUPABASE_KEY}`
        }
    });

    const data =
    await response.json();

    if(data.length>0){

        document
        .getElementById(
        "currentEditor"
        )
        .innerHTML =
        `<strong>Current Editor:</strong>
        ${data[0].editor_email}`;
    }
}



/* ==========================
   REVIEWERS
========================== */

async function loadReviewers() {

    const response =
    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments?article_id=eq.${encodeURIComponent(articleId)}`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const reviewers =
    await response.json();

    const tbody =
    document.querySelector(
        "#reviewerTable tbody"
    );

    tbody.innerHTML = "";

    reviewers.forEach(r => {

        const reviewLink =
        `${window.location.origin}/reviewer/?token=${r.review_token}`;

        const row =
        document.createElement("tr");

        row.innerHTML = `

        <td>${r.reviewer_email}</td>

        <td>${r.invitation_status}</td>

        <td>
        ${r.review_submitted ? "Yes" : "No"}
        </td>

        <td>
        ${r.review_deadline || "-"}
        </td>

        <td>
        <input
        type="text"
        value="${reviewLink}"
        readonly
        style="width:100%;">

<button
onclick="copyReviewerLink('${r.review_token}')">
Copy
</button>

        </td>

<td>

<button
onclick="generateReviewerEmail('${r.review_token}')">
Generate Email
</button>

</td>

        `;

        tbody.appendChild(row);
    });

}

/* ==========================
   ASSIGN REVIEWER
========================== */

async function assignReviewer() {

    const email =
    document.getElementById(
        "reviewerEmail"
    ).value.trim();

    const deadline =
    document.getElementById(
        "reviewDeadline"
    ).value;

    if (!email) {

        alert(
            "Reviewer email required."
        );

        return;
    }

    const token =
    Math.random()
    .toString(36)
    .substring(2,10);

    await fetch(
        `${SUPABASE_URL}/rest/v1/review_assignments`,
        {
            method:"POST",

            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`,
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                article_id:
                manuscript.article_id,

                manuscript_title:
                manuscript.title,

		abstract:
		manuscript.abstract,

                reviewer_email:
                email,

                review_token:
                token,

                invitation_status:
                "Pending",

                review_submitted:
                false,

                review_deadline:
                deadline,

                pdf_path:
                manuscript.pdf_path

            })
        }
    );

    alert(
        "Reviewer assigned."
    );

    loadReviewers();
}

/* ==========================
   REVIEWS
========================== */

async function loadReviews() {

    const response =
    await fetch(
        `${SUPABASE_URL}/rest/v1/reviews?article_id=eq.${encodeURIComponent(articleId)}`,
        {
            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const reviews =
    await response.json();

    const container =
    document.getElementById(
        "reviewsContainer"
    );

    if (!reviews.length) {

        container.innerHTML =
        "No reviews submitted.";

        return;
    }

    container.innerHTML = "";

    reviews.forEach(review => {

        container.innerHTML += `

        <div class="card">

        <h3>
        ${review.reviewer_email}
        </h3>

        <p>
        <strong>Recommendation:</strong>
        ${review.recommendation}
        </p>

        <p>
        <strong>Score:</strong>
        ${review.score || "-"}
        </p>

        <p>
        <strong>Comments to Author:</strong>
        <br>
        ${review.comments_to_author || ""}
        </p>

        <p>
        <strong>Confidential Comments:</strong>
        <br>
        ${review.confidential_comments || ""}
        </p>

        </div>

        `;
    });

}

/* ==========================
   DECISION
========================== */

async function updateDecision() {

    const decision =
    document.getElementById(
        "decision"
    ).value;

    const remarks =
    document.getElementById(
        "decisionRemarks"
    ).value;

    await fetch(
        `${SUPABASE_URL}/rest/v1/manuscripts?article_id=eq.${encodeURIComponent(articleId)}`,
        {
            method:"PATCH",

            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`,
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                status:decision,

                last_updated:
                new Date()
                .toISOString()
                .split("T")[0]

            })
        }
    );

    await fetch(
        `${SUPABASE_URL}/rest/v1/editorial_decisions`,
        {
            method:"POST",

            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`,
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                article_id:
                articleId,

                decision:
                decision,

                editor_email:
                JSON.parse(
                sessionStorage
                .getItem("editor")
                ).editor_email,

                remarks:
                remarks

            })
        }
    );

    await fetch(
        `${SUPABASE_URL}/rest/v1/status_history`,
        {
            method:"POST",

            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`,
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                article_id:
                articleId,

                status:
                decision,

                remarks:
                remarks

            })
        }
    );

    alert(
        "Decision updated."
    );

    loadManuscript();
}

function copyReviewerLink(token) {

    const input =
    document.getElementById(
        `link_${token}`
    );

    input.select();

    navigator.clipboard.writeText(
        input.value
    );

    alert(
        "Reviewer link copied."
    );
}

function copyReviewerLink(token) {

    const input =
    document.getElementById(
        `link_${token}`
    );

    navigator.clipboard.writeText(
        input.value
    );

    alert(
        "Reviewer link copied."
    );
}

function generateReviewerEmail(token) {

    const reviewLink =
    `${window.location.origin}/reviewer/?token=${token}`;

    const emailText = `Dear Reviewer,

I hope this message finds you well.
I am pleased to invite you to serve as a peer reviewer for a manuscript submitted to our journal. Given your expertise in the relevant field, we believe your insights would be highly valuable in evaluating this work.
Please find the manuscript details below:

Article ID: ${manuscript.article_id}

Title: ${manuscript.title}

Abstract: ${manuscript.abstract}

We would be grateful if you could kindly confirm your willingness to review this manuscript. If you accept this invitation, you will be provided with secure access to the full manuscript and the review submission form through your personalized reviewer link.
Review Link: ${reviewLink}

Please use the above link to accept or decline the invitation. We sincerely appreciate your time and consideration. Your contribution would play an important role in maintaining the quality and integrity of our peer-review process.

Kind regards,`;

    navigator.clipboard.writeText(
        emailText
    );

    alert(
        "Invitation email copied to clipboard."
    );
}
