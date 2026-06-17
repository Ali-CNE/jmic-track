const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

async function changePassword() {

    const editor =
    JSON.parse(
    sessionStorage.getItem(
    "editor"));

    if (!editor) {

        alert(
        "Please login again."
        );

        return;
    }

    const currentPassword =
    document.getElementById(
    "currentPassword").value;

    const newPassword =
    document.getElementById(
    "newPassword").value;

    const confirmPassword =
    document.getElementById(
    "confirmPassword").value;

    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
        "Passwords do not match."
        );

        return;
    }

    const verify =
    await fetch(

`${SUPABASE_URL}/rest/v1/editors?editor_email=eq.${encodeURIComponent(editor.editor_email)}&password=eq.${encodeURIComponent(currentPassword)}`,

        {
            headers:{
                apikey:SUPABASE_KEY,
                Authorization:
                `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const data =
    await verify.json();

    if (!data.length) {

        alert(
        "Current password incorrect."
        );

        return;
    }

    await fetch(

`${SUPABASE_URL}/rest/v1/editors?editor_email=eq.${encodeURIComponent(editor.editor_email)}`,

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

                password:
                newPassword

            })
        }
    );

    document.getElementById(
        "message"
    ).innerHTML =

    "<p>Password updated successfully.</p>";
}