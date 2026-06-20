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

try {

const response =
await fetch(
`${SUPABASE_URL}/rest/v1/editor_assignments?editor_email=eq.${encodeURIComponent(currentEditor.editor_email)}&active=eq.true`,
{
headers:{
apikey:SUPABASE_KEY,
Authorization:`Bearer ${SUPABASE_KEY}`
}
}
);

const assignments =
await response.json();

if (!Array.isArray(data) ||
data.length === 0) {

alert("Invalid login.");

return;

}

currentEditor = data[0];

console.log("Logged in editor:", currentEditor);

sessionStorage.setItem(
"editor",
JSON.stringify(currentEditor)
);

document
.getElementById("loginSection")
.style.display = "none";

document
.getElementById("dashboard")
.style.display = "block";

document
.getElementById("dashboardHeader")
.style.display = "flex";

await loadDashboard();

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
.getElementById("dashboardHeader")
.style.display = "flex";

loadDashboard();

}

};



async function loadDashboard() {

    try {

        let manuscripts = [];

        if (
            currentEditor.role === "Chief Editor"
            ||
            currentEditor.role === "Editor-in-Chief"
        ) {

            const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/manuscripts?select=*`,
                {
                    headers:{
                        apikey:SUPABASE_KEY,
                        Authorization:
                        `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            manuscripts =
            await response.json();

        }
        else {

            const assignmentResponse =
            await fetch(
                `${SUPABASE_URL}/rest/v1/editor_assignments?editor_email=eq.${encodeURIComponent(currentEditor.editor_email)}&active=eq.true`,
                {
                    headers:{
                        apikey:SUPABASE_KEY,
                        Authorization:
                        `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            const assignments =
            await assignmentResponse.json();

            if(assignments.length===0){

                manuscripts = [];

            }
            else{

                const articleIds =
                assignments.map(
                    a => a.article_id
                );

                const filter =
                articleIds.join(",");

                const manuscriptResponse =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/manuscripts?article_id=in.(${filter})`,
                    {
                        headers:{
                            apikey:SUPABASE_KEY,
                            Authorization:
                            `Bearer ${SUPABASE_KEY}`
                        }
                    }
                );

                manuscripts =
                await manuscriptResponse.json();
            }
        }

        updateStats(manuscripts);

        renderTable(manuscripts);

    }
    catch(error){

        console.error(error);

        alert(
        "Unable to load manuscripts."
        );
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

function logout() {

    sessionStorage.clear();

    window.location.reload();
}

function openPasswordPage() {

    window.location.href =
    "change-password.html";
}
