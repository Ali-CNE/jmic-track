const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

let currentEditor = null;

async function login() {

const email =
document.getElementById("email")
.value.trim();

const password =
document.getElementById("password")
.value.trim();

if (!email || !password) {

alert("Enter email and password.");

return;

}

  function logout() {

    sessionStorage.removeItem(
        "editor"
    );

    location.reload();
}

try {

const response =
await fetch(
`${SUPABASE_URL}/rest/v1/editors?editor_email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`,
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

alert("Invalid login.");

return;

}

currentEditor =
data[0];

sessionStorage.setItem(
"editor_email",
currentEditor.editor_email
);

document
.getElementById("loginSection")
.style.display = "none";

document
.getElementById("dashboard")
.style.display = "block";

loadDashboard();

}
catch(error) {

console.error(error);

alert("Login failed.");

}
}

window.onload = () => {

const stored =
sessionStorage.getItem("editor");

if (stored) {

currentEditor =
JSON.parse(stored);

document
.getElementById("loginSection")
.style.display = "none";

document
.getElementById("dashboard")
.style.display = "block";

loadDashboard();

}

};

async function loadDashboard() {

try {

const response =
await fetch(
`${SUPABASE_URL}/rest/v1/manuscripts?select=*`,
{
headers: {
apikey: SUPABASE_KEY,
Authorization:
`Bearer ${SUPABASE_KEY}`
}
}
);

const manuscripts =
await response.json();

updateStats(manuscripts);

renderTable(manuscripts);

}
catch(error) {

console.error(error);

}
}

function updateStats(manuscripts) {

document
.getElementById("submittedCount")
.textContent =
manuscripts.length;

document
.getElementById("underReviewCount")
.textContent =
manuscripts.filter(
m =>
m.status ===
"Under Review"
).length;

document
.getElementById("acceptedCount")
.textContent =
manuscripts.filter(
m =>
m.status ===
"Accepted"
).length;

document
.getElementById("rejectedCount")
.textContent =
manuscripts.filter(
m =>
m.status ===
"Rejected"
).length;

}

function renderTable(manuscripts) {

const tbody =
document.querySelector(
"#manuscriptTable tbody"
);

tbody.innerHTML = "";

manuscripts.forEach(
manuscript => {

const row =
document.createElement("tr");

row.innerHTML = `

<td>
${manuscript.article_id}
</td>

<td>
${manuscript.title}
</td>

<td>
${manuscript.status}
</td>

<td>
${manuscript.submission_date || "-"}
</td>

<td>

<button
onclick="openManuscript(
'${manuscript.article_id}'
)">

Open

</button>

</td>

`;

tbody.appendChild(row);

}
);

}

function openManuscript(
articleId
) {

window.location.href =
`manuscript.html?id=${encodeURIComponent(articleId)}`;

}
