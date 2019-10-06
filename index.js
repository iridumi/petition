const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const cookieParser = require("cookie-parser");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(express.static("./public"));

app.use(function(req, res, next) {
    next();
});

app.get("/petition", (req, res) => {
    console.log("a get request is happening");
    res.render("petition");
});

app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let sig = req.body.signature;
    console.log(first, last, sig);
    db.addSignature(first, last, sig)
        .then(() => {
            res.redirect("/thanks");
        })
        .catch(() => {
            res.render("petition", { error: true });
        });
});

app.get("/thanks", (req, res) => {
    res.render("thanks");
});

app.get("/signers", (req, res) => {
    db.getNames().then((first, last) => {
        res.render("signers", { first, last });
    });
});

app.listen(8080, () => console.log("petition server running"));
