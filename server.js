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

// Storage Engine for Photos (unique filename per user)
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        const uniqueName = `${req.body.username || 'user'}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });

// --- USER DATABASE (In memory) ---
let users = [
    { username: "admin", password: "1234", photo: null },
    { username: "john", password: "pass123", photo: null },
    { username: "sarah", password: "hello", photo: null }
];

// --- ROUTES ---

// 1. Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ 
            success: true, 
            message: "Login successful",
            username: user.username,            photo: user.photo
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// 2. Register New User
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
    }
    
    // Create new user
    users.push({
        username: username,
        password: password,
        photo: null
    });
    
    res.json({ success: true, message: "User registered successfully!" });
});

// 3. Get All Users (Admin feature)
app.get('/users', (req, res) => {
    // Return usernames only (not passwords for security)
    const userList = users.map(u => ({ username: u.username, hasPhoto: !!u.photo }));
    res.json(userList);
});

// 4. Update User Info (Photo + Credentials)
app.post('/update', upload.single('photo'), (req, res) => {
    const { username, password, newUsername, newPassword } = req.body;
    
    // Find the user
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Update credentials if provided
    if (newUsername) {
        // Check if new username is taken
        const existingUser = users.find(u => u.username === newUsername && u.username !== username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already taken" });        }
        users[userIndex].username = newUsername;
    }
    
    if (newPassword) {
        users[userIndex].password = newPassword;
    }
    
    // Update photo if uploaded
    if (req.file) {
        // Delete old photo if exists
        if (users[userIndex].photo) {
            try {
                fs.unlinkSync(`./uploads/${users[userIndex].photo}`);
            } catch(e) {}
        }
        users[userIndex].photo = req.file.filename;
    }
    
    res.json({ 
        success: true, 
        message: "Profile updated!",
        username: users[userIndex].username,
        photo: users[userIndex].photo
    });
});

// 5. Delete User (Admin feature)
app.delete('/user/:username', (req, res) => {
    const { username } = req.params;
    
    // Prevent deleting last user
    if (users.length <= 1) {
        return res.status(400).json({ success: false, message: "Cannot delete last user" });
    }
    
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Delete photo file if exists
    if (users[userIndex].photo) {
        try {
            fs.unlinkSync(`./uploads/${users[userIndex].photo}`);
        } catch(e) {}
    }
    
    users.splice(userIndex, 1);
    res.json({ success: true, message: "User deleted" });});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
