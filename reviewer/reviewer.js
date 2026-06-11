const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

let assignment = null;

loadAssignment();

async function loadAssignment() {

const app = document.getElementById("app");

if (!token) {
app.innerHTML = "<p class='error'>Invalid access link.</p>";
return;
}

try {

const res = await fetch(
`${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
{
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`
}
}
);

const data = await res.json();

if (!data || data.length === 0) {
app.innerHTML = "<p class='error'>Assignment not found.</p>";
return;
}

assignment = data[0];

renderState();

} catch (err) {
console.error(err);
app.innerHTML = "<p class='error'>Error loading assignment.</p>";
}
}

function renderState() {

const app = document.getElementById("app");

if (assignment.review_submitted) {
app.innerHTML = "<h3 class='success'>Review already submitted.</h3>";
return;
}

if (assignment.invitation_status === "Declined") {
app.innerHTML = "<h3 class='error'>You have declined this invitation.</h3>";
return;
}

if (assignment.invitation_status === "Pending") {
app.innerHTML = `
<h2>${assignment.manuscript_title}</h2>

<div class="manuscript-info">
<p><strong>Article ID:</strong> ${assignment.article_id}</p>
<p><strong>Due Date:</strong> ${assignment.due_date || "-"}</p>
<p><strong>Abstract:</strong></p>
<p>${assignment.abstract || "Not available"}</p>
</div>

<button onclick="acceptInvitation()">Accept Invitation</button>
<button onclick="declineInvitation()" style="background:#999;">Decline</button>
`;
return;
}

if (assignment.invitation_status === "Accepted") {
renderReviewForm();
}
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
},
body: JSON.stringify({
invitation_status: "Accepted"
})
}
);

assignment.invitation_status = "Accepted";
renderState();
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
},
body: JSON.stringify({
invitation_status: "Declined"
})
}
);

assignment.invitation_status = "Declined";
renderState();
}

function renderReviewForm() {

const app = document.getElementById("app");

app.innerHTML = `
<h2>${assignment.manuscript_title}</h2>

<div class="manuscript-info">
<p><strong>Article ID:</strong> ${assignment.article_id}</p>
</div>

<div class="review-section">

<label>Recommendation</label>
<select id="rec">
<option>Accept</option>
<option>Minor Revision</option>
<option>Major Revision</option>
<option>Reject</option>
</select>

<label>Comments to Author</label>
<textarea id="author"></textarea>

<label>Confidential Comments to Editor</label>
<textarea id="editor"></textarea>

<label>Score (1–10)</label>
<input type="number" id="score" min="1" max="10">

<button onclick="submitReview()">Submit Review</button>

</div>
`;
}

async function submitReview() {

const rec = document.getElementById("rec").value;
const author = document.getElementById("author").value;
const editor = document.getElementById("editor").value;
const score = document.getElementById("score").value;

try {

// 1. Insert review
const res = await fetch(
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

if (!res.ok) throw new Error("Insert failed");

// 2. Mark assignment complete
await fetch(
`${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${token}`,
{
method: "PATCH",
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
review_submitted: true,
invitation_status: "Submitted"
})
}
);

document.getElementById("app").innerHTML =
"<h2 class='success'>Review submitted successfully.</h2>";

} catch (err) {
console.error(err);
alert("Submission failed.");
}
}
