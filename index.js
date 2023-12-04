let express = require("express");
let app = express();

app.get("/", function(req,res) {
    res.send("IT WORKS")
} )

app.listen(process.env.PORT || 5000);
module.exports = app;