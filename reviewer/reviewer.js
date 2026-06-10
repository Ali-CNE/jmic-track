const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params =
new URLSearchParams(window.location.search);

const token =
params.get("token");

loadAssignment();

async function loadAssignment(){

const content =
document.getElementById("reviewContent");

if(!token){

content.innerHTML =
"<p class='error'>Invalid review link.</p>";

return;
}

try{

const url =
`${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`;

const response =
await fetch(url,{
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`
}
});

const data =
await response.json();

if(data.length===0){

content.innerHTML =
"<p class='error'>Review assignment not found.</p>";

return;

}

const assignment =
data[0];

if(assignment.review_submitted){

content.innerHTML =
"<p class='success'>Review already submitted.</p>";

return;

}

content.innerHTML =

`

<div class="manuscript-info">

<h2>${assignment.manuscript_title}</h2>

<p><strong>Article ID:</strong>
${assignment.article_id}</p>

<p><strong>Due Date:</strong>
${assignment.due_date || "-"}</p>

<p><strong>Abstract:</strong></p>

<p>${assignment.abstract || "No abstract available."}</p>

</div>

<div class="review-section">

<label>Recommendation</label>

<select id="recommendation">

<option value="Accept">Accept</option>

<option value="Minor Revision">Minor Revision</option>

<option value="Major Revision">Major Revision</option>

<option value="Reject">Reject</option>

</select>

<label>Comments to Author</label>

<textarea id="commentsAuthor"></textarea>

<label>Confidential Comments to Editor</label>

<textarea id="commentsEditor"></textarea>

<label>Overall Score (1-10)</label>

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

window.assignment = assignment;

}
catch(error){

console.error(error);

content.innerHTML =
"<p class='error'>Unable to load review assignment.</p>";

}

}

async function submitReview(){

const recommendation =
document.getElementById("recommendation").value;

const commentsAuthor =
document.getElementById("commentsAuthor").value;

const commentsEditor =
document.getElementById("commentsEditor").value;

const score =
document.getElementById("score").value;

try{

const reviewResponse =
await fetch(
`${SUPABASE_URL}/rest/v1/reviews`,
{
method:"POST",
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json",
"Prefer":"return=minimal"
},
body:JSON.stringify({

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

if(!reviewResponse.ok){

throw new Error(
"Failed to submit review"
);

}

await fetch(

`${SUPABASE_URL}/rest/v1/review_assignments?review_token=eq.${encodeURIComponent(token)}`,

{
method:"PATCH",

headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`,
"Content-Type":"application/json"
},

body:JSON.stringify({
review_submitted:true,
status:"Submitted"
})

}

);

document.getElementById(
"reviewContent"
).innerHTML =

`

<div class="card">

<h2 class="success">

Review Submitted Successfully

</h2>

<p>

Thank you for your contribution.

</p>

</div>
`;

}
catch(error){

console.error(error);

alert(
"Failed to submit review."
);

}

}
