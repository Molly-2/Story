const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;

// File for storing posts
const POSTS_FILE = './posts.json';

// Load posts from file
let posts = [];
if (fs.existsSync(POSTS_FILE)) {
    try {
        posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    } catch (error) {
        console.error('Error reading posts file:', error);
    }
}

// Middleware to serve HTML file and handle form data
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Handle form submission
app.post('/post', (req, res) => {
    const { name, title, content } = req.body;
    const newPost = { name, title, content, date: new Date().toLocaleString() };
    posts.push(newPost);

    // Save updated posts to file
    try {
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    } catch (error) {
        console.error('Error writing posts file:', error);
        return res.status(500).send('Internal Server Error');
    }

    // Emit the new post to all connected clients
    io.emit('new_post', newPost);

    res.redirect('/');
});

// Get posts (optionally with search query)
app.get('/posts', (req, res) => {
    const search = req.query.search?.toLowerCase();
    const filteredPosts = search
        ? posts.filter(post =>
            post.title.toLowerCase().includes(search) ||
            post.content.toLowerCase().includes(search))
        : posts;
    res.json(filteredPosts);
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
