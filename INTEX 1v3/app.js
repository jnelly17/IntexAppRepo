var express = require("express");
var path = require("path");

var app = express();
const router = express.Router(); // Moved router definition to the top

app.set("port", process.env.PORT || 3000);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs"); // Corrected the setting for view engine

app.use("/", router); // Use the router for the root path
app.use(express.static(path.join(__dirname, "public")));

router.get("/", function(req, res){
    console.log("start page active");
    res.render("index"); // Removed .ejs since the view engine is set
});
router.get("/survey", function(req, res) {
    console.log("survey page active");
    res.render("survey");
});
router.get("/awareness", function(req, res) {
    console.log("awareness page active");
    res.render("awareness");
});
router.get("/login", function(req, res) {
    console.log("login page active");
    res.render("login");
});

app.listen(app.get("port"), function (){
    console.log("server started on port " + app.get("port"));
});
