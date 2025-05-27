/**
 * Mobile-specific functionality for Anime Task Tracker
 * Enhances the experience on phones and tablets
 */

// BeforeInstallPrompt event storage
let deferredPrompt;

/**
 * Initialize cross-platform features (works on both mobile and desktop)
 */
function initMobileFeatures() {
    // Check device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Add device type classes to body
    if (isMobile) {
        document.body.classList.add('mobile-device');
    } else {
        document.body.classList.add('desktop-device');
    }
    
    console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    // Add touch/click event handlers (for both mobile and desktop)
    setupInteractionEvents(isMobile);
    
    // Add offline detection (useful for both platforms)
    setupOfflineDetection();
    
    // Add install prompt for PWA (works on supported browsers regardless of platform)
    setupInstallPrompt();
    
    // Add vibration feedback if supported (will gracefully degrade on desktop)
    setupVibrationFeedback(isMobile);
    
    // Add swipe/drag functionality (adapted for both platforms)
    setupSwipeActions(isMobile);
    
    // Add keyboard shortcuts for desktop
    setupKeyboardShortcuts();
}

/**
 * Set up interaction events for both touch and mouse devices
 * @param {boolean} isMobile - Whether the device is mobile
 */
function setupInteractionEvents(isMobile) {
    console.log('Setting up interaction events for', isMobile ? 'mobile' : 'desktop');
    
    // Make task items interactive with visual feedback
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        // Touch events for mobile
        if (isMobile) {
            item.addEventListener('touchstart', () => {
                item.classList.add('touch-active');
            });
            
            item.addEventListener('touchend', () => {
                item.classList.remove('touch-active');
                setTimeout(() => item.classList.remove('touch-active'), 300);
            });
            
            item.addEventListener('touchcancel', () => {
                item.classList.remove('touch-active');
            });
        }
        
        // Mouse events for desktop
        item.addEventListener('mouseenter', () => {
            item.classList.add('hover-active');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('hover-active');
        });
        
        // Add sound effect on complete (for both platforms)
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    playSound('check');
                    if (isMobile && 'vibrate' in navigator) {
                        navigator.vibrate(50);
                    }
                }
            });
        }
    });
    
    // Add feedback to buttons for both platforms
    const buttons = document.querySelectorAll('button, .user-button, .back-button');
    buttons.forEach(button => {
        // Touch events for mobile
        if (isMobile) {
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
                if ('vibrate' in navigator) {
                    navigator.vibrate(20);
                }
            });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('touch-active');
                playSound('pop');
            });
            
            button.addEventListener('touchcancel', () => {
                button.classList.remove('touch-active');
            });
        }
        
        // Mouse events for desktop 
        button.addEventListener('mousedown', () => {
            button.classList.add('mouse-active');
            playSound('pop');
        });
        
        button.addEventListener('mouseup', () => {
            button.classList.remove('mouse-active');
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('mouse-active');
        });
    });
}

/**
 * Set up offline detection and notification
 */
function setupOfflineDetection() {
    // Create offline indicator if it doesn't exist
    if (!document.querySelector('.offline-indicator')) {
        const offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.textContent = 'You are currently offline. Changes will sync when you reconnect.';
        document.body.appendChild(offlineIndicator);
    }
    
    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

/**
 * Update the online status indicator
 */
function updateOnlineStatus() {
    const offlineIndicator = document.querySelector('.offline-indicator');
    if (offlineIndicator) {
        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
        } else {
            offlineIndicator.classList.add('show');
        }
    }
}

/**
 * Set up PWA install prompt
 */
function setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        
        // Store the event for later use
        deferredPrompt = e;
        
        // Create and show install prompt
        showInstallPrompt();
    });
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
        // Clear the deferredPrompt
        deferredPrompt = null;
        
        // Hide the install prompt
        hideInstallPrompt();
        
        // Log app installation to analytics
        console.log('PWA was installed');
    });
}

/**
 * Show the PWA install prompt
 */
function showInstallPrompt() {
    // Check if we should show prompt (only show once a day)
    const lastPrompt = localStorage.getItem('installPromptShown');
    const now = new Date().toDateString();
    
    if (lastPrompt !== now && deferredPrompt) {
        // Create prompt if it doesn't exist
        if (!document.querySelector('.install-prompt')) {
            const installPrompt = document.createElement('div');
            installPrompt.className = 'install-prompt';
            installPrompt.innerHTML = `
                <p>Install this app on your device for a better experience!</p>
                <div class="install-actions">
                    <button class="install-button">Install</button>
                    <button class="install-dismiss">Not now</button>
                </div>
            `;
            document.body.appendChild(installPrompt);
            
            // Add event listeners
            const installButton = installPrompt.querySelector('.install-button');
            const dismissButton = installPrompt.querySelector('.install-dismiss');
            
            installButton.addEventListener('click', () => {
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    
                    // Clear the deferredPrompt variable
                    deferredPrompt = null;
                    
                    // Hide the prompt
                    hideInstallPrompt();
                });
            });
            
            dismissButton.addEventListener('click', () => {
                hideInstallPrompt();
                
                // Save that we showed the prompt today
                localStorage.setItem('installPromptShown', now);
            });
        }
        
        // Show the prompt
        setTimeout(() => {
            const prompt = document.querySelector('.install-prompt');
            if (prompt) {
                prompt.classList.add('show');
            }
        }, 3000);
    }
}

/**
 * Hide the PWA install prompt
 */
function hideInstallPrompt() {
    const prompt = document.querySelector('.install-prompt');
    if (prompt) {
        prompt.classList.remove('show');
        
        // Remove after animation
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.parentNode.removeChild(prompt);
            }
        }, 500);
    }
}

/**
 * Set up vibration feedback and sound effects
 * @param {boolean} isMobile - Whether the device is mobile
 */
function setupVibrationFeedback(isMobile) {
    console.log('Setting up feedback effects');
    
    // Setup audio context for sound effects if not already created
    if (!window.soundEffects) {
        window.soundEffects = {
            check: new Audio('assets/audio/check.mp3'),
            complete: new Audio('assets/audio/complete.mp3'),
            pop: new Audio('assets/audio/pop.mp3'),
            break: new Audio('assets/audio/break.mp3'),
            notification: new Audio('assets/audio/notification.mp3')
        };
        
        // Preload sounds
        Object.values(window.soundEffects).forEach(audio => {
            audio.load();
            audio.volume = 0.5;
        });
    }
    
    // Add sound and vibration to streak updates
    const streakElement = document.querySelector('.streak-count');
    if (streakElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target === streakElement) {
                    const newValue = parseInt(streakElement.textContent);
                    const oldValue = parseInt(mutation.oldValue || '0');
                    
                    if (newValue > oldValue) {
                        // Streak increased
                        playSound('complete');
                        if (isMobile && 'vibrate' in navigator) {
                            navigator.vibrate([50, 50, 100]);
                        }
                    } else if (newValue < oldValue && oldValue > 0) {
                        // Streak broken
                        playSound('break');
                        if (isMobile && 'vibrate' in navigator) {
                            navigator.vibrate([100, 50, 100, 50, 100]);
                        }
                    }
                }
            });
        });
        
        observer.observe(streakElement, { childList: true, characterData: true, subtree: true });
    }
}

/**
 * Play a sound effect
 * @param {string} sound - The name of the sound to play
 */
function playSound(sound) {
    try {
        if (window.soundEffects && window.soundEffects[sound]) {
            // Clone the audio to allow multiple instances to play simultaneously
            const audio = window.soundEffects[sound].cloneNode();
            audio.volume = 0.5;
            audio.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

/**
 * Set up swipe actions for task items
 */
function setupSwipeActions(isMobile) {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        let startX;
        let endX;
        const threshold = 100; // minimum distance for a swipe
        
        item.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        item.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
            
            // Calculate swipe distance
            const swipeDistance = startX - endX;
            
            // If swiping left, apply transform
            if (swipeDistance > 0) {
                const translate = Math.min(swipeDistance, threshold);
                item.style.transform = `translateX(-${translate}px)`;
            }
        });
        
        item.addEventListener('touchend', () => {
            if (startX && endX) {
                const swipeDistance = startX - endX;
                
                if (swipeDistance > threshold) {
                    // Complete swipe action - toggle task
                    const checkbox = item.querySelector('.task-checkbox');
                    checkbox.checked = !checkbox.checked;
                    
                    // Trigger change event
                    const changeEvent = new Event('change');
                    checkbox.dispatchEvent(changeEvent);
                }
                
                // Reset transform
                item.style.transform = '';
            }
            
            // Reset values
            startX = null;
            endX = null;
        });
    });
}

/**
 * Add special touch features for specific devices
 */
function addDeviceSpecificFeatures() {
    // iOS specific adjustments
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        document.body.classList.add('ios-device');
        
        // Add iOS safe area padding
        document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
    }
    
    // Android specific adjustments
    if (/Android/.test(navigator.userAgent)) {
        document.body.classList.add('android-device');
    }
}

// Initialize device-specific features
addDeviceSpecificFeatures();
