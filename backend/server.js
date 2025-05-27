/**
 * Backend Server for Anime Task Tracker
 * Handles timezone-based task reset and data persistence
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const USERS = ['kioma', 'takitsu'];

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize user data if not exists
USERS.forEach(user => {
    const userDataPath = path.join(DATA_DIR, `${user}.json`);
    if (!fs.existsSync(userDataPath)) {
        const initialData = {
            tasks: [],
            streak: 0,
            lastCompleted: null,
            timezone: null
        };
        fs.writeFileSync(userDataPath, JSON.stringify(initialData, null, 2));
    }
});

/**
 * Get user data
 * @param {string} username - User identifier
 * @returns {Object} User data object
 */
function getUserData(username) {
    const userDataPath = path.join(DATA_DIR, `${username}.json`);
    const data = fs.readFileSync(userDataPath, 'utf8');
    return JSON.parse(data);
}

/**
 * Save user data
 * @param {string} username - User identifier
 * @param {Object} data - User data to save
 */
function saveUserData(username, data) {
    const userDataPath = path.join(DATA_DIR, `${username}.json`);
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

// API Routes

// Get user data
app.get('/api/:user', (req, res) => {
    try {
        const { user } = req.params;
        
        if (!USERS.includes(user)) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = getUserData(user);
        
        // Check if tasks need to be reset
        if (userData.timezone) {
            const now = DateTime.now().setZone(userData.timezone);
            const today = now.toISODate();
            
            // If last reset date is different from today, reset tasks
            if (userData.lastReset !== today) {
                // Reset all tasks
                userData.tasks.forEach(task => {
                    task.completed = false;
                });
                
                // Update last reset date
                userData.lastReset = today;
                
                // Check if streak needs to be reset
                if (userData.lastCompleted) {
                    const lastCompleted = DateTime.fromISO(userData.lastCompleted);
                    const diffDays = now.diff(lastCompleted, 'days').days;
                    
                    // If more than 1 day passed without completion, reset streak
                    if (diffDays > 1) {
                        userData.streak = 0;
                    }
                }
                
                // Save updated data
                saveUserData(user, userData);
            }
        }
        
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user data
app.post('/api/:user', (req, res) => {
    try {
        const { user } = req.params;
        const updates = req.body;
        
        if (!USERS.includes(user)) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = getUserData(user);
        
        // Update user data with request body
        Object.assign(userData, updates);
        
        // Save updated data
        saveUserData(user, userData);
        
        res.json({ success: true, data: userData });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Set timezone
app.post('/api/:user/timezone', (req, res) => {
    try {
        const { user } = req.params;
        const { timezone } = req.body;
        
        if (!USERS.includes(user)) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!timezone) {
            return res.status(400).json({ error: 'Timezone is required' });
        }
        
        const userData = getUserData(user);
        
        // Update timezone
        userData.timezone = timezone;
        
        // Initialize last reset date
        const now = DateTime.now().setZone(timezone);
        userData.lastReset = now.toISODate();
        
        // Save updated data
        saveUserData(user, userData);
        
        res.json({ success: true, timezone });
    } catch (error) {
        console.error('Error setting timezone:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task completion
app.post('/api/:user/tasks', (req, res) => {
    try {
        const { user } = req.params;
        const { tasks, allCompleted } = req.body;
        
        if (!USERS.includes(user)) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = getUserData(user);
        
        // Update tasks
        userData.tasks = tasks;
        
        // Check if all tasks were just completed
        if (allCompleted && userData.timezone) {
            const now = DateTime.now().setZone(userData.timezone);
            const today = now.toISODate();
            
            // If not already completed today
            if (userData.lastCompleted !== today) {
                // Increment streak
                userData.streak += 1;
                userData.lastCompleted = today;
            }
        }
        
        // Save updated data
        saveUserData(user, userData);
        
        res.json({ success: true, data: userData });
    } catch (error) {
        console.error('Error updating tasks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
});

/**
 * Scheduled task to reset tasks at midnight in each user's timezone
 * Runs every minute to check if tasks need to be reset
 */
setInterval(() => {
    USERS.forEach(user => {
        try {
            const userData = getUserData(user);
            
            // Skip if no timezone set
            if (!userData.timezone) return;
            
            const now = DateTime.now().setZone(userData.timezone);
            const today = now.toISODate();
            
            // If last reset date is different from today, reset tasks
            if (userData.lastReset !== today) {
                console.log(`Resetting tasks for ${user} at ${now.toISO()}`);
                
                // Reset all tasks
                userData.tasks.forEach(task => {
                    task.completed = false;
                });
                
                // Update last reset date
                userData.lastReset = today;
                
                // Check if streak needs to be reset (if tasks weren't completed yesterday)
                if (userData.lastCompleted) {
                    const lastCompleted = DateTime.fromISO(userData.lastCompleted);
                    const diffDays = now.diff(lastCompleted, 'days').days;
                    
                    // If more than 1 day passed without completion, reset streak
                    if (diffDays > 1) {
                        console.log(`Resetting streak for ${user} - no completion for ${diffDays} days`);
                        userData.streak = 0;
                    }
                }
                
                // Save updated data
                saveUserData(user, userData);
            }
        } catch (error) {
            console.error(`Error processing task reset for ${user}:`, error);
        }
    });
}, 60000); // Check every minute
