const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
const path = require("path"); // ✅ Add this at the top


// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes to serve HTML pages
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Saumya123",
    database: "roadspace_db"  // Make sure this database exists!
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: ", err);
    } else {
        console.log("Connected to MySQL database");
    }
});
app.post("/signup", async (req, res) => {
    const { username, password, phone, emergency } = req.body;

    // Ensure all required fields are present
    if (!username || !password || !phone || !emergency) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // Check if username already exists
        const checkQuery = "SELECT * FROM users WHERE username = ?";
        db.query(checkQuery, [username], async (err, results) => {
            if (err) {
                console.error("Database Error:", err.sqlMessage || err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: "Username already taken" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const insertQuery = "INSERT INTO users (username, password, phone, emergency) VALUES (?, ?, ?, ?)";
            db.query(insertQuery, [username, hashedPassword, phone, emergency], (err, result) => {
                if (err) {
                    console.error("Database Error:", err.sqlMessage || err);
                    return res.status(500).json({ message: "Error registering user" });
                }
                res.status(201).json({ message: "Signup successful!" });
            });
        });
    } catch (error) {
        console.error("Error hashing password:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Ensure required fields are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
    }

    // Check if the user exists in the database
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        // If user not found
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Get user details
        const user = results[0];

        // Compare password with hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        res.json({ message: "Login successful!", userId: user.id });
    });
});


// Default Route
app.get("/", (req, res) => {
    res.send("RoadSpace Server is Running!");
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
