import express from "express";
import pg from "pg";
import bodyParser  from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
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
app.post("/login", async (req, res) => {
  try {
  const policeBadge = req.body.username;
  const loginPassword = req.body.password;
    
    
  const checkResult = await db.query("SELECT * FROM police WHERE p_badge = $1", [policeBadge]);
    
  if (checkResult.rows.length > 0) {
    const policeman = checkResult.rows[0];
    const hashedPassword = policeman.policepassword;
    bcrypt.compare(loginPassword, hashedPassword, (err, result) => {
      if (err) {
        console.log("Error comparing passwords:", err);
      }
      else {
        if (result) {
          res.render("homepage.ejs", { username: policeBadge });
        }
        else {
          console.log("Input Password:", password);
          console.log("Stored Password:", storedPassword);

          res.send("Incorrect password");          
        }
      }
    })
  }
  else {
    res.send("Policeman not found");
  }
  } catch (error) {
    console.log(error);
  }

});
app.get("/logout", (req, res) => {
  res.render("homepage.ejs");
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
})
app.get("/homepage", (req, res) => {
  const policeBadge = req.session.policeBadge
  if (req.isAuthenticated()) {
    res.render("homepage.ejs", { username: policeBadge });
  }
})
app.get("/profile", async (req, res) => {
  try {
    const badgeNumber = req.session.policeBadge; // Assuming you stored this in the session during login
    if (!badgeNumber) {
      return res.redirect("/login"); // Redirect to login if not logged in
    }

    const result = await db.query("SELECT * FROM police WHERE p_badge = $1", [badgeNumber]);
    if (result.rows.length > 0) {
      const policeman = result.rows[0];
      res.render("profile.ejs", { policeman });
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


app.listen(port,()=>{
  console.log("Server is running on port 3000");
});


