/**
 * Main JavaScript for Task Mission
 * Handles landing page functionality and initialization
 * With optimized performance for mobile devices
 */

// Cached DOM elements for better performance
const domCache = {};

// Define constants to avoid string repetition
const KIOMA_DATA_KEY = 'kioma-data';
const TAKITSU_DATA_KEY = 'takitsu-data';
const THEME_PREFERENCE_KEY = 'theme-preference';

// Use passive event listeners for better performance
document.addEventListener('DOMContentLoaded', () => {
    // Immediate critical initializations
    preloadCriticalElements();
    
    // Deferred initialization for better performance
    window.requestIdleCallback ? 
        window.requestIdleCallback(initializeApp) : 
        requestAnimationFrame(initializeApp);
});

/**
 * Preload critical elements by caching them
 */
function preloadCriticalElements() {
    // Preload and cache common DOM elements
    const elementsToCache = [
        'particles-js', 
        'kioma-home-streak', 
        'takitsu-home-streak'
    ];
    
    elementsToCache.forEach(id => {
        const element = document.getElementById(id);
        if (element) domCache[id] = element;
    });
}

/**
 * Initialize the application features based on priority
 */
function initializeApp() {
    // Initialize core features with priority scheduling
    initParticles();
    
    // Load user streaks on the main page - high priority for user engagement
    if (document.querySelector('.minimal-container')) {
        loadHomeStreaks();
        observeStreakChanges();
    }
    
    // Schedule non-critical features for later
    setTimeout(() => {
        // Add sound effects to buttons - only on non-touch devices for better mobile performance
        if (!('ontouchstart' in window)) {
            addSoundEffects();
        }
        
        // Console easter egg - lowest priority
        consoleEasterEgg();
    }, 300);
};

/**
 * Initialize the particles.js background
 */
function initParticles() {
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#ffffff"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.3,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 2,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#ffffff",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.5
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });
}

/**
 * Load user streak counts for the home page with performance optimizations
 */
function loadHomeStreaks() {
    // Try to get cached elements first
    const kiomaStreakElement = domCache['kioma-home-streak'] || document.getElementById('kioma-home-streak');
    const takitsuStreakElement = domCache['takitsu-home-streak'] || document.getElementById('takitsu-home-streak');
    
    // Cache elements for future use
    if (!domCache['kioma-home-streak'] && kiomaStreakElement) domCache['kioma-home-streak'] = kiomaStreakElement;
    if (!domCache['takitsu-home-streak'] && takitsuStreakElement) domCache['takitsu-home-streak'] = takitsuStreakElement;
    
    // Only proceed if we have at least one of the elements on the page
    if (!kiomaStreakElement && !takitsuStreakElement) return;
    
    // Get streak data using separate functions for better code organization
    const userData = getLocalUserData();
    
    // Update UI elements if they exist
    if (kiomaStreakElement) {
        updateStreakUI(kiomaStreakElement, userData.kioma?.streak || 0);
    }
    
    if (takitsuStreakElement) {
        updateStreakUI(takitsuStreakElement, userData.takitsu?.streak || 0);
    }
}

/**
 * Get user data from localStorage with error handling
 */
function getLocalUserData() {
    const result = {
        kioma: null,
        takitsu: null
    };
    
    try {
        // Get Kioma's data
        const kiomaData = localStorage.getItem(KIOMA_DATA_KEY);
        if (kiomaData) {
            result.kioma = JSON.parse(kiomaData);
        }
        
        // Get Takitsu's data
        const takitsuData = localStorage.getItem(TAKITSU_DATA_KEY);
        if (takitsuData) {
            result.takitsu = JSON.parse(takitsuData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    
    return result;
}

/**
 * Update streak UI with appropriate classes and animations
 * @param {HTMLElement} streakElement - The streak element to update
 * @param {number} streakCount - The current streak count
 */
function updateStreakUI(streakElement, streakCount) {
    if (!streakElement) return;
    
    const countElement = streakElement.querySelector('.streak-count');
    if (countElement) {
        // Only update if the value has changed to avoid unnecessary repaints
        if (countElement.textContent !== streakCount.toString()) {
            countElement.textContent = streakCount;
        }
    }
    
    // Update classes for styling based on streak value
    if (streakCount > 0) {
        streakElement.classList.add('active-streak');
        
        // Add milestone classes for special streak levels
        if (streakCount >= 30) {
            streakElement.classList.add('milestone-streak');
        } else if (streakCount >= 7) {
            streakElement.classList.add('weekly-streak');
        }
    } else {
        streakElement.classList.remove('active-streak', 'weekly-streak', 'milestone-streak');
    }
}

/**
 * Observe storage changes to update streaks in real-time
 */
function observeStreakChanges() {
    window.addEventListener('storage', (event) => {
        // Only process relevant storage changes
        if (event.key === KIOMA_DATA_KEY || event.key === TAKITSU_DATA_KEY) {
            loadHomeStreaks();
        }
    });
}

/**
 * Add hover sound effects to buttons with performance optimizations
 */
function addSoundEffects() {
    // Check if audio context is supported for better performance
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        addOptimizedSoundEffects();
    } else {
        addLegacySoundEffects();
    }
}

/**
 * Add sound effects using modern AudioContext API
 */
function addOptimizedSoundEffects() {
    // Create a single shared audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    let popBuffer = null;
    
    // Get all user card elements first
    const userCards = document.querySelectorAll('.minimal-card');
    
    // Add hover visual feedback without sound for now
    userCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add a subtle visual feedback instead of sound
            card.classList.add('hover-active');
            setTimeout(() => card.classList.remove('hover-active'), 300);
        }, { passive: true });
    });
    
    // Note: Audio functionality is disabled due to missing audio files
    console.debug('Audio features disabled - resources not available');
    
    // Resume audio context on user interaction
    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true, passive: true });
}

/**
 * Play a sound with the given buffer
 */
function playSound(audioContext, buffer, volume = 0.2) {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
}

/**
 * Add sound effects using older Audio API for broader compatibility
 */
function addLegacySoundEffects() {
    // Get all user card elements
    const userCards = document.querySelectorAll('.minimal-card');
    
    // Add hover visual feedback instead of sound effects
    userCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add a subtle visual feedback instead of sound
            card.classList.add('hover-active');
            setTimeout(() => card.classList.remove('hover-active'), 300);
        }, { passive: true });
    });
    
    // Note: Audio functionality is disabled due to missing audio files
    console.debug('Legacy audio features disabled - resources not available');
}

/**
 * Add a fun console easter egg with performance metrics
 */
function consoleEasterEgg() {
    // Only run in development environment or when debugging is enabled
    // This ensures it doesn't impact performance in production
    if (localStorage.getItem('debug-mode') !== 'true' && !window.location.hostname.includes('localhost')) {
        return;
    }
    
    const styles = [
        'font-size: 20px',
        'font-family: monospace',
        'background: linear-gradient(to right, #1ce655, #4fc3f7)',
        'color: white',
        'padding: 10px 20px',
        'border-radius: 5px',
        'text-shadow: 2px 2px 0 rgba(0,0,0,0.3)'  
    ].join(';');

    console.log('%c Task Mission v2.1.0 ', styles);
    
    // Performance timing information
    if (window.performance) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        console.log(
            `📊 Performance Metrics:\n` +
            `  - Total load time: ${loadTime}ms\n` +
            `  - DOM Content Loaded: ${dcl}ms\n` +
            `  - Interactive elements cached: ${Object.keys(domCache).length}`
        );
    }
    
    // Additional welcome message
    console.log(
        "Welcome to Task Mission! Here's some tips:\n" +
        "- Complete tasks daily to build your streak\n" +
        "- Streaks reset if you miss a day\n" +
        "- The app works offline thanks to our service worker\n" +
        "- Your data is stored locally for privacy\n\n" +
        "Happy streaking! 🔥"
    );

    // Future feature preview (for curious devs who check the console)
    setTimeout(() => {
        console.log(
            "Coming soon: Task categories, customizable themes, and achievement badges!\n" +
            "Stay tuned..."
        );
    }, 2000);
}

/**
 * Check and repair any data inconsistencies
 * This helps maintain data integrity across sessions
 */
function repairUserData() {
    try {
        // Get all user data
        const users = ['kioma', 'takitsu'];
        
        users.forEach(user => {
            const storageKey = `${user}-data`;
            const userData = localStorage.getItem(storageKey);
            
            if (userData) {
                const data = JSON.parse(userData);
                let needsUpdate = false;
                
                // Ensure streak property exists
                if (typeof data.streak === 'undefined') {
                    data.streak = 0;
                    needsUpdate = true;
                }
                
                // Ensure tasks object exists
                if (!data.tasks) {
                    data.tasks = {};
                    needsUpdate = true;
                }
                
                // Ensure lastUpdated property exists
                if (!data.lastUpdated) {
                    data.lastUpdated = new Date().toISOString();
                    needsUpdate = true;
                }
                
                // Save repaired data if needed
                if (needsUpdate) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    console.log(`Repaired user data for ${user}`);
                }
            }
        });
    } catch (error) {
        console.error('Error repairing user data:', error);
    }
}

/**
 * Add a fun console easter egg
 */
function consoleEasterEgg() {
    const styles = [
        'font-size: 14px',
        'font-family: monospace',
        'background: #121212',
        'display: inline-block',
        'color: white',
        'padding: 8px 19px',
        'border: 1px dashed #4fc3f7'
    ].join(';');

    console.log('%c✨ Task Mission - Journey Together ✨', styles);

    // Only show these messages in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(
            '%cDeveloper Mode',
            'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;'
        );
        console.log('Version: 2.0.0');
        console.log('Created with 💖 for Kioma and Takitsu');
    }

    let keys = [];
    const konami = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
    
    window.addEventListener('keydown', (e) => {
        keys.push(e.key);
        keys = keys.slice(-konami.length);
        
        if (keys.join('') === konami) {
            document.body.classList.add('rainbow-mode');
            console.log('%c🌈 RAINBOW MODE ACTIVATED! 🌈', 'color: #ff6bcb; font-size: 20px; font-weight: bold; text-shadow: 0 0 5px #fff;');
        }
    });
}
