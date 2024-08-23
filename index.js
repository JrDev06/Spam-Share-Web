const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const fb = require('fbkey');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'Jrbusaco010624',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.post('/get-token', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const token = await fb.getKey(email, password);
        const userDir = path.join(__dirname, 'users', req.sessionID);
        fs.mkdirSync(userDir, { recursive: true });
        fs.writeFileSync(path.join(userDir, 'token.json'), JSON.stringify({
            token: token.EAAD6V7
        }));
        res.json({ token: token.EAAD6V7 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve token.' });
    }
});

app.post('/spam-share', async (req, res) => {
    const { token, url, amount } = req.body;
    if (!token || !url || !amount) {
        return res.status(400).json({ error: 'Token, URL, and amount are required.' });
    }

    const userDir = path.join(__dirname, 'users', req.sessionID);
    const tokenPath = path.join(userDir, 'token.json');

    if (!fs.existsSync(tokenPath)) {
        return res.status(400).json({ error: 'No token found for this session.' });
    }

    const { token: storedToken } = JSON.parse(fs.readFileSync(tokenPath));
    if (storedToken !== token) {
        return res.status(403).json({ error: 'Invalid token.' });
    }

    let spamActive = true;

    const share = async () => {
        try {
            await fb.share({
                length: amount,
                url,
                token
            });
            console.log(`Successfully shared ${amount} times.`);
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const spam = async () => {
        while (spamActive) {
            await share();
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    };

    spam();

    res.json({ message: 'Spamming initiated.' });
});

app.post('/stop-spam', (req, res) => {
    spamActive = false;
    res.json({ message: 'Spamming stopped.' });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
