// Import necessary modules
const express = require("express");
const path = require("path");
const { Pool } = require('pg');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
const router = express.Router();

// Set port and configure body-parser
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL database connection pool
const pool = new Pool({
    user: process.env.DB_USERNAME || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'IntexPractice',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Define route for form submission
app.post('/submitForm', (req, res) => {
    // Extract form data from the request
    const { q1, q2, q3, q4, q6, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20, q5, q7, loc } = req.body;

    // First Query
    const query = `
        INSERT INTO survey (q1, q2, q3, q4, q6, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `;

    const values = [q1, q2, q3, q4, q6, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20];

    // Execute the first query
    pool.query(query, values, (error, results) => {
        if (error) {
            console.error('Error executing first query', error);
            res.status(500).send('Internal Server Error');
        } else {
            // Second Query
            const query2 = `
                INSERT INTO Q5Q7 (q5, q7, loc)
                VALUES ($1, $2, $3)
            `;

            const values2 = [q5, q7, loc];

            // Execute the second query
            pool.query(query2, values2, (error2, results2) => {
                if (error2) {
                    console.error('Error executing second query', error2);
                    res.status(500).send('Internal Server Error');
                } else {
                    // Both queries executed successfully
                    res.status(200).send('Survey submitted successfully!');
                }
            });
        }
    });
});

// Configure views and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Define routes using the router
app.use("/", router);

// Define routes for different pages
router.get("/", (req, res) => {
    console.log("start page active");
    res.render("index");
});

router.get("/survey", (req, res) => {
    console.log("survey page active");
    res.render("survey");
});

router.get("/awareness", (req, res) => {
    console.log("awareness page active");
    res.render("awareness");
});

router.get("/login", (req, res) => {
    console.log("login page active");
    res.render("login");
});

// Start the server
app.listen(app.get("port"), () => {
    console.log("server started on port " + app.get("port"));
});

// Knex database connection
const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "password",
        database: process.env.RDS_DB_NAME || "IntexPractice",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

// Route to fetch survey data
app.get("/data", (req, res) => {
    knex.select().from("survey").then(survey => {
        res.render("data", { mysurvey: survey });
    });
});
