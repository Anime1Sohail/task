/**
 * Main JavaScript for Anime Task Tracker
 * Handles landing page functionality and initialization
 */

// Deferred initialization for better page load performance
document.addEventListener('DOMContentLoaded', () => {
    // Console easter egg - low impact
    consoleEasterEgg();
    
    // Defer particle initialization
    setTimeout(() => {
        initParticles();
    }, 100);
    
    // Add sound effects to buttons - using passive listeners
    if (!('ontouchstart' in window)) {
        // Only add sound effects on non-touch devices
        addSoundEffects();
    }
});

/**
 * Initialize the particles.js background
 */
function initParticles() {
    // Detect device type for adaptive configuration
    const deviceType = getDeviceType();
    
    // Determine which page we're on to set appropriate particle colors
    const pageType = determinePageType();
    
    // Adaptive configuration based on device capabilities and page type
    const particleConfig = getOptimizedParticleConfig(deviceType, pageType);
    
    // Initialize particles with optimized config
    particlesJS('particles-js', particleConfig);
    
    // Add event listener to handle the particles hover effect on main content
    setupContentHoverEffects();
}

/**
 * Determine which page we're on (main, kioma, or takitsu)
 * @returns {string} Page type
 */
function determinePageType() {
    // Check URL or body class to determine page
    if (document.body.classList.contains('kioma-theme')) {
        return 'kioma';
    } else if (document.body.classList.contains('takitsu-theme')) {
        return 'takitsu';
    } else {
        return 'main';
    }
}

/**
 * Get device type for adaptive configuration
 * @returns {string} Device type: 'mobile', 'tablet', or 'desktop'
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 480) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

/**
 * Generate optimized particle configuration based on device type and page type
 * @param {string} deviceType - The type of device (mobile, tablet, desktop)
 * @param {string} pageType - The type of page (main, kioma, takitsu)
 * @returns {Object} Optimized particles.js configuration
 */
function getOptimizedParticleConfig(deviceType, pageType) {
    // Base particle count by device type (balanced for minimalist design)
    const particleCount = {
        'mobile': 20,  // Balanced count for mobile
        'tablet': 35,
        'desktop': 60  // Balanced count for desktop
    };
    
    // Use lighter effects on mobile
    const enableParticleAnimation = deviceType !== 'mobile';
    
    // Always enable linked particles as requested
    const enableLinkedParticles = true;
    
    // Speed adjustment for different devices
    const particleSpeed = {
        'mobile': 0.5,
        'tablet': 0.7,
        'desktop': 0.9
    };
    
    // Get color scheme based on page type
    const colorScheme = getParticleColors(pageType);
    
    // Check if this is the main landing page to apply special effects
    const isMainPage = pageType === 'main';
    
    // Base configuration with optimizations for each device type
    return {
        "particles": {
            "number": {
                "value": particleCount[deviceType],
                "density": {
                    "enable": true,
                    "value_area": deviceType === 'mobile' ? 800 : 1000
                }
            },
            "color": {
                "value": colorScheme
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
                "value": isMainPage ? 0.7 : (deviceType === 'mobile' ? 0.5 : 0.6),  // Brighter particles for main page
                "random": true,
                "anim": {
                    "enable": enableParticleAnimation,
                    "speed": 0.8,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": isMainPage ? 2.5 : (deviceType === 'mobile' ? 1.5 : 2), // Larger particles for main page
                "random": true,
                "anim": {
                    "enable": enableParticleAnimation,
                    "speed": 1,
                    "size_min": 0.3,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": enableLinkedParticles,
                "distance": isMainPage ? (deviceType === 'mobile' ? 150 : deviceType === 'tablet' ? 180 : 200) : 
                              (deviceType === 'mobile' ? 100 : deviceType === 'tablet' ? 120 : 150), // Increased distance for main page
                "color": pageType === 'main' ? "#ffffff" : 
                        pageType === 'kioma' ? "#4CAF50" : "#4fc3f7", // Match line color to theme
                "opacity": isMainPage ? 0.5 : 0.4,  // Higher opacity for main page
                "width": isMainPage ? (deviceType === 'mobile' ? 0.7 : deviceType === 'tablet' ? 0.8 : 1) : 
                          (deviceType === 'mobile' ? 0.5 : deviceType === 'tablet' ? 0.6 : 0.7) // Thicker lines for main page
            },
            "move": {
                "enable": true,
                "speed": isMainPage ? particleSpeed[deviceType] * 0.8 : particleSpeed[deviceType] * 0.6, // Faster for main page
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": deviceType !== 'mobile',
                    "rotateX": 400,
                    "rotateY": 800
                }
            }
        },
        "interactivity": {
            "detect_on": "window",  // More consistent detection across elements
            "events": {
                "onhover": {
                    "enable": true,  // Enable for all devices with different modes
                    "mode": isMainPage ? "connect" : (deviceType === 'mobile' ? "bubble" : 
                             deviceType === 'tablet' ? "grab" : "repulse")
                },
                "onclick": {
                    "enable": true,
                    "mode": deviceType === 'mobile' ? "push" : "push"
                },
                "resize": true
            },
            "modes": {
                "connect": {
                    "distance": deviceType === 'mobile' ? 100 : deviceType === 'tablet' ? 150 : 200,
                    "radius": 200,
                    "line_linked": {
                        "opacity": 0.8
                    }
                },
                "grab": {
                    "distance": deviceType === 'mobile' ? 80 : deviceType === 'tablet' ? 120 : 180,
                    "line_linked": {
                        "opacity": 0.8  // More visible on hover
                    }
                },
                "bubble": {
                    "distance": isMainPage ? 150 : (deviceType === 'mobile' ? 80 : 150),
                    "size": isMainPage ? (deviceType === 'mobile' ? 15 : deviceType === 'tablet' ? 30 : 45) : 
                             (deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 25 : 40),
                    "duration": 2,
                    "opacity": 0.8,
                    "speed": 3
                },
                "repulse": {
                    "distance": isMainPage ? (deviceType === 'mobile' ? 120 : deviceType === 'tablet' ? 200 : 250) : 
                                 (deviceType === 'mobile' ? 80 : deviceType === 'tablet' ? 150 : 200),
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": deviceType === 'mobile' ? 2 : deviceType === 'tablet' ? 3 : 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        // Use retina detection only on high-end devices
        "retina_detect": deviceType === 'desktop'
    };
}

/**
 * Get particle colors based on page type
 * @param {string} pageType - The page type
 * @returns {array} Array of colors for particles
 */
function getParticleColors(pageType) {
    switch(pageType) {
        case 'kioma':
            // Green theme for Kioma
            return ["#4CAF50", "#A5D6A7", "#81C784", "#66BB6A", "#E8F5E9"];
            
        case 'takitsu':
            // Blue theme for Takitsu
            return ["#4fc3f7", "#B3E5FC", "#81D4FA", "#29B6F6", "#E1F5FE"];
            
        default:
            // Brighter white theme for main page (as requested)
            return ["#ffffff", "#ffffff", "#f7f7ff", "#f0f0ff", "#e8e8ff"];
    }
}

/**
 * Set up content hover effects for better interaction
 * This ensures the hover effects work even when hovering over content
 */
function setupContentHoverEffects() {
    // Get main content containers that might intercept hover events
    const mainContent = document.querySelector('main');
    if (!mainContent) return;
    
    // Track mouse position for the whole document
    let mousePos = { x: 0, y: 0 };
    
    // Update mouse position
    document.addEventListener('mousemove', (event) => {
        mousePos = { x: event.clientX, y: event.clientY };
        
        // Dispatch a custom hover event to particles.js
        const particlesContainer = document.getElementById('particles-js');
        if (particlesContainer) {
            // Create and dispatch a synthetic mousemove event to particles container
            const syntheticEvent = new MouseEvent('mousemove', {
                clientX: mousePos.x,
                clientY: mousePos.y,
                bubbles: true
            });
            particlesContainer.dispatchEvent(syntheticEvent);
        }
    }, { passive: true });
    
    // Handle touch events for mobile
    document.addEventListener('touchmove', (event) => {
        if (event.touches && event.touches[0]) {
            mousePos = { 
                x: event.touches[0].clientX, 
                y: event.touches[0].clientY 
            };
            
            // Dispatch touch position to particles container
            const particlesContainer = document.getElementById('particles-js');
            if (particlesContainer) {
                const syntheticEvent = new MouseEvent('mousemove', {
                    clientX: mousePos.x,
                    clientY: mousePos.y,
                    bubbles: true
                });
                particlesContainer.dispatchEvent(syntheticEvent);
            }
        }
    }, { passive: true });
}

/**
 * Add hover sound effects to buttons
 */
function addSoundEffects() {
    // Create audio elements only once
    let hoverSound = null;
    let clickSound = null;
    
    // Lazy initialization of audio
    const initAudio = () => {
        if (!hoverSound) {
            // Only create audio objects when needed
            hoverSound = new Audio('assets/audio/hover.mp3');
            clickSound = new Audio('assets/audio/click.mp3');
            
            // Set volume
            hoverSound.volume = 0.3;
            clickSound.volume = 0.5;
            
            // Preload
            hoverSound.load();
            clickSound.load();
        }
    };
    
    // Add event listeners with passive option for better performance
    const buttons = document.querySelectorAll('.user-button');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            initAudio();
            // Only play if not already playing
            if (hoverSound && hoverSound.paused) {
                hoverSound.currentTime = 0;
                hoverSound.play().catch(err => console.log('Audio play error:', err));
            }
        }, { passive: true });
        
        button.addEventListener('click', () => {
            initAudio();
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(err => console.log('Audio play error:', err));
            }
        }, { passive: true });
    });
}

/**
 * Add a fun console easter egg
 */
function consoleEasterEgg() {
    const styles = [
        'color: #ff6bcb; font-size: 20px; font-weight: bold;',
        'color: #4fc3f7; font-size: 16px;',
        'color: #ffffff; background: #121212; font-size: 14px; padding: 5px 10px; border-radius: 5px;'
    ];
    
    console.log('%c✨ Welcome to the Anime Task Tracker! ✨', styles[0]);
    console.log('%c神秘的なコードの世界へようこそ!', styles[1]);
    console.log('%c⭐ You found the secret console message! Special powers unlocked! ⭐', styles[2]);
    
    // Add a hidden cheat code for fun
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
