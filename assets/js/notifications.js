/**
 * Notifications System for Anime Task Tracker
 * Handles notification permissions, scheduling, and delivery
 */

// Store notification permissions state
let notificationsEnabled = false;

// Store notification settings
const notificationSettings = {
    // Default settings
    soundEnabled: true,
    vibrateEnabled: true,
    reminderInterval: 30, // minutes before due time to remind
};

// Store scheduled notifications
let scheduledNotifications = [];

/**
 * Initialize the notifications system
 */
function initNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        showToast('Your browser does not support notifications', 'error');
        return;
    }

    // Register service worker if not already registered (needed for notifications)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                // Continue with notification setup after service worker is ready
                navigator.serviceWorker.ready.then(() => {
                    console.log('Service Worker is ready');
                    // Proceed with notification initialization
                    continueNotificationSetup();
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
                // Still try to setup notifications even if service worker fails
                continueNotificationSetup();
            });
    } else {
        // No service worker support, but still try basic notifications
        continueNotificationSetup();
    }
}

/**
 * Continue notification setup after service worker is registered
 */
function continueNotificationSetup() {
    // Load notification settings
    loadNotificationSettings();

    // Check notification permission
    checkNotificationPermission();

    // Set up notification interface
    setupNotificationUI();

    // Add time pickers to tasks
    addTimePickersToTasks();

    // Load existing notification schedules
    loadScheduledNotifications();

    // Set up notification checking timer
    setInterval(checkScheduledNotifications, 30000); // Check every 30 seconds (increased frequency)
    
    // Do an immediate check for any pending notifications
    setTimeout(checkScheduledNotifications, 3000);
}

/**
 * Load notification settings from localStorage
 */
function loadNotificationSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            Object.assign(notificationSettings, parsedSettings);
        } catch (e) {
            console.error('Error parsing notification settings:', e);
        }
    }
}

/**
 * Save notification settings to localStorage
 */
function saveNotificationSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

/**
 * Check notification permission status
 */
function checkNotificationPermission() {
    console.log('Checking notification permission:', Notification.permission);
    
    if (Notification.permission === 'granted') {
        notificationsEnabled = true;
        console.log('Notifications already enabled');
    } else if (Notification.permission !== 'denied') {
        // We need to ask for permission - but don't do it automatically
        // Just mark as not enabled - we'll let the user click the button
        notificationsEnabled = false;
        console.log('Notifications need permission');
    } else {
        // Permission was denied
        notificationsEnabled = false;
        console.log('Notifications were denied');
    }
}

/**
 * Request notification permissions
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Your browser does not support notifications', 'error');
        return false;
    }

    try {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('Permission response:', permission);
        
        notificationsEnabled = permission === 'granted';
        
        if (notificationsEnabled) {
            showToast('Notifications enabled!', 'success');
            // Update the UI to reflect the enabled state
            document.querySelectorAll('.permission-status').forEach(el => {
                el.innerHTML = 'Status: <span class="enabled">Enabled</span>';
            });
            
            // Remove the request permission button if it exists
            const requestBtn = document.getElementById('request-permission');
            if (requestBtn) requestBtn.style.display = 'none';
            
            // Reload scheduled notifications
            loadScheduledNotifications();
            
            // Register for push if available
            registerPushManager();
        } else {
            showToast('Notification permission was denied', 'error');
        }
        
        return notificationsEnabled;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Error requesting permission', 'error');
        return false;
    }
}

/**
 * Set up notification UI elements
 */
function setupNotificationUI() {
    // Create notification settings button if it doesn't exist
    if (!document.querySelector('.notification-settings-button')) {
        const button = document.createElement('button');
        button.className = 'notification-settings-button';
        button.innerHTML = '<span class="notification-icon">🔔</span>';
        button.setAttribute('aria-label', 'Notification Settings');
        button.title = 'Notification Settings';
        
        // Add click event
        button.addEventListener('click', openNotificationSettings);
        
        // Add to DOM
        document.body.appendChild(button);
    }
    
    // Create notification toast container
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type of toast (success, error, info)
 * @param {number} duration - Duration in ms
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Open notification settings modal
 */
function openNotificationSettings() {
    console.log('Opening notification settings modal');
    // Create modal if it doesn't exist
    if (!document.getElementById('notification-settings-modal')) {
        const modal = document.createElement('div');
        modal.id = 'notification-settings-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Notification Settings</h2>
                    <button class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="permission-section">
                        <h3>Notification Permission</h3>
                        <p class="permission-status">Status: ${notificationsEnabled ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>'}</p>
                        ${!notificationsEnabled ? '<button id="request-permission" class="primary-button">Enable Notifications</button>' : ''}
                    </div>
                    
                    <div class="settings-section">
                        <h3>Settings</h3>
                        <div class="setting-item">
                            <label for="sound-toggle">
                                <span>Sound</span>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="sound-toggle" ${notificationSettings.soundEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="vibrate-toggle">
                                <span>Vibration</span>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="vibrate-toggle" ${notificationSettings.vibrateEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="reminder-interval">
                                <span>Reminder Interval (minutes before)</span>
                                <select id="reminder-interval">
                                    <option value="5" ${notificationSettings.reminderInterval === 5 ? 'selected' : ''}>5 minutes</option>
                                    <option value="10" ${notificationSettings.reminderInterval === 10 ? 'selected' : ''}>10 minutes</option>
                                    <option value="15" ${notificationSettings.reminderInterval === 15 ? 'selected' : ''}>15 minutes</option>
                                    <option value="30" ${notificationSettings.reminderInterval === 30 ? 'selected' : ''}>30 minutes</option>
                                    <option value="60" ${notificationSettings.reminderInterval === 60 ? 'selected' : ''}>1 hour</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    
                    <div class="scheduled-section">
                        <h3>Scheduled Notifications</h3>
                        <div id="scheduled-list"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="save-settings" class="primary-button">Save Settings</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', closeModal);
        
        const requestPermissionButton = modal.querySelector('#request-permission');
        if (requestPermissionButton) {
            requestPermissionButton.addEventListener('click', async () => {
                const granted = await requestNotificationPermission();
                
                // Update UI
                const statusElement = modal.querySelector('.permission-status');
                if (statusElement) {
                    statusElement.innerHTML = `Status: ${granted ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>'}`;
                }
                
                // Hide the button if permission granted
                if (granted && requestPermissionButton.parentNode) {
                    requestPermissionButton.parentNode.removeChild(requestPermissionButton);
                }
            });
        }
        
        const saveButton = modal.querySelector('#save-settings');
        saveButton.addEventListener('click', () => {
            // Save settings
            notificationSettings.soundEnabled = document.getElementById('sound-toggle').checked;
            notificationSettings.vibrateEnabled = document.getElementById('vibrate-toggle').checked;
            notificationSettings.reminderInterval = parseInt(document.getElementById('reminder-interval').value, 10);
            
            saveNotificationSettings();
            showToast('Settings saved!', 'success');
            
            // Close modal
            closeModal();
        });
        
        // Update scheduled notifications list
        updateScheduledNotificationsList();
    }
    
    // Show modal
    const modal = document.getElementById('notification-settings-modal');
    modal.classList.add('show');
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('notification-settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Update the list of scheduled notifications in the settings modal
 */
function updateScheduledNotificationsList() {
    const listContainer = document.getElementById('scheduled-list');
    if (!listContainer) return;
    
    // Clear existing content
    listContainer.innerHTML = '';
    
    if (scheduledNotifications.length === 0) {
        listContainer.innerHTML = '<p class="no-items">No scheduled notifications</p>';
        return;
    }
    
    // Sort by time
    const sortedNotifications = [...scheduledNotifications].sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
    });
    
    // Create list
    const list = document.createElement('ul');
    list.className = 'notifications-list';
    
    sortedNotifications.forEach(notification => {
        const listItem = document.createElement('li');
        
        // Format time
        const notificationTime = new Date(notification.time);
        const formattedTime = notificationTime.toLocaleString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        });
        
        listItem.innerHTML = `
            <div class="notification-info">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${formattedTime}</span>
            </div>
            <button class="delete-notification" data-id="${notification.id}">×</button>
        `;
        
        list.appendChild(listItem);
    });
    
    listContainer.appendChild(list);
    
    // Add delete event listeners
    const deleteButtons = listContainer.querySelectorAll('.delete-notification');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const notificationId = button.getAttribute('data-id');
            removeScheduledNotification(notificationId);
            updateScheduledNotificationsList();
        });
    });
}

/**
 * Add time pickers to task items
 */
function addTimePickersToTasks() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach((taskItem, index) => {
        // Skip if already has a time picker
        if (taskItem.querySelector('.time-picker-button')) return;
        
        // Get task text
        const taskText = taskItem.querySelector('.task-text').textContent;
        
        // Create time picker button
        const timeButton = document.createElement('button');
        timeButton.className = 'time-picker-button';
        timeButton.innerHTML = '<span class="time-icon">⏰</span>';
        timeButton.setAttribute('aria-label', 'Set reminder time');
        timeButton.title = 'Set reminder time';
        
        // Add to task item
        taskItem.appendChild(timeButton);
        
        // Add click event
        timeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent task item click
            openTimePickerModal(taskText, index);
        });
    });
}

/**
 * Open time picker modal for a task
 * @param {string} taskText - The task description
 * @param {number} taskIndex - The index of the task
 */
function openTimePickerModal(taskText, taskIndex) {
    // Get current user
    const user = document.body.classList.contains('kioma-theme') ? 'kioma' : 'takitsu';
    
    // Check if modal already exists
    if (!document.getElementById('time-picker-modal')) {
        const modal = document.createElement('div');
        modal.id = 'time-picker-modal';
        modal.className = 'modal';
        
        // Get current time
        const now = new Date();
        const hours = now.getHours() % 12 || 12; // Convert 0 to 12 for 12-hour format
        const minutes = now.getMinutes();
        const period = now.getHours() >= 12 ? 'PM' : 'AM';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Set Reminder Time</h2>
                    <button class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="task-description">${taskText}</p>
                    
                    <div class="time-picker">
                        <div class="time-selector">
                            <label for="hour-select">Hour</label>
                            <select id="hour-select">
                                ${Array.from({length: 12}, (_, i) => {
                                    const hour = i + 1;
                                    return `<option value="${hour}" ${hour === hours ? 'selected' : ''}>${hour}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-selector">
                            <label for="minute-select">Minute</label>
                            <select id="minute-select">
                                ${Array.from({length: 60}, (_, i) => {
                                    return `<option value="${i}" ${i === minutes ? 'selected' : ''}>${i < 10 ? '0' + i : i}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="time-selector">
                            <label for="period-select">AM/PM</label>
                            <select id="period-select">
                                <option value="AM" ${period === 'AM' ? 'selected' : ''}>AM</option>
                                <option value="PM" ${period === 'PM' ? 'selected' : ''}>PM</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="date-selector">
                        <label for="date-input">Date</label>
                        <input type="date" id="date-input" value="${now.toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="repeat-selector">
                        <label for="repeat-select">Repeat</label>
                        <select id="repeat-select">
                            <option value="none">Do not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-reminder" class="secondary-button">Cancel</button>
                    <button id="save-reminder" class="primary-button">Set Reminder</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', closeTimePickerModal);
        
        const cancelButton = modal.querySelector('#cancel-reminder');
        cancelButton.addEventListener('click', closeTimePickerModal);
        
        const saveButton = modal.querySelector('#save-reminder');
        saveButton.addEventListener('click', () => {
            // Get values
            const hour = parseInt(document.getElementById('hour-select').value, 10);
            const minute = parseInt(document.getElementById('minute-select').value, 10);
            const period = document.getElementById('period-select').value;
            const dateString = document.getElementById('date-input').value;
            const repeat = document.getElementById('repeat-select').value;
            
            // Convert to 24-hour format
            let hour24 = hour;
            if (period === 'PM' && hour !== 12) hour24 += 12;
            if (period === 'AM' && hour === 12) hour24 = 0;
            
            // Create date object
            const reminderDate = new Date(dateString);
            reminderDate.setHours(hour24, minute, 0, 0);
            
            // Schedule notification
            scheduleNotification({
                id: `${user}-task-${taskIndex}-${Date.now()}`,
                user: user,
                taskIndex: taskIndex,
                title: taskText,
                body: `Time to complete: ${taskText}`,
                time: reminderDate.toISOString(),
                repeat: repeat
            });
            
            // Close modal
            closeTimePickerModal();
            
            // Show confirmation
            showToast(`Reminder set for ${reminderDate.toLocaleString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                month: 'short',
                day: 'numeric'
            })}`, 'success');
        });
    }
    
    // Show modal
    const modal = document.getElementById('time-picker-modal');
    modal.classList.add('show');
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTimePickerModal();
        }
    });
}

/**
 * Close the time picker modal
 */
function closeTimePickerModal() {
    const modal = document.getElementById('time-picker-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Schedule a notification
 * @param {Object} notification - Notification object with title, body, time, etc.
 */
function scheduleNotification(notification) {
    // Add to scheduled notifications
    scheduledNotifications.push(notification);
    
    // Save to localStorage
    saveScheduledNotifications();
    
    // Update UI if settings modal is open
    updateScheduledNotificationsList();
}

/**
 * Remove a scheduled notification
 * @param {string} notificationId - ID of the notification to remove
 */
function removeScheduledNotification(notificationId) {
    scheduledNotifications = scheduledNotifications.filter(notification => notification.id !== notificationId);
    
    // Save to localStorage
    saveScheduledNotifications();
}

/**
 * Save scheduled notifications to localStorage
 */
function saveScheduledNotifications() {
    const user = document.body.classList.contains('kioma-theme') ? 'kioma' : 'takitsu';
    localStorage.setItem(`${user}-scheduled-notifications`, JSON.stringify(scheduledNotifications));
}

/**
 * Load scheduled notifications from localStorage
 */
function loadScheduledNotifications() {
    const user = document.body.classList.contains('kioma-theme') ? 'kioma' : 'takitsu';
    const savedNotifications = localStorage.getItem(`${user}-scheduled-notifications`);
    
    if (savedNotifications) {
        try {
            scheduledNotifications = JSON.parse(savedNotifications);
        } catch (e) {
            console.error('Error parsing scheduled notifications:', e);
            scheduledNotifications = [];
        }
    }
}

/**
 * Check for notifications that need to be shown
 */
function checkScheduledNotifications() {
    console.log('Checking scheduled notifications...');
    
    if (scheduledNotifications.length === 0) {
        console.log('No scheduled notifications');
        return;
    }
    
    const now = new Date();
    const currentTime = now.getTime();
    
    console.log(`Current time: ${now.toLocaleTimeString()}, Checking ${scheduledNotifications.length} notifications`);
    
    // Check each scheduled notification
    scheduledNotifications.forEach(notification => {
        // If it's not processed yet and the time has passed
        if (!notification.processed) {
            const scheduledTime = new Date(notification.time).getTime();
            console.log(`Notification: ${notification.title}, Scheduled: ${new Date(notification.time).toLocaleTimeString()}, Processed: ${notification.processed}`);
            
            // If it's time to show the notification
            if (currentTime >= scheduledTime) {
                console.log('Time to show notification!');
                // Mark as processed
                notification.processed = true;
                
                // Show the notification (regardless of permission - the function will handle fallbacks)
                showNotification(notification);
                
                // If it's a repeating notification, schedule the next one
                if (notification.repeat) {
                    scheduleNextRepeat(notification);
                }
            }
            
            // If it's getting close (within reminder interval) but not time yet
            // and we haven't shown a reminder, show a reminder
            const reminderTime = scheduledTime - (notificationSettings.reminderInterval * 60 * 1000);
            if (currentTime >= reminderTime && !notification.reminderShown) {
                notification.reminderShown = true;
                console.log('Showing reminder for upcoming notification');
                
                // Highlight the task to remind user it's coming up
                highlightTask(notification.taskIndex);
                
                // Show a toast as a reminder
                showToast(`Reminder: "${notification.title}" in ${notificationSettings.reminderInterval} minutes`);
            }
        }
    });
    
    // Save the updated notifications
    saveScheduledNotifications();
}

/**
 * Show a notification
 * @param {Object} notification - Notification object
 */
function showNotification(notification) {
    console.log('Showing notification:', notification);
    
    if (!notificationsEnabled) {
        console.log('Notifications not enabled, showing fallback');
        showToast(notification.title + ': ' + notification.body);
        highlightTask(notification.taskIndex);
        return;
    }
    
    // Check if we should play sound (do this regardless of notification API)
    if (notificationSettings.soundEnabled) {
        playNotificationSound();
    }
    
    // Check if we should vibrate (mobile devices)
    if (notificationSettings.vibrateEnabled && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // Try to use the service worker for notifications first (better support)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            console.log('Using service worker to show notification');
            
            // Create the notification options
            const options = {
                body: notification.body || 'Time to complete your task!',
                icon: notification.icon || '/assets/img/icon-192.png',
                badge: '/assets/img/icon-192.png',
                vibrate: notificationSettings.vibrateEnabled ? [100, 50, 100] : undefined,
                data: { 
                    taskIndex: notification.taskIndex,
                    url: window.location.href
                },
                tag: notification.id,
                renotify: true,
                requireInteraction: true
            };
            
            // Show the notification via service worker
            registration.showNotification(notification.title, options)
                .then(() => console.log('Notification shown successfully'))
                .catch(error => {
                    console.error('Error showing notification via service worker:', error);
                    fallbackNotification();
                });
        }).catch(error => {
            console.error('Service worker not ready:', error);
            fallbackNotification();
        });
    } else {
        // Fallback to regular Notification API
        fallbackNotification();
    }
    
    // Fallback notification function
    function fallbackNotification() {
        // Check if we can use the Notification API directly
        if ('Notification' in window && Notification.permission === 'granted') {
            console.log('Using standard Notification API');
            
            try {
                // Create and show the notification
                const options = {
                    body: notification.body || 'Time to complete your task!',
                    icon: notification.icon || '/assets/img/icon-192.png',
                    vibrate: notificationSettings.vibrateEnabled ? [100, 50, 100] : undefined,
                    data: { 
                        taskIndex: notification.taskIndex,
                        url: window.location.href
                    },
                    tag: notification.id
                };
                
                const notif = new Notification(notification.title, options);
                
                // Handle notification click
                notif.onclick = function() {
                    window.focus();
                    highlightTask(notification.taskIndex);
                    this.close();
                };
            } catch (error) {
                console.error('Error showing notification via Notification API:', error);
                showToast(notification.title + ': ' + notification.body);
                highlightTask(notification.taskIndex);
            }
        } else {
            // Last resort fallback
            console.log('No notification API available, using toast');
            showToast(notification.title + ': ' + notification.body);
            highlightTask(notification.taskIndex);
        }
    }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
    try {
        const audio = new Audio('assets/audio/notification.mp3');
        audio.volume = 0.5; // 50% volume
        audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    } catch (error) {
        console.error('Error creating audio element:', error);
    }
}

/**
 * Register service worker for push notifications
 */
function registerPushManager() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
    }
    
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service worker ready for push manager');
        
        // For future implementation of push subscription with a backend
        // This would require a server that can send push notifications
        /*
        registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
        }).then(subscription => {
            // Send subscription to server
            console.log('Push subscription successful:', subscription);
        }).catch(error => {
            console.error('Push subscription failed:', error);
        });
        */
    }).catch(error => {
        console.error('Service worker not ready for push:', error);
    });
}

// Show modal
const modal = document.getElementById('time-picker-modal');
modal.classList.add('show');

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeTimePickerModal();
    }
});
