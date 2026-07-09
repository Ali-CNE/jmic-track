const SUPABASE_URL =
"https://rjoccijmuynkqjmlfthz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const params =
new URLSearchParams(window.location.search);

const token =
params.get("token");

let manuscript=null;

window.onload=loadRevision;

async function loadRevision(){

    const app=
    document.getElementById("app");

    if(!token){

        app.innerHTML=
        "<h2>Invalid revision link.</h2>";

        return;

    }

    try{

        const response=
        await fetch(

            `${SUPABASE_URL}/rest/v1/manuscripts?tracking_token=eq.${encodeURIComponent(token)}`,

            {

                headers:{

                    apikey:SUPABASE_KEY,

                    Authorization:
                    `Bearer ${SUPABASE_KEY}`

                }

            }

        );

        const data=
        await response.json();

        if(

            !Array.isArray(data)

            ||

            data.length===0

        ){

            app.innerHTML=

            "<h2>Revision link is invalid.</h2>";

            return;

        }

        manuscript=data[0];

        renderRevisionForm();

    }

    catch(error){

        console.error(error);

        app.innerHTML=

        "<h2>Unable to load manuscript.</h2>";

    }

}

function renderRevisionForm(){

    const app=
    document.getElementById("app");

    app.innerHTML=`

<h2>

Revision Submission

</h2>

<p>

<strong>Article ID</strong><br>

${manuscript.article_id}

</p>

<p>

<strong>Title</strong><br>

${manuscript.title}

</p>

<p>

<strong>Corresponding Author</strong><br>

${manuscript.corresponding_author}

</p>

<hr>

<label>

<b>Revised Manuscript (.doc/.docx)</b>

</label>

<br><br>

<input

type="file"

id="revisionFile"

accept=".doc,.docx"

>

<br><br>

<label>

<b>Response to Reviewers (.doc/.docx)</b>

</label>

<br><br>

<input

type="file"

id="responseFile"

accept=".doc,.docx"

>

<br><br>

<label>

Cover Message (Optional)

</label>

<br><br>

<textarea

id="coverMessage"

rows="6"

placeholder="Write a short message to the editor..."

></textarea>

<br><br>

<button

onclick="submitRevision()"

>

Submit Revision

</button>

`;

}

async function submitRevision(){

    const revisionFile =
    document.getElementById(
        "revisionFile"
    ).files[0];

    const responseFile =
    document.getElementById(
        "responseFile"
    ).files[0];

    const coverMessage =
    document.getElementById(
        "coverMessage"
    ).value;

    //--------------------------------------------------
    // Validation
    //--------------------------------------------------

    if(!revisionFile){

        alert(
        "Please upload the revised manuscript."
        );

        return;

    }

    if(!responseFile){

        alert(
        "Please upload the response letter."
        );

        return;

    }

    const validExtensions =

    [

        "doc",

        "docx"

    ];

    function extension(file){

        return file.name
        .split(".")
        .pop()
        .toLowerCase();

    }

    if(

        !validExtensions.includes(
        extension(revisionFile))

    ){

        alert(

        "Revised manuscript must be a Word document (.doc/.docx)."

        );

        return;

    }

    if(

        !validExtensions.includes(
        extension(responseFile))

    ){

        alert(

        "Response letter must be a Word document (.doc/.docx)."

        );

        return;

    }

    //--------------------------------------------------
    // Upload revised manuscript
    //--------------------------------------------------

    const revisionPath =

    `${manuscript.article_id}/revision-${manuscript.revision_number+1}/revision.${extension(revisionFile)}`;

    const responsePath =

    `${manuscript.article_id}/revision-${manuscript.revision_number+1}/response-letter.${extension(responseFile)}`;

    try{

        //--------------------------------------------------
        // Upload revision
        //--------------------------------------------------

        let response =
        await fetch(

            `${SUPABASE_URL}/storage/v1/object/revisions/${revisionPath}`,

            {

                method:"POST",

                headers:{

                    apikey:SUPABASE_KEY,

                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                    revisionFile.type,

                    "x-upsert":"true"

                },

                body:revisionFile

            }

        );

        if(!response.ok){

    const err = await response.text();

    console.log(err);

    throw new Error(err);

}

        //--------------------------------------------------
        // Upload response letter
        //--------------------------------------------------

        response =
        await fetch(

            `${SUPABASE_URL}/storage/v1/object/revisions/${responsePath}`,

            {

                method:"POST",

                headers:{

                    apikey:SUPABASE_KEY,

                    Authorization:
                    `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                    responseFile.type,

                    "x-upsert":"true"

                },

                body:responseFile

            }

        );

       if(!response.ok){

    const err = await response.text();

    console.log(err);

    throw new Error(err);

}

        //--------------------------------------------------
        // Notify Edge Function
        //--------------------------------------------------

        response =

        await fetch(

        "https://rjoccijmuynkqjmlfthz.supabase.co/functions/v1/submit-revision",

        {

            method:"POST",

            headers:{

                "Content-Type":"application/json",

                apikey:SUPABASE_KEY

            },

            body:JSON.stringify({

                tracking_token:token,

                revised_pdf_path:
                revisionPath,

                response_letter_path:
                responsePath,

                cover_message:
                coverMessage

            })

        });

        const result =
        await response.json();

        if(!response.ok){

            throw new Error(
                result.error
            );

        }

        //--------------------------------------------------

        document.getElementById(
        "app"
        ).innerHTML=`

        <h2>

        Revision Submitted Successfully

        </h2>

        <p>

        Thank you.

        Your revised manuscript has been received.

        </p>

        `;

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}
