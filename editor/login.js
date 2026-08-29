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

            `${SUPABASE_URL}/auth/v1/token?grant_type=password`,

            {

                method: "POST",

                headers: {

                    "apikey":
                    SUPABASE_KEY,

                    "Content-Type":
                    "application/json"

                },

                body:
                JSON.stringify({

                    email:
                    email,

                    password:
                    password

                })

            }

        );


        const result =
        await response.json();


        if (!response.ok) {

            throw new Error(

                result.error_description ||
                result.msg ||
                "Login failed."

            );

        }


        /*
         * Store the authenticated session.
         */

        sessionStorage.setItem(
            "access_token",
            result.access_token
        );


        sessionStorage.setItem(
            "refresh_token",
            result.refresh_token
        );


        sessionStorage.setItem(
            "user_email",
            email
        );


        /*
         * Go to editorial dashboard.
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
