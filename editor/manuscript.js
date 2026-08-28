const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params =
new URLSearchParams(
window.location.search
);

const articleId =
params.get("id");

let manuscript = null;
let currentEditor = null;

/* ==========================
PAGE LOAD
========================== */

window.onload = loadPage;

async function loadPage() {

```
try {

    await loadManuscript();

    if (!manuscript) {
        return;
    }

    await loadReviewerList();

    await loadReviewers();

    await loadReviews();

    await loadEditors();

    await loadAssignedEditor();

    applyEditorPermissions();

}
catch (error) {

    console.error(
        "Page Load Error:",
        error
    );

}
```

}

/* ==========================
CURRENT EDITOR
========================== */

function loadCurrentEditor() {

```
const storedEditor =
sessionStorage.getItem(
    "editor"
);

if (!storedEditor) {

    currentEditor = null;

    return;

}

try {

    currentEditor =
    JSON.parse(
        storedEditor
    );

}
catch (error) {

    console.error(
        "Invalid editor session:",
        error
    );

    currentEditor = null;

}
```

}

/* ==========================
EDITOR PERMISSIONS
========================== */

function applyEditorPermissions() {

```
loadCurrentEditor();

if (!currentEditor) {
    return;
}

if (
    currentEditor.role !==
    "Editor-in-Chief"
) {

    const title =
    document.getElementById(
        "assignEditorTitle"
    );

    const select =
    document.getElementById(
        "editorSelect"
    );

    const button =
    document.getElementById(
        "assignEditorButton"
    );

    if (title) {
        title.style.display =
        "none";
    }

    if (select) {
        select.style.display =
        "none";
    }

    if (button) {
        button.style.display =
        "none";
    }

}
```

}

/* ==========================
MANUSCRIPT
========================== */

async function loadManuscript() {

```
if (!articleId) {

    document.getElementById(
        "manuscriptInfo"
    ).innerHTML =
    "Invalid manuscript ID.";

    return;

}


const response =
await fetch(

    `${SUPABASE_URL}/rest/v1/manuscripts?article_id=eq.${encodeURIComponent(articleId)}`,

    {

        headers: {

            apikey:
            SUPABASE_KEY,

            Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

    }

);


if (!response.ok) {

    throw new Error(
        "Unable to load manuscript."
    );

}


const data =
await response.json();


if (
    !Array.isArray(data) ||
    data.length === 0
) {

    document.getElementById(
        "manuscriptInfo"
    ).innerHTML =
    "Manuscript not found.";

    manuscript = null;

    return;

}


manuscript =
data[0];


let pdfButton = "";


if (manuscript.pdf_path) {

    const pdfURL =
    `${SUPABASE_URL}/storage/v1/object/public/manuscripts/${manuscript.pdf_path}`;


    pdfButton = `

        <p>

        <a
        href="${pdfURL}"
        target="_blank">

        📄 View Manuscript

        </a>

        </p>

    `;

}


document.getElementById(
    "manuscriptInfo"
).innerHTML = `

    <h2>
    ${manuscript.title || ""}
    </h2>

    <p>

    <strong>
    Article ID:
    </strong>

    ${manuscript.article_id || ""}

    </p>

    <p>

    <strong>
    Author:
    </strong>

    ${manuscript.corresponding_author || "-"}

    </p>

    <p>

    <strong>
    Status:
    </strong>

    ${manuscript.status || "-"}

    </p>

    <p>

    <strong>
    Assigned Editor:
    </strong>

    ${manuscript.assigned_editor || "-"}

    </p>

    ${pdfButton}

`;
```

}

/* ==========================
EDITORS
========================== */

async function loadEditors() {

```
const select =
document.getElementById(
    "editorSelect"
);

if (!select) {
    return;
}


const response =
await fetch(

    `${SUPABASE_URL}/rest/v1/editors?select=editor_name,editor_email,role`,

    {

        headers: {

            apikey:
            SUPABASE_KEY,

            Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

    }

);


if (!response.ok) {

    console.error(
        "Unable to load editors."
    );

    return;

}


const editors =
await response.json();


select.innerHTML = `

    <option value="">
    Select Editor
    </option>

`;


editors.forEach(
    editor => {

        const option =
        document.createElement(
            "option"
        );


        option.value =
        editor.editor_email;


        option.textContent =
        `${editor.editor_name} (${editor.role})`;


        select.appendChild(
            option
        );

    }
);
```

}

/* ==========================
ASSIGN EDITOR
========================== */

async function assignEditor() {

```
if (!manuscript) {

    alert(
        "Manuscript not loaded."
    );

    return;

}


const editorEmail =
document.getElementById(
    "editorSelect"
).value;


if (!editorEmail) {

    alert(
        "Select an editor."
    );

    return;

}


try {

    const response =
    await fetch(

        `${SUPABASE_URL}/rest/v1/editor_assignments`,

        {

            method:
            "POST",

            headers: {

                apikey:
                SUPABASE_KEY,

                Authorization:
                `Bearer ${SUPABASE_KEY}`,

                "Content-Type":
                "application/json"

            },

            body:
            JSON.stringify({

                article_id:
                manuscript.article_id,

                editor_email:
                editorEmail,

                active:
                true

            })

        }

    );


    if (!response.ok) {

        const errorText =
        await response.text();

        throw new Error(
            errorText
        );

    }


    alert(
        "Editor assigned successfully."
    );


    await loadAssignedEditor();

}
catch (error) {

    console.error(error);

    alert(
        "Unable to assign editor."
    );

}
```

}

/* ==========================
LOAD ASSIGNED EDITOR
========================== */

async function loadAssignedEditor() {

```
if (!manuscript) {
    return;
}


const container =
document.getElementById(
    "currentEditor"
);

if (!container) {
    return;
}


const response =
await fetch(

    `${SUPABASE_URL}/rest/v1/editor_assignments?article_id=eq.${encodeURIComponent(manuscript.article_id)}&active=eq.true`,

    {

        headers: {

            apikey:
            SUPABASE_KEY,

            Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

    }

);


if (!response.ok) {

    console.error(
        "Unable to load assigned editor."
    );

    return;

}


const data =
await response.json();


if (
    Array.isArray(data) &&
    data.length > 0
) {

    container.innerHTML = `

        <strong>
        Current Editor:
        </strong>

        ${data[0].editor_email}

    `;

}
else {

    container.innerHTML = "";

}
```

}

/* ==========================
REVIEWER LIST
========================== */

async function loadReviewerList() {

```
const select =
document.getElementById(
    "reviewerSelect"
);


if (!select) {
    return;
}


try {

    const response =
    await fetch(

        `${SUPABASE_URL}/rest/v1/reviewers?select=name,email,affiliation,expertise&order=name.asc`,

        {

            headers: {

                apikey:
                SUPABASE_KEY,

                Authorization:
                `Bearer ${SUPABASE_KEY}`

            }

        }

    );


    if (!response.ok) {

        const errorText =
        await response.text();

        throw new Error(
            errorText
        );

    }


    const reviewers =
    await response.json();


    select.innerHTML = `

        <option value="">
        Select Reviewer
        </option>

    `;


    if (
        !Array.isArray(reviewers)
    ) {

        return;

    }


    reviewers.forEach(
        reviewer => {

            const option =
            document.createElement(
                "option"
            );


            option.value =
            reviewer.email;


            option.textContent =
            `${reviewer.name} — ${reviewer.affiliation || "Affiliation not provided"}`;


            option.dataset.name =
            reviewer.name || "";


            option.dataset.email =
            reviewer.email || "";


            option.dataset.affiliation =
            reviewer.affiliation || "";


            option.dataset.expertise =
            reviewer.expertise || "";


            select.appendChild(
                option
            );

        }
    );

}
catch (error) {

    console.error(
        "Reviewer List Error:",
        error
    );

    select.innerHTML = `

        <option value="">
        Unable to load reviewers
        </option>

    `;

}
```

}

/* ==========================
SELECT REVIEWER
========================== */

function selectReviewer() {

```
const select =
document.getElementById(
    "reviewerSelect"
);


const emailInput =
document.getElementById(
    "reviewerEmail"
);


const info =
document.getElementById(
    "reviewerInfo"
);


if (!select) {
    return;
}


const selected =
select.options[
    select.selectedIndex
];


if (
    !select.value ||
    !selected
) {

    if (emailInput) {
        emailInput.value = "";
    }

    if (info) {

        info.style.display =
        "none";

        info.innerHTML = "";

    }

    return;

}


const name =
selected.dataset.name || "-";


const email =
selected.dataset.email || select.value;


const affiliation =
selected.dataset.affiliation || "-";


const expertise =
selected.dataset.expertise || "-";


if (emailInput) {

    emailInput.value =
    email;

}


if (info) {

    info.innerHTML = `

        <strong>
        Reviewer:
        </strong>

        ${name}

        <br>

        <strong>
        Email:
        </strong>

        ${email}

        <br>

        <strong>
        Affiliation:
        </strong>

        ${affiliation}

        <br>

        <strong>
        Expertise:
        </strong>

        ${expertise}

    `;


    info.style.display =
    "block";

}
```

}

/* ==========================
SHOW ADD REVIEWER FORM
========================== */

function showAddReviewerForm() {

```
const form =
document.getElementById(
    "addReviewerForm"
);


if (form) {

    form.style.display =
    "block";

}
```

}

/* ==========================
HIDE ADD REVIEWER FORM
========================== */

function hideAddReviewerForm() {

```
const form =
document.getElementById(
    "addReviewerForm"
);


if (form) {

    form.style.display =
    "none";

}
```

}

/* ==========================
ADD NEW REVIEWER
========================== */

async function addNewReviewer() {

```
const nameInput =
document.getElementById(
    "newReviewerName"
);


const emailInput =
document.getElementById(
    "newReviewerEmail"
);


const affiliationInput =
document.getElementById(
    "newReviewerAffiliation"
);


const expertiseInput =
document.getElementById(
    "newReviewerExpertise"
);


if (
    !nameInput ||
    !emailInput
) {

    alert(
        "Reviewer form is not available."
    );

    return;

}


const reviewerName =
nameInput.value.trim();


const reviewerEmail =
emailInput.value.trim()
.toLowerCase();


const affiliation =
affiliationInput ?
affiliationInput.value.trim()
:
"";


const expertise =
expertiseInput ?
expertiseInput.value.trim()
:
"";


if (!reviewerName) {

    alert(
        "Reviewer name is required."
    );

    return;

}


if (!reviewerEmail) {

    alert(
        "Reviewer email is required."
    );

    return;

}


try {

    const response =
    await fetch(

        `${SUPABASE_URL}/functions/v1/add-reviewer`,

        {

            method:
            "POST",

            headers: {

                "Content-Type":
                "application/json",

                apikey:
                SUPABASE_KEY

            },

            body:
            JSON.stringify({

                reviewer_name:
                reviewerName,

                reviewer_email:
                reviewerEmail,

                affiliation:
                affiliation,

                expertise:
                expertise

            })

        }

    );


    const result =
    await response.json();


    if (!response.ok) {

        throw new Error(

            result.error ||
            "Unable to add reviewer."

        );

    }


    alert(
        "Reviewer added successfully."
    );


    nameInput.value =
    "";


    emailInput.value =
    "";


    if (affiliationInput) {

        affiliationInput.value =
        "";

    }


    if (expertiseInput) {

        expertiseInput.value =
        "";

    }


    hideAddReviewerForm();


    await loadReviewerList();


    const reviewerSelect =
    document.getElementById(
        "reviewerSelect"
    );


    if (reviewerSelect) {

        reviewerSelect.value =
        reviewerEmail;

        selectReviewer();

    }

}
catch (error) {

    console.error(
        "Add Reviewer Error:",
        error
    );


    alert(
        error.message ||
        "Unable to add reviewer."
    );

}
```

}

/* ==========================
ASSIGNED REVIEWERS
========================== */

async function loadReviewers() {

```
const tbody =
document.querySelector(
    "#reviewerTable tbody"
);


if (!tbody) {
    return;
}


const response =
await fetch(

    `${SUPABASE_URL}/rest/v1/review_assignments?article_id=eq.${encodeURIComponent(articleId)}`,

    {

        headers: {

            apikey:
            SUPABASE_KEY,

            Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

    }

);


if (!response.ok) {

    console.error(
        "Unable to load assigned reviewers."
    );

    return;

}


const reviewers =
await response.json();


tbody.innerHTML = "";


if (
    !Array.isArray(reviewers) ||
    reviewers.length === 0
) {

    return;

}


reviewers.forEach(
    reviewer => {

        const reviewLink =
        `${window.location.origin}/reviewer/?token=${reviewer.secure_token}`;


        const row =
        document.createElement(
            "tr"
        );


        row.innerHTML = `

            <td>
            ${reviewer.reviewer_email || "-"}
            </td>

            <td>
            ${reviewer.invitation_status || "-"}
            </td>

            <td>
            ${
                reviewer.review_submitted
                ? "Yes"
                : "No"
            }
            </td>

            <td>
            ${reviewer.review_deadline || "-"}
            </td>

            <td>

                <input
                id="link_${reviewer.secure_token}"
                type="text"
                value="${reviewLink}"
                readonly
                style="width:100%;">

                <button
                onclick="copyReviewerLink('${reviewer.secure_token}')">

                Copy

                </button>

            </td>

            <td>

                <button
                onclick="generateReviewerEmail('${reviewer.secure_token}')">

                Generate Email

                </button>

            </td>

        `;


        tbody.appendChild(
            row
        );

    }
);
```

}

/* ==========================
ASSIGN REVIEWER
========================== */

async function assignReviewer() {

```
if (!manuscript) {

    alert(
        "Manuscript not loaded."
    );

    return;

}


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


try {

    const secureToken =
    crypto.randomUUID();


    const response =
    await fetch(

        `${SUPABASE_URL}/rest/v1/review_assignments`,

        {

            method:
            "POST",

            headers: {

                apikey:
                SUPABASE_KEY,

                Authorization:
                `Bearer ${SUPABASE_KEY}`,

                "Content-Type":
                "application/json",

                "Prefer":
                "return=representation"

            },

            body:
            JSON.stringify({

                article_id:
                manuscript.article_id,

                manuscript_title:
                manuscript.title,

                abstract:
                manuscript.abstract,

                reviewer_email:
                email,

                secure_token:
                secureToken,

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


    const result =
    await response.text();


    console.log(
        "Review Assignment Response:",
        result
    );


    if (!response.ok) {

        throw new Error(
            result
        );

    }


    alert(
        "Reviewer assigned successfully."
    );


    await loadReviewers();

}
catch (error) {

    console.error(error);

    alert(
        "Unable to assign reviewer."
    );

}
```

}

/* ==========================
REVIEWS
========================== */

async function loadReviews() {

```
const container =
document.getElementById(
    "reviewsContainer"
);


if (!container) {
    return;
}


const response =
await fetch(

    `${SUPABASE_URL}/rest/v1/reviews?article_id=eq.${encodeURIComponent(articleId)}`,

    {

        headers: {

            apikey:
            SUPABASE_KEY,

            Authorization:
            `Bearer ${SUPABASE_KEY}`

        }

    }

);


if (!response.ok) {

    container.innerHTML =
    "Unable to load reviews.";

    return;

}


const reviews =
await response.json();


if (
    !Array.isArray(reviews) ||
    reviews.length === 0
) {

    container.innerHTML =
    "No reviews submitted.";

    return;

}


container.innerHTML = "";


reviews.forEach(
    review => {

        container.innerHTML += `

            <div class="card">

                <h3>
                ${review.reviewer_email || "-"}
                </h3>

                <p>

                <strong>
                Recommendation:
                </strong>

                ${review.recommendation || "-"}

                </p>

                <p>

                <strong>
                Score:
                </strong>

                ${review.score || "-"}

                </p>

                <p>

                <strong>
                Comments to Author:
                </strong>

                <br>

                ${review.comments_to_author || ""}

                </p>

                <p>

                <strong>
                Confidential Comments:
                </strong>

                <br>

                ${review.confidential_comments || ""}

                </p>

            </div>

        `;

    }
);
```

}

/* ==========================
EDITORIAL DECISION
========================== */

async function updateDecision() {

```
const decision =
document.getElementById(
    "decision"
).value;


const remarks =
document.getElementById(
    "decisionRemarks"
).value;


const decisionTypeElement =
document.getElementById(
    "decisionType"
);


const decisionType =
decisionTypeElement
?
decisionTypeElement.value
:
"Final";


const editorData =
JSON.parse(
    sessionStorage.getItem(
        "editor"
    )
);


if (!editorData) {

    alert(
        "Editor session not found."
    );

    return;

}


try {

    const response =
    await fetch(

        `${SUPABASE_URL}/functions/v1/editor-decision`,

        {

            method:
            "POST",

            headers: {

                "Content-Type":
                "application/json",

                apikey:
                SUPABASE_KEY

            },

            body:
            JSON.stringify({

                article_id:
                articleId,

                decision:
                decision,

                remarks:
                remarks,

                editor_email:
                editorData.editor_email,

                decision_type:
                decisionType

            })

        }

    );


    const result =
    await response.json();


    if (!response.ok) {

        throw new Error(

            result.error ||
            "Unable to update decision."

        );

    }


    alert(
        "Decision updated successfully."
    );


    await loadManuscript();

}
catch (error) {

    console.error(
        "Decision Error:",
        error
    );


    alert(
        error.message ||
        "Unable to update decision."
    );

}
```

}

/* ==========================
COPY REVIEWER LINK
========================== */

async function copyReviewerLink(
token
) {

```
const input =
document.getElementById(
    `link_${token}`
);


if (!input) {

    alert(
        "Reviewer link not found."
    );

    return;

}


try {

    await navigator.clipboard.writeText(
        input.value
    );


    alert(
        "Reviewer link copied."
    );

}
catch (error) {

    console.error(error);

    input.select();

    document.execCommand(
        "copy"
    );

    alert(
        "Reviewer link copied."
    );

}
```

}

/* ==========================
GENERATE REVIEWER EMAIL
========================== */

async function generateReviewerEmail(
secureToken
) {

```
const reviewLink =
`${window.location.origin}/reviewer/?token=${secureToken}`;


const emailText =
```

`Dear Reviewer,

I hope this message finds you well.

I am pleased to invite you to serve as a peer reviewer for a manuscript submitted to the Journal of Materials Intelligence and Computing (JMIC). Given your expertise in the relevant field, we believe your insights would be highly valuable in evaluating this work.

Please find the manuscript details below:

Article ID: ${manuscript.article_id}

Title: ${manuscript.title}

Abstract:
${manuscript.abstract || ""}

We would be grateful if you could kindly confirm your willingness to review this manuscript. If you accept this invitation, you will be provided with secure access to the full manuscript and the review submission form through your personalized reviewer link.

Review Link:
${reviewLink}

Please use the above link to accept or decline the invitation.

We sincerely appreciate your time and consideration. Your contribution would play an important role in maintaining the quality and integrity of the peer-review process.

Kind regards,

JMIC Editorial Office
Journal of Materials Intelligence and Computing
[editorial@journal.imi-bd.com](mailto:editorial@journal.imi-bd.com)`;

```
try {

    await navigator.clipboard.writeText(
        emailText
    );


    alert(
        "Invitation email copied to clipboard."
    );

}
catch (error) {

    console.error(error);

    alert(
        "Unable to copy invitation email."
    );

}
```

}
