const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Storage Engine for Photos
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, 'profile_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- SINGLE USER ---
let user = {
    username: "myaccount",
    password: "1234",
    photo: null,
    bio: "Welcome to my profile 📸"
};

// --- ROUTES ---

// 1. Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        res.json({ 
            success: true, 
            message: "Login successful",
            username: user.username,
            photo: user.photo,
            bio: user.bio
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// 2. Get User Data
app.get('/user', (req, res) => {
    res.json({
        username: user.username,
        photo: user.photo,
        bio: user.bio
    });
});

// 3. Update User Info
app.post('/update', upload.single('photo'), (req, res) => {
    const { username, password, bio } = req.body;
    
    if (username) user.username = username;
    if (password) user.password = password;
    if (bio) user.bio = bio;
    
    if (req.file) {
        // Delete old photo if exists
        if (user.photo) {
            try {
                fs.unlinkSync(`./uploads/${user.photo}`);
            } catch(e) {}
        }
        user.photo = req.file.filename;
    }
    
    res.json({ 
        success: true, 
        message: "Profile updated!",
        username: user.username,
        photo: user.photo,
        bio: user.bio
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
