if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
// Import necessary modules
const express = require("express");
const path = require("path");
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const { constants } = require("perf_hooks");
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override')
const users = [];


const passport = require('passport');
const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

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
    const { time, loc, q1, q2, q3, q4, q5, q6, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20 } = req.body;

    // First Query
    const query = `
        INSERT INTO Survey (SurveyTime, City, Age, Gender, Relationship, Occupation, UseSocial, Q8INT, Q9, Q10, Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;

    const values = [time, loc, q1, q2, q3, q4, q6, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20];

    // Execute the first query
        pool.query(query, values, async (error, results) => {
        if (error) {
            console.error('Error executing first query', error);
            res.status(500).send('Internal Server Error');
        } else {
            // Second Query
            const query2 = 'INSERT INTO Organization (OrgNum, Q5) VALUES ($1, $2)';
            const pool2 = pool;
            
            await pool2.connect();
            for (let i = 0; i < q5.length; i++) {
                const orgNum = i + 1;
                const org = q5[i];
                const values2 = [orgNum, org];
                await pool2.query(query2, values2);
            }

            // Release pool2
            pool2.release();

            // Third Query
            const query3 = 'INSERT INTO Platform (PlatNum, Q7) VALUES ($1, $2)';
            const pool3 = pool;

            await pool3.connect();
            for (let i = 0; i < q7.length; i++) {
                const PlatNum = i + 1;
                const plat = q7[i];
                const values3 = [PlatNum, plat];
                await pool3.query(query3, values3);
            }

            // Release pool3
            pool3.release();

            console.log('Records inserted successfully.');
            res.status(200).send('Survey submitted successfully!');
        }
    });
});

// Configure views and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

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

router.get("/login", checkNotAuthenticated, (req, res) => {
    console.log("login page active");
    res.render("login");
});

router.get("/register",checkNotAuthenticated, (req, res) => {
    console.log("register page active");
    res.render("register");
});


app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: 'data',
    failureRedirect: 'login',
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch{
        res.redirect('/register')
    }
    console.log(users);
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('login')
})

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
app.get("/data", checkAuthenticated, (req, res) => {
    knex.select().from("survey").then(survey => {
        res.render("data", { mysurvey: survey });
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/data')
    }
    next()
}