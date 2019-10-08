const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");

//==================== added Monday, 7.10: =========================
var cookieSession = require("cookie-session");
const csurf = require("csurf"); // it matters where it's used - use it after the body is parsed!!!
//==================================================================

//=====================added Tuesday, 8.10 ==========================
const { hash, compare } = require("./bcrypt");
//const { promisify } = require("util");
//====================================================================

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
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.set("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

// app.use(function(req, res, next) {
//     next();
// });

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    if (req.session.Id) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let sig = req.body.signature;
    //let user = req.body.user_id;
    //console.log(first, last, sig);
    db.addSignature(first, last, sig)
        .then(id => {
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
            return result;
        }),
        db.getId(cookieId).then(thanks => {
            return thanks;
        })
    ])
        .then(info => {
            const [result, thanks] = info;
            res.render("thanks", {
                count: result.rows[0].count,
                sig: thanks.rows[0].signature,
                first: thanks.rows[0].first
            });
        })
        .catch(err => console.log(err));
});

app.get("/signers", (req, res) => {
    db.getNames().then(({ rows }) => {
        res.render("signers", { rows });
    });
});

///////// Monday 07.10.2019 /////////
// app.get("/test", (req, res) => {
//     req.session.sigId = 10;
//     //    console.log("req.session in /test before redirect: ", req.session);
//     res.redirect("/");
// });

///////// Tuesday 08.10.2019 - Login & Registration //////////

app.get("/register", (req, res) => {
    console.log("a get req is happening");
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log("post request!!!");
    let { first, last, email, password } = req.body;
    console.log(req.body.password);
    hash(password)
        .then(result => {
            password = result;
            console.log(password);
            return password;
        })
        .then(password => {
            db.addUser(first, last, email, password).then(userId => {
                req.session.userId = userId.rows[0].id;
                res.redirect("/petition");
            });
        });
});

app.get("/login", (req, res) => {
    console.log("a get req is happening");
    res.render("login");
});

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
