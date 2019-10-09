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
    if (req.session.sigId) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let sig = req.body.signature;
    let userId = req.body.user_id;
    //let user = req.body.user_id;
    //console.log(first, last, sig);
    db.addSignature(first, last, sig, userId)
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
        db.getNumber().then(numbers => {
            return numbers;
        }),
        db.getId(cookieId).then(thanks => {
            return thanks;
        })
    ])
        .then(info => {
            const [numbers, thanks] = info;
            res.render("thanks", {
                count: numbers.rows[0].count,
                sig: thanks.rows[0].signature,
                first: thanks.rows[0].first
            });
        })
        .catch(error => console.log(error));
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
    console.log("a get req is happening on registration");
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log("post request on register!!!");
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;
    //let { first, last, email, password } = req.body;
    //let password = req.body.password;
    console.log(req.body.password);
    bcrypt.hash(password).then(() => {
        console.log(password);
        db.addUser(first, last, email, password).then(userId => {
            console.log(userId);
            req.session.userId = userId.rows[0].id;
            res.redirect("/petition");
        });
    });
});

app.get("/login", (req, res) => {
    console.log("a get req is happening on login");
    res.render("login");
});

app.post("/login", (req, res) => {
    console.log("post request on log in!!!");
    let email = req.body.email;
    let typedPswd = req.body.password;
    let savedPswd;
    db.getHashPassword(email).then(result => {
        console.log(result);
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    //    req.session.sigId = null // for a single cookie
    res.send(`You logged out`);
});

// app.get("*", (req, res) => {
//     req.session.cohort = "coriander";
//     res.redirect("/");
// });

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is running")
);
