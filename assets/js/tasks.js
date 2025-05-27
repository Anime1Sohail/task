/**
 * Tasks JavaScript for Anime Task Tracker
 * Handles task management, streak tracking, and timezone functions
 * Optimized for performance on mobile devices
 */

// Global variables for app state
let userTimezone = null;
let userStreak = 0;
let tasksCompleted = false;
let lastCompletedDate = null;
let username = null;

// Cache DOM elements to avoid repeated querySelector calls
const domCache = {};

// Audio elements cache
const audioCache = {};

/**
 * Initialize user page with specific user data
 * @param {string} user - Username (kioma or takitsu)
 */
function initUserPage(user) {
    // Set global username
    username = user;
    
    // Cache frequently accessed DOM elements
    cacheDOMElements();
    
    // Load user data from storage
    loadUserData();
    
    // Defer non-critical initializations
    requestAnimationFrame(() => {
        // Initialize UI components
        initTimezoneSelector();
        initTaskCheckboxes();
        
        // Update streak display
        updateStreakDisplay();
        
        // Check for streak reset at midnight
        checkForStreakReset();
        
        // Schedule next streak check at midnight
        scheduleNextMidnightCheck();
    });
    
    // Defer chibi assistant initialization to improve initial load performance
    setTimeout(() => {
        initChibiAssistant();
    }, 300);
}

/**
 * Cache DOM elements for better performance
 */
function cacheDOMElements() {
    // Cache frequently accessed elements
    domCache.tasksList = document.getElementById(`${username}-tasks`);
    domCache.streakElement = document.getElementById(`${username}-streak`);
    domCache.progressElement = document.getElementById(`${username}-progress`);
    domCache.messageElement = document.getElementById(`${username}-message`);
    domCache.timezoneSelector = document.getElementById('timezone-selector');
    domCache.chibiAssistant = document.getElementById(`${username}-assistant`);
    domCache.chibiSpeech = document.getElementById(`${username}-speech`);
    domCache.chibiSpeechText = document.getElementById(`${username}-speech-text`);
}

/**
 * Load user data from localStorage
 */
function loadUserData() {
    // Batch localStorage reads for better performance
    const keys = [
        `${username}_timezone`,
        `${username}_streak`,
        `${username}_lastCompleted`
    ];
    
    // Get all values at once
    const values = {};
    for (const key of keys) {
        values[key] = localStorage.getItem(key);
    }
    
    // Process values
    userTimezone = values[`${username}_timezone`];
    
    const storedStreak = values[`${username}_streak`];
    if (storedStreak !== null) {
        userStreak = parseInt(storedStreak, 10);
    }
    
    lastCompletedDate = values[`${username}_lastCompleted`];
    
    // Load tasks state efficiently using the cached element
    const taskItems = domCache.tasksList.querySelectorAll('.task-item');
    const taskCount = taskItems.length;
    
    // Batch load all task states to minimize localStorage reads
    const taskKeys = Array.from({ length: taskCount }, (_, i) => `${username}_task_${i}`);
    const taskValues = {};
    
    for (const key of taskKeys) {
        taskValues[key] = localStorage.getItem(key);
    }
    
    // Apply task states
    taskItems.forEach((item, index) => {
        const checkbox = item.querySelector('.task-checkbox');
        const storedState = taskValues[`${username}_task_${index}`];
        
        if (storedState === 'true') {
            checkbox.checked = true;
        }
    });
    
    // Check if all tasks are completed
    checkTasksCompletion();
    
    // Hide timezone selector if already set - use cached element
    if (userTimezone) {
        domCache.timezoneSelector.style.display = 'none';
    }
}

/**
 * Initialize timezone selector
 */
function initTimezoneSelector() {
    const saveButton = document.getElementById('save-timezone');
    
    saveButton.addEventListener('click', () => {
        const select = document.getElementById('country-select');
        userTimezone = select.value;
        
        // Save timezone to localStorage
        localStorage.setItem(`${username}_timezone`, userTimezone);
        
        // Hide timezone selector
        document.getElementById('timezone-selector').style.display = 'none';
        
        // Show notification
        window.animeAnimations.showNotification('Timezone saved successfully!', 'success');
        
        // Schedule next streak check
        scheduleNextMidnightCheck();
    });
}

/**
 * Load and cache audio files for better performance
 */
function preloadAudio() {
    if (!audioCache.check) {
        audioCache.check = new Audio('assets/audio/check.mp3');
        audioCache.check.volume = 0.3;
        audioCache.check.load();
    }
    return audioCache.check;
}

/**
 * Initialize task checkboxes with event listeners
 */
function initTaskCheckboxes() {
    const checkboxes = domCache.tasksList.querySelectorAll('.task-checkbox');
    
    // Use event delegation for better performance
    domCache.tasksList.addEventListener('change', (event) => {
        const checkbox = event.target;
        if (checkbox.classList.contains('task-checkbox')) {
            // Get the index from the parent li's position
            const taskItem = checkbox.closest('.task-item');
            const index = Array.from(domCache.tasksList.children).indexOf(taskItem);
            
            // Play sound effect when checked - use cached audio
            if (checkbox.checked) {
                const checkSound = preloadAudio();
                if (checkSound.paused) {
                    checkSound.currentTime = 0;
                    checkSound.play().catch(err => console.log('Audio play error:', err));
                }
            }
            
            // Save task state to localStorage
            localStorage.setItem(`${username}_task_${index}`, checkbox.checked);
            
            // Debounce task completion check for performance
            if (window.taskCompletionTimer) {
                clearTimeout(window.taskCompletionTimer);
            }
            
            window.taskCompletionTimer = setTimeout(() => {
                // Check if all tasks are completed
                checkTasksCompletion();
                
                // Show chibi message on task completion
                if (checkbox.checked) {
                    showRandomChibiMessage(true);
                }
            }, 100);
        }
    }, { passive: true });
}

/**
 * Check if all tasks are completed and update state
 */
function checkTasksCompletion() {
    const checkboxes = domCache.tasksList.querySelectorAll('.task-checkbox');
    
    // Check if all tasks are checked - more optimized approach
    let allCompleted = true;
    for (let i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) {
            allCompleted = false;
            break;
        }
    }
    
    if (allCompleted && !tasksCompleted) {
        // All tasks just completed
        tasksCompleted = true;
        
        // Get current date in user's timezone
        const today = getCurrentDateInUserTimezone();
        
        // Batch localStorage operations for better performance
        const updateStorage = () => {
            // Save completion date
            localStorage.setItem(`${username}_lastCompleted`, today);
            lastCompletedDate = today;
            
            // Increment streak if not already completed today
            if (lastCompletedDate !== today) {
                userStreak++;
                localStorage.setItem(`${username}_streak`, userStreak);
                
                // Update streak display with animation
                requestAnimationFrame(() => {
                    updateStreakDisplay();
                });
                
                // Show celebration animation with slight delay
                setTimeout(() => {
                    celebrateCompletion();
                }, 100);
            }
        };
        
        // Use requestIdleCallback if available, otherwise use setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(updateStorage);
        } else {
            setTimeout(updateStorage, 50);
        }
    } else {
        tasksCompleted = allCompleted;
    }
}

/**
 * Update streak display with animations
 */
function updateStreakDisplay() {
    // Use cached DOM elements
    const streakElement = domCache.streakElement;
    const progressElement = domCache.progressElement;
    const messageElement = domCache.messageElement;
    
    // Animate streak counter with RAF for better performance
    requestAnimationFrame(() => {
        window.animeAnimations.animateStreakCounter(streakElement, userStreak);
    });
    
    // Calculate progress with lower CPU usage
    const progressPercent = Math.min((userStreak / 30) * 100, 100);
    
    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
        // Use transform for better performance (GPU acceleration)
        progressElement.style.transform = `scaleX(${progressPercent/100})`;
        progressElement.style.transformOrigin = 'left';
        
        // Only update text content if it's changed
        let newMessage;
        if (userStreak === 0) {
            newMessage = 'Do your best!';
        } else if (userStreak < 3) {
            newMessage = 'Great start!';
        } else if (userStreak < 7) {
            newMessage = 'You\'re keeping it up well!';
        } else if (userStreak < 14) {
            newMessage = 'More than a week! Amazing!';
        } else if (userStreak < 30) {
            newMessage = 'You are truly wonderful!';
        } else {
            newMessage = 'Legendary level achieved!';
        }
        
        if (messageElement.textContent !== newMessage) {
            messageElement.textContent = newMessage;
        }
    });
}

/**
 * Initialize chibi assistant
 */
function initChibiAssistant() {
    const chibi = document.getElementById(`${username}-assistant`);
    const chibiImg = chibi.querySelector('.chibi-img');
    const speechBubble = document.getElementById(`${username}-speech`);
    
    // Show random message on click
    chibiImg.addEventListener('click', () => {
        if (speechBubble.classList.contains('hidden')) {
            showRandomChibiMessage();
        } else {
            speechBubble.classList.add('hidden');
        }
    });
    
    // Hide speech bubble when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!chibi.contains(e.target) && !speechBubble.classList.contains('hidden')) {
            speechBubble.classList.add('hidden');
        }
    });
    
    // Show welcome message on load with slight delay
    setTimeout(() => {
        showRandomChibiMessage(false, true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            speechBubble.classList.add('hidden');
        }, 5000);
    }, 1500);
}

/**
 * Show random chibi assistant message
 * @param {boolean} isTaskComplete - Whether the message is for task completion
 * @param {boolean} isWelcome - Whether this is a welcome message
 */
function showRandomChibiMessage(isTaskComplete = false, isWelcome = false) {
    const speechBubble = document.getElementById(`${username}-speech`);
    const speechText = document.getElementById(`${username}-speech-text`);
    
    let messages = [];
    
    if (isWelcome) {
        messages = [
            `Welcome back, ${username.charAt(0).toUpperCase() + username.slice(1)}! Ready for today's tasks?`,
            `こんにちは！ Today is a new opportunity!`,
            `I missed you! Let's make today productive!`
        ];
    } else if (isTaskComplete) {
        messages = [
            'Great job completing that task!',
            'You\'re making excellent progress!',
            'Keep it up, you\'re doing amazing!',
            'One step closer to your goals!',
            'Well done!'
        ];
    } else {
        messages = [
            'Need some motivation? You can do it!',
            'Remember, consistency is key!',
            'Every task completed is a victory!',
            'Do your best!',
            'I believe in you!',
            `Your streak is at ${userStreak} days. Amazing!`,
            'Take a deep breath if you need to!',
            'You\'re stronger than you think!',
            'One task at a time, you got this!'
        ];
    }
    
    // Select random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Update speech bubble
    speechText.textContent = randomMessage;
    speechBubble.classList.remove('hidden');
    
    // Add pop sound
    const popSound = new Audio('assets/audio/pop.mp3');
    popSound.volume = 0.2;
    popSound.play().catch(err => console.log('Audio play error:', err));
}

/**
 * Get current date string in user's timezone
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getCurrentDateInUserTimezone() {
    // Use Luxon to handle timezone conversion
    const DateTime = luxon.DateTime;
    
    // Default to local timezone if user timezone not set
    if (!userTimezone) {
        return DateTime.local().toFormat('yyyy-MM-dd');
    }
    
    // Convert to user's timezone
    return DateTime.local().setZone(userTimezone).toFormat('yyyy-MM-dd');
}

/**
 * Check if streak should be reset at midnight
 */
function checkForStreakReset() {
    // Skip if timezone not set
    if (!userTimezone) return;
    
    const today = getCurrentDateInUserTimezone();
    const storedDate = localStorage.getItem(`${username}_lastCheck`);
    
    // If we haven't checked today yet
    if (storedDate !== today) {
        // Store that we checked today
        localStorage.setItem(`${username}_lastCheck`, today);
        
        // If we completed all tasks yesterday
        if (tasksCompleted && lastCompletedDate) {
            // Great! Streak continues
        } else if (userStreak > 0) {
            // Break streak animation
            userStreak = 0;
            localStorage.setItem(`${username}_streak`, 0);
            updateStreakDisplay();
            window.animeAnimations.showStreakBreakAnimation();
        }
        
        // Reset tasks at midnight
        resetTasks();
    }
}

/**
 * Reset all tasks at midnight
 */
function resetTasks() {
    const tasksList = document.getElementById(`${username}-tasks`);
    const checkboxes = tasksList.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = false;
        localStorage.setItem(`${username}_task_${index}`, false);
    });
    
    tasksCompleted = false;
}

/**
 * Schedule next check at midnight in user's timezone
 */
function scheduleNextMidnightCheck() {
    // Skip if timezone not set
    if (!userTimezone) return;
    
    const DateTime = luxon.DateTime;
    
    // Get current time in user's timezone
    const now = DateTime.local().setZone(userTimezone);
    
    // Calculate next midnight
    const nextMidnight = now.plus({ days: 1 }).startOf('day');
    
    // Calculate milliseconds until next midnight
    const millisUntilMidnight = nextMidnight.diff(now).milliseconds;
    
    // Schedule task reset and streak check
    setTimeout(() => {
        checkForStreakReset();
        scheduleNextMidnightCheck(); // Schedule next day's check
    }, millisUntilMidnight);
    
    console.log(`Next check scheduled in ${Math.floor(millisUntilMidnight / 1000 / 60)} minutes`);
}

/**
 * Celebrate task completion with animations and sounds
 */
function celebrateCompletion() {
    // Play celebration sound
    const celebrationSound = new Audio('assets/audio/complete.mp3');
    celebrationSound.volume = 0.4;
    celebrationSound.play().catch(err => console.log('Audio play error:', err));
    
    // Show celebration notification
    window.animeAnimations.showNotification('🎉 All tasks completed! Streak +1', 'success');
    
    // Add sparkle effect to the streak counter
    const streakElement = document.getElementById(`${username}-streak`);
    streakElement.classList.add('celebrating');
    
    // Trigger chibi celebration message
    setTimeout(() => {
        const messages = [
            'Fantastic! You completed all tasks today!',
            `Your streak is now ${userStreak} days! Amazing!`,
            '完璧です！(Perfect!) You did it all!',
            'So proud of you for finishing everything!'
        ];
        
        const speechBubble = document.getElementById(`${username}-speech`);
        const speechText = document.getElementById(`${username}-speech-text`);
        
        // Select random message
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Update speech bubble
        speechText.textContent = randomMessage;
        speechBubble.classList.remove('hidden');
    }, 1000);
    
    // Remove celebration class after animation
    setTimeout(() => {
        streakElement.classList.remove('celebrating');
    }, 3000);
}
