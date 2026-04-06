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

// --- SINGLE USER DATA ---
let user = {
    username: "admin",
    password: "1234",
    photo: null,
    message: "Welcome to my page!"
};

// --- ROUTES ---

// 1. Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        res.json({ 
            success: true, 
            username: user.username,
            photo: user.photo,
            message: user.message
        });    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// 2. Get User Data
app.get('/user', (req, res) => {
    res.json({
        username: user.username,
        photo: user.photo,
        message: user.message
    });
});

// 3. Update Username & Password
app.post('/update-credentials', (req, res) => {
    const { username, password, newUsername, newPassword } = req.body;
    
    // Verify current password
    if (password !== user.password) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    
    if (newUsername) user.username = newUsername;
    if (newPassword) user.password = newPassword;
    
    res.json({ 
        success: true, 
        message: "Credentials updated!",
        username: user.username
    });
});

// 4. Upload/Update Photo
app.post('/upload-photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No photo uploaded" });
    }
    
    // Delete old photo if exists
    if (user.photo) {
        try {
            fs.unlinkSync(`./uploads/${user.photo}`);
        } catch(e) {}
    }
    
    user.photo = req.file.filename;
    
    res.json({ 
        success: true,         message: "Photo uploaded!",
        photo: user.photo
    });
});

// 5. Delete Photo
app.delete('/delete-photo', (req, res) => {
    if (user.photo) {
        try {
            fs.unlinkSync(`./uploads/${user.photo}`);
        } catch(e) {}
        user.photo = null;
    }
    
    res.json({ success: true, message: "Photo deleted!" });
});

// 6. Update Message
app.post('/update-message', (req, res) => {
    const { message } = req.body;
    user.message = message || '';
    
    res.json({ 
        success: true, 
        message: "Message updated!",
        message: user.message
    });
});

// 7. Delete Message
app.delete('/delete-message', (req, res) => {
    user.message = '';
    res.json({ success: true, message: "Message deleted!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
