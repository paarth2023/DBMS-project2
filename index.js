import express from "express";
import pg from "pg";
import bodyParser  from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
const port = 3000;
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true
  })
);
//really important for the passport section to be below session
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "crimedb",
  password: "2023300132",
  port: "5432"
});
db.connect();
const saltRounds = 10;
app.get("/",(req,res)=>{
  res.render("homepage.ejs");
});
app.get("/login", (req, res) => {
  res.render("partials/login.ejs");
});
app.post("/login", passport.authenticate("local", {
  successRedirect: "/homepage",
  failureRedirect: "/login"
}));
app.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("An error occurred while logging out.");
    }

    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("An error occurred while ending the session.");
      }
      
      // Redirect to the homepage or login page
      res.redirect("/");
    });
  });
});
app.get("/about", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("about.ejs",{username: req.user.p_badge});
  }
  else {
    res.render("about.ejs");
  }
})
app.get("/homepage", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("homepage.ejs", { username: req.user.p_badge });
  } else {
    res.redirect("/login");
  }
});

app.get("/profile", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login"); // Redirect to login if not logged in
    }

    const badgeNumber = req.user.p_badge; // Use req.user for the authenticated user's badge number
    const result = await db.query("SELECT * FROM police WHERE p_badge = $1", [badgeNumber]);
    
    if (result.rows.length > 0) {
      const policeman = result.rows[0];
      res.render("profile.ejs", { policeman, username:req.user.p_badge });
    } else {
      res.send("Policeman not found.");
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("An error occurred while fetching the profile.");
  }
});


app.get("/register", (req, res) => {
  res.render("register.ejs");
})
app.post("/register", async (req, res) => {
  const badgeNumber = req.body.username;
  const password = req.body.password;
  const age = req.body.age;
  const name = req.body.name;
  try {
    const checkResult = await db.query("SELECT * FROM police WHERE p_badge = $1", [badgeNumber]);
    if (checkResult.rows.length > 0) {
      console.log("Police wala hei already");
    }
    else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Error hashing password", err);
        }
        else {
          const result = db.query(
            "INSERT INTO police (p_badge,age,policeName,policePassword) VALUES ($1,$2,$3,$4)", [badgeNumber, age, name, hash]
          );
        }
      });
    }

  }
  catch (err) {
    console.log(err);
  }
});
app.get("/mycases", async (req, res) => {
  try {
    // Extract filters from the query string
    const { status, startDate, endDate, badge } = req.query;

    // Build the SQL query dynamically based on provided filters
    let query = "SELECT * FROM complaint WHERE 1=1";
    const queryParams = [];

    if (status) {
      query += " AND status = $1";
      queryParams.push(status);
    }
    if (startDate) {
      query += ` AND date_of_complaint >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ` AND date_of_complaint <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }
    if (badge) {
      query += ` AND badge_of_assigned_police = $${queryParams.length + 1}`;
      queryParams.push(badge);
    }

    // Query the database
    const result = await db.query(query, queryParams);

    // Render the page with the filtered results
    res.render("mycases.ejs", { cases: result.rows, username: req.user.p_badge });
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).send("An error occurred while fetching cases.");
  }
});


passport.use(new Strategy(async function verify(username, password, cb) {
  try {
    const checkResult = await db.query("SELECT * FROM police WHERE p_badge = $1", [username]);
    
    if (checkResult.rows.length > 0) {
      const policeman = checkResult.rows[0];
      const hashedPassword = policeman.policepassword;
      bcrypt.compare(password, hashedPassword, (err, result) => {
        if (err) {
          return cb(err);
        }
        else {
          if (result) {
            return cb(null, policeman);
          }
          else {
            return cb(null, false);
          }
        }
      })
    }
    else {
      return cb("User not found");
    }
  } catch (error) {
    cb(error);
  }
  
}));
app.get("/submit-complaint", (req, res) => {
  res.render("lodging.ejs", { username: req.user.p_badge });
})
app.post("/submit-complaint", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login"); // Ensure only logged-in users can submit complaints
    }

    const { complaint_id, address, date_of_complaint, description, status } = req.body;
    const badge_of_assigned_police = req.user.p_badge;
    // Store the values in the session
    req.session.complaint = {
      complaint_id,
      address,
      date_of_complaint,
      description,
      status,
      badge_of_assigned_police,
    };

    // Insert the values into the database
    await db.query(
      "INSERT INTO complaint (placeholder, address, date_of_complaint, description, status, badge_of_assigned_police) VALUES ($1, $2, $3, $4, $5, $6)",
      [complaint_id, address, date_of_complaint, description, status, badge_of_assigned_police]
    );

    // Redirect to a success page or display success message
    res.redirect("/complaint-success");
  } catch (error) {
      console.error("Error submitting complaint:", error);
    // Redirect to error page with error message
      res.redirect(`/complaint-unsuccessful?error=${encodeURIComponent(error.message)}`);
  }
});
app.get("/complaint-success", (req, res) => {
  res.render("complaint-success.ejs",{username : req.user.p_badge});
});
app.get("/complaint-unsuccessful", (req, res) => {
  const error = req.query.error || "Unknown error occurred.";
  res.render("complaint-unsuccessful.ejs", { error, username:req.user.p_badge });
});

passport.serializeUser((user, cb) => {
  cb(null, user.p_badge); // Serialize only the badge number
});

passport.deserializeUser(async (badgeNumber, cb) => {
  try {
    const result = await db.query("SELECT * FROM police WHERE p_badge = $1", [badgeNumber]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]); // Attach the full user object
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
});

app.listen(port,()=>{
  console.log("Server is running on port 3000");
});


