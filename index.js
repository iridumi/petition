const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
var cookieSession = require("cookie-session");
const csurf = require("csurf");
const bcrypt = require("./bcrypt");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(express.static("./public"));

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
    console.log(userId);

    db.addSignature(first, last, sig, userId)
        .then(id => {
            req.session.sigId = id.rows[0].id;
            console.log(req.session.sigId);
            res.redirect("/thanks");
        })
        .catch(() => {
            res.render("petition", { error: true });
        });
});

app.get("/thanks", (req, res) => {
    let sigCookieId = req.session.sigId;
    console.log(sigCookieId);
    if (!sigCookieId) {
        res.redirect("/petition");
    } else {
        Promise.all([
            db.getNumber().then(numbers => {
                return numbers;
            }),
            db.getId(sigCookieId).then(thanks => {
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
    }
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

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/register", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;

    bcrypt
        .hash(password)
        .then(hash => {
            db.addUser(first, last, email, hash).then(newUser => {
                req.session.userId = newUser.rows[0].id;
                //res.redirect("/petition");
                res.redirect("/profile");
            });
        })
        .catch(() => {
            res.render("register", { error: true });
        });
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("login");
    }
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let typedPswd = req.body.password;
    let savedPswd;
    db.getHashPassword(email)
        .then(result => {
            //console.log(result);
            savedPswd = result.rows[0].password;
            //req.session.userId = result.rows[0].id;
            return savedPswd;
        })
        .then(savedPswd => {
            return bcrypt.compare(typedPswd, savedPswd);
        })
        .then(isMatch => {
            //console.log(isMatch);
            if (isMatch) {
                db.getLoginUserId(email).then(loginId => {
                    //console.log(loginId); // ???????????
                    req.session.userId = loginId.rows[0].id;
                    //console.log(req.session.userId);
                    return res.redirect("/petition");
                });
            } else {
                return res.render("login", { error: true });
            }
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    //    req.session.sigId = null // for a single cookie
    res.send(`You logged out`);
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is running")
);
