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

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("register");
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
                res.redirect("/profile");
            });
        })
        .catch(() => {
            res.render("register", { error: true });
        });
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    console.log("post request is happening on profile");
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;
    let user_id = req.session.userId;

    if (age || city || url) {
        db.addProfile(age, city, url, user_id).then(result => {
            req.session.profileId = result.rows[0].id;
            res.redirect("/petition");
        });
    } else {
        res.redirect("/petition");
    }
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
            savedPswd = result.rows[0].password;
            return savedPswd;
        })
        .then(savedPswd => {
            return bcrypt.compare(typedPswd, savedPswd);
        })
        .then(isMatch => {
            if (isMatch) {
                db.getLoginUserId(email).then(loginId => {
                    req.session.userId = loginId.rows[0].id;
                    return res.redirect("/petition");
                });
            } else {
                return res.render("login", { error: true });
            }
        })
        .catch(error => {
            console.log(error);
            return res.render("login", { error: true });
        });
});

app.get("/petition", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thanks");
    } else if (req.session.userId) {
        db.sigCheck(req.session.userId)
            .then(({ rows }) => {
                if (rows[0]) {
                    res.redirect("/thanks");
                } else {
                    res.render("petition");
                }
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    let sig = req.body.signature;
    let userId = req.session.userId;

    if (!sig) {
        return res.render("petition", { error: true });
    } else {
        db.addSignature(sig, userId)
            .then(id => {
                req.session.sigId = id.rows[0].id;
                res.redirect("/thanks");
            })
            .catch(() => {
                res.render("petition", { error: true });
            });
    }
});

app.get("/thanks", (req, res) => {
    let sigCookieId = req.session.sigId;

    if (!sigCookieId) {
        res.redirect("/petition");
    } else {
        Promise.all([
            db.getNumber().then(numbers => {
                console.log(numbers);
                return numbers;
            }),
            db.getSignature(sigCookieId).then(thanks => {
                console.log(thanks);
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
    db.getSigners()
        .then(({ rows }) => {
            res.render("signers", { rows });
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/signers/:city", (req, res) => {
    let { city } = req.params;
    db.getSignersCity(city)
        .then(({ rows }) => {
            res.render("signers", { rows });
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is running")
);
