// Service Worker for Task Mission
const CACHE_NAME = 'task-mission-v4';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';
const FONT_CACHE = 'font-cache-v2';
const IMAGE_CACHE = 'image-cache-v2';
const AUDIO_CACHE = 'audio-cache-v1';

// Background sync tag
const TASK_SYNC_TAG = 'task-sync';
const PENDING_TASKS_DB = 'pending-tasks';

// Maximum age for dynamic cache items (1 week)
const MAX_DYNAMIC_AGE = 7 * 24 * 60 * 60 * 1000;

// Files to cache for offline use - organized by cache type for better performance
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/kioma.html',
  '/takitsu.html',
  '/manifest.json'
];

const CSS_ASSETS = [
  '/assets/css/style.css',
  '/assets/css/animations.css',
  '/assets/css/tasks.css',
  '/assets/css/mobile.css',
  '/assets/css/notifications.css'
];

const JS_ASSETS = [
  '/assets/js/main.js',
  '/assets/js/animations.js',
  '/assets/js/tasks.js',
  '/assets/js/mobile.js',
  '/assets/js/notifications.js',
  'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js',
  'https://cdn.jsdelivr.net/npm/luxon@3.0.1/build/global/luxon.min.js'
];

// No static image assets to cache - will be cached on-demand
const IMAGE_ASSETS = [];

// No static audio assets to cache - will be cached on-demand
const AUDIO_ASSETS = [];

const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'
];

// Helper function to open IndexedDB for pending tasks
function openTasksDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PENDING_TASKS_DB, 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// Install event - cache assets strategically by category for better performance
self.addEventListener('install', event => {
  self.skipWaiting(); // Ensure new service worker activates immediately
  
  event.waitUntil(
    Promise.all([
      // Core static assets that rarely change
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching core static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // CSS assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching CSS assets');
        return cache.addAll(CSS_ASSETS);
      }),
      
      // JavaScript assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching JavaScript assets');
        return cache.addAll(JS_ASSETS);
      }),
      
      // Image assets with custom cache
      caches.open(IMAGE_CACHE).then(cache => {
        console.log('Caching image assets');
        return cache.addAll(IMAGE_ASSETS);
      }),
      
      // Audio assets with custom cache
      caches.open(AUDIO_CACHE).then(cache => {
        console.log('Caching audio assets');
        return cache.addAll(AUDIO_ASSETS);
      }),
      
      // Font assets with custom cache
      caches.open(FONT_CACHE).then(cache => {
        console.log('Caching font assets');
        return cache.addAll(FONT_ASSETS);
      })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  // List of current cache versions
  const currentCaches = [
    STATIC_CACHE,
    DYNAMIC_CACHE,
    FONT_CACHE,
    IMAGE_CACHE,
    AUDIO_CACHE
  ];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !currentCaches.includes(cacheName))
          .map(cacheName => {
            console.log('Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('Service worker activated and controlling clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with improved strategies
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests and non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Special handling for different types of resources
  if (requestUrl.pathname.startsWith('/assets/img/')) {
    // Images - cache-first strategy with network fallback
    event.respondWith(cacheFirstStrategy(IMAGE_CACHE, event.request));
    return;
  }
  
  if (requestUrl.pathname.startsWith('/assets/audio/')) {
    // Audio files - network-first to ensure we get latest, but fallback to cache
    event.respondWith(networkFirstStrategy(AUDIO_CACHE, event.request));
    return;
  }
  
  if (requestUrl.href.includes('fonts.googleapis.com') || requestUrl.href.includes('fonts.gstatic.com')) {
    // Fonts - cache-first with long expiration
    event.respondWith(cacheFirstStrategy(FONT_CACHE, event.request));
    return;
  }
  
  if (requestUrl.href.includes('cdn.jsdelivr.net')) {
    // CDN resources - cache first with network fallback
    event.respondWith(cacheFirstStrategy(DYNAMIC_CACHE, event.request));
    return;
  }
  
  // HTML files - network-first approach for fresh content
  if (requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/' || 
      requestUrl.pathname.endsWith('/kioma') || requestUrl.pathname.endsWith('/takitsu')) {
    event.respondWith(networkFirstStrategy(STATIC_CACHE, event.request));
    return;
  }
  
  // All other assets - cache-first approach
  event.respondWith(cacheFirstStrategy(STATIC_CACHE, event.request));
});

// Background sync for offline task completion
self.addEventListener('sync', event => {
  if (event.tag === TASK_SYNC_TAG) {
    event.waitUntil(syncTasks());
  }
});

// Periodic background sync for task reminders
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(checkPendingTasks());
  }
});

// Function to sync tasks when back online
async function syncTasks() {
  try {
    // Open IndexedDB
    const db = await openTasksDB();
    const transaction = db.transaction('tasks', 'readwrite');
    const store = transaction.objectStore('tasks');
    
    // Get all pending tasks
    const pendingTasks = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (pendingTasks && pendingTasks.length > 0) {
      console.log(`Syncing ${pendingTasks.length} pending tasks`);
      
      // Process each task - in a real app, this would be an API call
      // For this offline-first app, we'll just update localStorage
      for (const task of pendingTasks) {
        try {
          // Get existing data
          const userData = localStorage.getItem(`${task.user}-data`);
          if (userData) {
            const parsedData = JSON.parse(userData);
            
            // Update task status
            if (parsedData.tasks && parsedData.tasks[task.taskId]) {
              parsedData.tasks[task.taskId].completed = task.completed;
              parsedData.tasks[task.taskId].completedDate = task.completedDate;
              // Update streak if necessary
              if (task.updateStreak) {
                parsedData.streak = task.newStreak;
                parsedData.lastUpdated = task.lastUpdated;
              }
              
              // Save back to localStorage
              localStorage.setItem(`${task.user}-data`, JSON.stringify(parsedData));
              
              // Remove from pending tasks
              await new Promise((resolve, reject) => {
                const deleteRequest = store.delete(task.id);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
            }
          }
        } catch (taskError) {
          console.error(`Error processing task ${task.id}:`, taskError);
        }
      }
      
      // Show notification that tasks were synced
      self.registration.showNotification('Tasks Synced', {
        body: `${pendingTasks.length} tasks have been synced`,
        icon: '/assets/img/icon-192.png',
        badge: '/assets/img/icon-192.png',
        data: { url: '/' }
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Check for pending tasks and remind users
async function checkPendingTasks() {
  try {
    // Get user data from localStorage
    const userData = {
      kioma: localStorage.getItem('kioma-data') ? JSON.parse(localStorage.getItem('kioma-data')) : null,
      takitsu: localStorage.getItem('takitsu-data') ? JSON.parse(localStorage.getItem('takitsu-data')) : null
    };
    
    // Check for incomplete tasks
    for (const user in userData) {
      if (userData[user] && userData[user].tasks) {
        const incompleteTasks = Object.values(userData[user].tasks).filter(task => !task.completed);
        
        if (incompleteTasks.length > 0) {
          // Send reminder notification
          self.registration.showNotification(`${user} has tasks to complete!`, {
            body: `You have ${incompleteTasks.length} tasks remaining today`,
            icon: `/assets/img/${user}-avatar.png`,
            badge: '/assets/img/icon-192.png',
            data: { url: `/${user}.html` },
            actions: [
              { action: 'view', title: 'View Tasks' }
            ]
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking pending tasks:', error);
  }
}

// Cache-first strategy: Try cache first, fallback to network
function cacheFirstStrategy(cacheName, request) {
  return caches.open(cacheName)
    .then(cache => {
      return cache.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return from cache and update cache in background
            fetchAndUpdateCache(cache, request);
            return cachedResponse;
          }
          
          // Not in cache, get from network
          return fetchAndUpdateCache(cache, request);
        });
    })
    .catch(error => {
      console.error('Cache error:', error);
      // Attempt network as last resort
      return fetch(request);
    });
}

// Network-first strategy: Try network first, fallback to cache
function networkFirstStrategy(cacheName, request) {
  return fetch(request)
    .then(networkResponse => {
      // Clone the response to store in cache
      if (networkResponse.ok) {
        const clonedResponse = networkResponse.clone();
        caches.open(cacheName).then(cache => {
          cache.put(request, clonedResponse);
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, try the cache
      return caches.open(cacheName)
        .then(cache => {
          return cache.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If it's an HTML request, return the offline page
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              // Otherwise, let the failure happen
              return new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        });
    });
}

// Fetch and update cache helper
function fetchAndUpdateCache(cache, request) {
  return fetch(request)
    .then(networkResponse => {
      // Only cache successful responses
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('Fetch and cache update failed:', error);
      throw error;
    });
}

// Push notification event handler
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    // Show notification with data from push event
    const options = {
      body: data.body || 'Time to complete your task!',
      icon: data.icon || '/assets/img/icon-192.png',
      badge: '/assets/img/icon-192.png',
      vibrate: data.vibrate || [100, 50, 100],
      data: {
        taskIndex: data.taskIndex,
        url: data.url || self.registration.scope
      },
      actions: [
        {
          action: 'view',
          title: 'View Task'
        },
        {
          action: 'complete',
          title: 'Mark Complete'
        }
      ],
      tag: data.tag || 'task-notification',
      renotify: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Task Reminder', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const taskIndex = event.notification.data?.taskIndex;
  const rootUrl = event.notification.data?.url || self.registration.scope;
  
  // Handle action clicks
  if (event.action === 'complete' && taskIndex !== undefined) {
    // Store that user wants to complete this task when they open the app
    clients.openWindow(rootUrl + '?action=complete&taskIndex=' + taskIndex);
    return;
  }
  
  // Default action - open the app and focus the task
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        // If so, just focus it
        if (client.url.includes(rootUrl) && 'focus' in client) {
          client.navigate(rootUrl + (taskIndex !== undefined ? '?highlight=' + taskIndex : ''));
          return client.focus();
        }
      }
      
      // If not, open a new window/tab to the URL
      if (clients.openWindow) {
        return clients.openWindow(rootUrl + (taskIndex !== undefined ? '?highlight=' + taskIndex : ''));
      }
    })
  );
});
