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
        cb(null, 'post_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- SINGLE USER WITH POSTS ---
let user = {
    username: "myaccount",
    password: "1234",
    photo: null,
    bio: "Welcome to my profile 📸"
};

let posts = []; // Array to store posts with messages

// --- ROUTES ---

// 1. Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        res.json({ 
            success: true, 
            message: "Login successful",
            username: user.username,            photo: user.photo,
            bio: user.bio,
            posts: posts
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
        bio: user.bio,
        posts: posts
    });
});

// 3. Update Profile Info
app.post('/update-profile', upload.single('photo'), (req, res) => {
    const { username, password, bio } = req.body;
    
    if (username) user.username = username;
    if (password) user.password = password;
    if (bio) user.bio = bio;
    
    if (req.file) {
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

// 4. Create New Post with Message
app.post('/create-post', upload.single('photo'), (req, res) => {
    const { message } = req.body;
    
    if (!req.file) {        return res.status(400).json({ success: false, message: "Photo is required" });
    }
    
    const newPost = {
        id: Date.now(),
        photo: req.file.filename,
        message: message || '',
        likes: 0,
        createdAt: new Date().toISOString()
    };
    
    posts.unshift(newPost); // Add to beginning of array
    
    res.json({ 
        success: true, 
        message: "Post created!",
        post: newPost
    });
});

// 5. Update Post Message
app.put('/post/:id', (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    
    const post = posts.find(p => p.id == id);
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }
    
    post.message = message;
    
    res.json({ 
        success: true, 
        message: "Post updated!",
        post: post
    });
});

// 6. Delete Post
app.delete('/post/:id', (req, res) => {
    const { id } = req.params;
    
    const postIndex = posts.findIndex(p => p.id == id);
    if (postIndex === -1) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }
    
    // Delete photo file
    try {        fs.unlinkSync(`./uploads/${posts[postIndex].photo}`);
    } catch(e) {}
    
    posts.splice(postIndex, 1);
    
    res.json({ success: true, message: "Post deleted" });
});

// 7. Like Post
app.post('/post/:id/like', (req, res) => {
    const { id } = req.params;
    
    const post = posts.find(p => p.id == id);
    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }
    
    post.likes = (post.likes || 0) + 1;
    
    res.json({ success: true, likes: post.likes });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
