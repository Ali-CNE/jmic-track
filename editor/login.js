const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";


async function login() {

    const email =
    document
    .getElementById("email")
    .value
    .trim();

    const password =
    document
    .getElementById("password")
    .value;

    const message =
    document
    .getElementById("loginMessage");


    if (!email || !password) {

        message.textContent =
        "Email and password are required.";

        return;

    }


    try {

        const response =
        await fetch(

            `${SUPABASE_URL}/rest/v1/rpc/verify_editor_login`,

            {

                method: "POST",

                headers: {

                    "apikey":
                    SUPABASE_KEY,

                    "Authorization":
                    `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                    "application/json"

                },

                body:
                JSON.stringify({

                    p_email:
                    email,

                    p_password:
                    password

                })

            }

        );


        const result =
        await response.json();


        if (
            !response.ok ||
            !Array.isArray(result) ||
            result.length === 0
        ) {

            throw new Error(
                "Invalid email or password."
            );

        }


        /*
         * Store the same editor information
         * expected by editor.js.
         */

        const currentEditor =
        result[0];


        sessionStorage.setItem(

            "editor",

            JSON.stringify(
                currentEditor
            )

        );


        /*
         * Optional: store email separately.
         */

        sessionStorage.setItem(

            "user_email",

            email

        );


        /*
         * Go directly to the
         * existing editorial dashboard.
         */

        window.location.href =
        "index.html";

    }


    catch(error) {

        console.error(error);

        message.textContent =
        error.message;

    }

}
