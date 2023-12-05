const express = require("express")

let app = express();

let path = require("path")

const port = process.env.PORT || 3000;

app.set("view engine", "ejs")

app.use(express.urlencoded({ extended:true}))

const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "password",
        database: process.env.RDS_DB_NAME || "IntexFall",
        port: process.env.RDS_PORT || 5432,
        ssl:process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
})

app.get("/", (req, res) => {
    knex.select().from("survey").then( survey => {
        res.render("displayPractice", { mysurvey : survey });
    })
})

app.listen(port, () => console.log("I am listening"))
