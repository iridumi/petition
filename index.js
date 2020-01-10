const express = require("express");
const app = (exports.app = express());

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
    if (!req.session.userId) {
        res.redirect("/register");
    } else if (req.session.userId && !req.session.sigId) {
        res.redirect("/petition");
    } else {
        res.redirect("/thanks");
    }
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
            db.addUser(first, last, email, hash)
                .then(newUser => {
                    req.session.userId = newUser.rows[0].id;
                    res.redirect("/profile");
                })
                .catch(() => {
                    return res.render("register", { error: true });
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
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;
    let user_id = req.session.userId;

    if (age || city || url) {
        if (
            url != "" &&
            !url.startsWith("http://") &&
            !url.startsWith("https://") &&
            !url.startsWith("//")
        ) {
            res.render("profile", { error: true });
        } else {
            db.addProfile(age, city, url, user_id).then(result => {
                req.session.profileId = result.rows[0].id;
                res.redirect("/petition");
            });
        }
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

app.post("/signature/delete", (req, res) => {
    db.delSignature(req.session.userId).then(() => {
        req.session.sigId = null;
        res.redirect("/petition");
    });
});

app.get("/profile/edit", (req, res) => {
    db.showProfile(req.session.userId).then(result => {
        res.render(
            "editprofile",
            {
                first: result.rows[0].first,
                last: result.rows[0].last,
                email: result.rows[0].email,
                age: result.rows[0].age,
                city: result.rows[0].city,
                url: result.rows[0].url
            },
            console.log("get route: ", result.rows[0].email)
        );
    });
});

app.post("/profile/edit", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.url;

    if (password) {
        bcrypt
            .hash(password)
            .then(hash => {
                password = hash;
                return password;
            })
            .then(password => {
                db.editPassword(
                    first,
                    last,
                    email,
                    password,
                    req.session.userId
                ).then(() => {
                    db.editProfile(age, city, url, req.session.userId)
                        .then(() => {
                            res.redirect("/thanks");
                        })
                        .catch(err => {
                            console.log(err);
                        });
                });
            });
    } else {
        db.editUsers(first, last, email, req.session.userId).then(() => {
            db.editProfile(age, city, url, req.session.userId);
            return db
                .editProfile(age, city, url, req.session.userId)
                .then(() => {
                    res.redirect("/thanks");
                });
        });
    }
});

//             .catch(() => {
//                 res.render("register", { error: true });
//             });

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
            .catch(error => {
                console.log(error);
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
    let userId = req.session.userId;

    Promise.all([
        db.getNumber().then(numbers => {
            return numbers;
        }),
        db.getSignature(userId).then(thanks => {
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
        .catch(error => {
            console.log(error);
            res.render("petition", { error: true });
        });

    //}
});

app.get("/signers", (req, res) => {
    if (req.session.userId) {
        db.sigCheck(req.session.userId).then(({ rows }) => {
            if (rows[0]) {
                db.getSigners().then(({ rows }) => {
                    res.render("signers", { rows });
                });
            } else {
                res.redirect("/petition");
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/signers/:city", (req, res) => {
    let { city } = req.params;
    if (req.session.userId) {
        db.sigCheck(req.session.userId).then(({ rows }) => {
            if (rows[0]) {
                db.getSignersCity(city).then(({ rows }) => {
                    res.render("city", { rows, city });
                });
            } else {
                res.redirect("/petition");
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

app.post("/delete/account", (req, res) => {
    db.delSignature(req.session.userId)
        .then(() => {
            req.session.sigId = null;
        })
        .then(() => {
            db.delUserProfile(req.session.userId).then(() => {
                db.delUser(req.session.userId).then(() => {
                    req.session = null;
                    res.redirect("/register");
                });
            });
        });
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is running")
);
