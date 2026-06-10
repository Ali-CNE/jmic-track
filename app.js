const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

async function searchArticle() {

const articleID =
document.getElementById("articleID").value.trim();

const tracking_token =
document.getElementById("tracking_token").value.trim();

const result =
document.getElementById("result");

result.innerHTML = "Searching...";

try {

// STEP 1: Verify manuscript
const manuscriptURL =
`${SUPABASE_URL}/rest/v1/manuscripts?article_id=eq.${encodeURIComponent(articleID)}&tracking_token=eq.${encodeURIComponent(tracking_token)}`;

const manuscriptResponse =
await fetch(manuscriptURL,{
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`
}
});

const manuscriptData =
await manuscriptResponse.json();

if(!manuscriptData || manuscriptData.length===0){

result.innerHTML =
"<div class='card'><h3>No manuscript found or invalid token.</h3></div>";

return;
}

const article = manuscriptData[0];

// STEP 2: Fetch timeline (IMPORTANT FIX)
const historyURL =
`${SUPABASE_URL}/rest/v1/status_history?article_id=eq.${encodeURIComponent(articleID)}&tracking_token=eq.${encodeURIComponent(tracking_token)}&order=updated_at.asc`;

const historyResponse =
await fetch(historyURL,{
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`
}
});

const history =
await historyResponse.json();

// STEP 3: Build timeline
let timelineHTML = "";

history.forEach(item => {
timelineHTML += `
<div class="timeline-item">
<strong>${item.status}</strong><br>
${item.remarks || ""}
<br>
<small>${new Date(item.updated_at).toLocaleString()}</small>
</div>
`;
});

// STEP 4: Render result
result.innerHTML = `
<div class="card">

<h2>${article.title}</h2>

<table>

<tr><td><strong>Article ID</strong></td><td>${article.article_id}</td></tr>

<tr><td><strong>Status</strong></td><td>${article.status}</td></tr>

<tr><td><strong>Submission Date</strong></td><td>${article.submission_date || "-"}</td></tr>

<tr><td><strong>Expected Decision</strong></td><td>${article.expected_decision || "-"}</td></tr>

<tr><td><strong>Last Updated</strong></td><td>${article.last_updated || "-"}</td></tr>

</table>

<h3>Status Timeline</h3>

${timelineHTML}

</div>
`;

}
catch(error){

console.error(error);

result.innerHTML =
"<div class='card'><h3>Error retrieving manuscript. Please try again.</h3></div>";

}
}
