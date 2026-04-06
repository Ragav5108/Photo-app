const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves the HTML file
app.use('/uploads', express.static('uploads')); // Serves the images

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Storage Engine for Photos
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, 'profile.jpg'); // Always overwrite with the name profile.jpg
    }
});
const upload = multer({ storage: storage });

// --- MOCK DATABASE (In memory for simplicity) ---
// In a real app, you would use MongoDB or SQL here.
let user = {
    username: "admin",
    password: "1234", // In a real app, never store plain text passwords!
    hasPhoto: false
};

// --- ROUTES ---

// 1. Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// 2. Get Current User Data
app.get('/user', (req, res) => {
    res.json({
        username: user.username,
        photoUrl: user.hasPhoto ? '/uploads/profile.jpg' : null
    });
});

// 3. Update User Info (Photo + Credentials)
app.post('/update', upload.single('photo'), (req, res) => {
    const { username, password } = req.body;
    
    // Update text fields if provided
    if (username) user.username = username;
    if (password) user.password = password;
    
    // Check if a photo was uploaded
    if (req.file) {
        user.hasPhoto = true;
    }

    res.json({ success: true, message: "Profile updated!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
