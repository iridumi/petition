const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
//const cookieParser = require("cookie-parser"); // not secure!

//==================== added Monday, 7.10: =========================
var cookieSession = require("cookie-session");
const csurf = require("csurf"); // it matters where it's used - use it after the body is parsed!!!
//==================================================================

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(express.static("./public"));

// middleware:
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14 // expiration date (2 weeks)
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.set("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken(); // now every route will have it
    next(); // (it's enough but to be even more sure you can write js code to check: parent == window or top == window. top.location.href='http://spiced.academy')
});

// app.use(function(req, res, next) {
//     next();
// });

app.get("/", (req, res) => {
    //    console.log("req.session in /route: ", req.session);
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    //    console.log("a get request is happening");
    if (req.session.Id) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
        //this spits out a form and you want to put the token in it
        //, {
        //req.csrfToken(); // if you do it this way you have to remember doing it in every route that spits out a form
        //});
    }
});

app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let sig = req.body.signature;
    let id =
        //console.log(req.body.signature);
        //console.log(first, last, sig);
        db
            .addSignature(first, last, sig)
            .then(id => {
                //    console.log(id.rows[0].id);
                req.session.sigId = id.rows[0].id;
                res.redirect("/thanks");
            })
            .catch(() => {
                res.render("petition", { error: true });
            });
});

app.get("/thanks", (req, res) => {
    let cookieId = req.session.sigId;
    Promise.all([
        db.getNumber().then(result => {
            // console.log(
            //     "this is the number of signers: ",
            //     result.rows[0].count
            // );
            return result;
        }),
        db.getId(cookieId).then(thanks => {
            //console.log(thanks.rows[0].signature);
            return thanks;
        })
    ]).then(info => {
        const [result, thanks] = info;
        res.render("thanks", {
            count: result.rows[0].count,
            sig: thanks.rows[0].signature,
            first: thanks.rows[0].first
        });
    });

    // }) => {
    //
    // });

    //
    //     res.render("thanks", { count: result.rows[0].count });
    // });
    //
    //     res.render("thanks", { sig: thanks.rows[0].signature });
    // });
});

app.get("/signers", (req, res) => {
    //db.getNames().then((first, last) => {
    db.getNames().then(({ rows }) => {
        res.render("signers", { rows });
        //console.log({ rows });
    });
});

///////// Monday 07.10.2019 /////////
// app.get("/test", (req, res) => {
//     req.session.sigId = 10;
//     //    console.log("req.session in /test before redirect: ", req.session);
//     res.redirect("/");
// });

app.get("/logout", (req, res) => {
    req.session = null;
    //    req.session.sigId = null // for a single cookie
    res.send(`You logged out`);
});

app.get("*", (req, res) => {
    req.session.cohort = "coriander";
    res.redirect("/");
});

app.listen(8080, () => console.log("petition server running"));
