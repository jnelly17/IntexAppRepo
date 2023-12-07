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
app.use(bodyParser.json());

// PostgreSQL database connection pool
const pool = new Pool({
    user: process.env.DB_USERNAME || 'postgres',
    host: process.env.DB_HOST || 'ebroot',
    database: process.env.DB_NAME || 'ebdb',
    password: process.env.DB_PASSWORD || 'ChickenJoe03',
    port: process.env.RDS_PORT || 5432,
});

app.post("/submitForm", async (req, res) => {
    try {
        const surveyData = {
            SurveyTime: new Date(),
            City: req.body.location,
            Age: req.body.age,
            Gender: req.body.gender,
            Relationship: req.body.relationStatus,
            Occupation: req.body.occupStatus,
            UseSocial: req.body.media,
            Q8: req.body.time,
            Q9: req.body.purpose,
            Q10: req.body.distractFreq,
            Q11: req.body.restless,
            Q12: req.body.distract,
            Q13: req.body.worries,
            Q14: req.body.concentrate,
            Q15: req.body.compare,
            Q16: req.body.feel,
            Q17: req.body.validation,
            Q18: req.body.down,
            Q19: req.body.interest,
            Q20: req.body.sleep,
        };

        // Insert survey data into the database
        const insertedSurvey = await knex("Survey").insert(surveyData).returning("*");

        // Log the inserted survey data to make sure that it is right
        console.log("DB updated successfully:", insertedSurvey);

        // Now take the max survey number and assign it to the variable maxSurveyNumber
        const maxSurveyNumber = await knex("Survey").max("SurveyNumber").first();
        //check that shiz in the console
        console.log("Max Survey Number:", maxSurveyNumber);

        const Q5 = req.body.affiliations;
        if (Q5 == null){
            Q5 = ['N/A'];
        }
        console.log(Q5);

        try{
            for (let i = 0; i < Q5.length; i++) {
                const orgdata = {
                    OrgNum: (i + 1),
                    SurveyNumber: maxSurveyNumber['max'],
                    Q5: Q5[i]
                }
                const inserteddata = await knex("Organization").insert(orgdata).returning("*");
                console.log("Data successfully inserted into Organization table)",inserteddata)
            }
        } catch(error) {
            console.error("uh oh organization", error)
        }

        const Q7 = req.body.affiliations;
        if (Q7 == null){
            Q7 = ['N/A'];
        }
        console.log(Q5);
            

        try{
            for (let i = 0; i < Q7.length; i++) {
                const platdata = {
                    PlatNum: (i + 1),
                    SurveyNumber: maxSurveyNumber['max'],
                    Q7: Q7[i]
                }
                const inserteddata = await knex("Platform").insert(platdata).returning("*");
                console.log("Data successfully inserted into Platform table)", inserteddata)
            }
        } catch(error) {
            console.error("uh oh biggie mistake in the platforms", error)
        }

    } catch (error) {
        console.error("Error submitting form:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
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

app.get('/logout', function (req, res) {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
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
        database: process.env.RDS_DB_NAME || "NormalizationTest",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

// Route to fetch survey and organization data
app.get('/filter', checkAuthenticated, (req, res) => {
    const selectedSurvey = req.query.surveyNum;
    knex('Survey AS s')
  .innerJoin(
    knex.raw('(SELECT string_agg(org."Q5", \', \') as Organizations, org."SurveyNumber" FROM public."Organization" org group by org."SurveyNumber") AS sub1'),
    'sub1.SurveyNumber',
    's.SurveyNumber'
  )
  .innerJoin(
    knex.raw('(SELECT string_agg(Plat."Q7", \', \') as Platforms, Plat."SurveyNumber" FROM public."Platform" Plat group by Plat."SurveyNumber") AS sub2'),
    'sub2.SurveyNumber',
    's.SurveyNumber'
  )
  .innerJoin(
    knex.raw('(SELECT "Q8", "Q8INT" FROM public."Q8" Plat) AS sub3'),
    'sub3.Q8INT',
    's.Q8'
  )
  .select('*').from('Survey AS s')
  .where('s.SurveyNumber', selectedSurvey)
  .then(survey => {
    console.log("I work", survey)
    res.render("data", { mysurvey: survey });
});
console.log(selectedSurvey);''
})

app.get("/data", checkAuthenticated, (req, res) => {
knex('Survey AS s')
  .innerJoin(
    knex.raw('(SELECT string_agg(org."Q5", \', \') as Organizations, org."SurveyNumber" FROM public."Organization" org group by org."SurveyNumber") AS sub1'),
    'sub1.SurveyNumber',
    's.SurveyNumber'
  )
  .innerJoin(
    knex.raw('(SELECT string_agg(Plat."Q7", \', \') as Platforms, Plat."SurveyNumber" FROM public."Platform" Plat group by Plat."SurveyNumber") AS sub2'),
    'sub2.SurveyNumber',
    's.SurveyNumber'
  )
  .innerJoin(
    knex.raw('(SELECT "Q8", "Q8INT" FROM public."Q8" Plat) AS sub3'),
    'sub3.Q8INT',
    's.Q8'
  )
  .select('*').from('Survey AS s').then(survey => {
    console.log("I work", survey)
    res.render("data", { mysurvey: survey });
});
});



function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next()
    }

    res.redirect('login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('data')
    }
    next()
}
