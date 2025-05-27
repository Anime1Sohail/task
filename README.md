# ✨ Task Mission

> A beautiful, high-performance anime-inspired task tracker optimized for all devices.

![Task Mission](assets/img/screenshots/desktop.png)

## ✨ Features

### Core Features
- **🎯 Task Tracking**: Daily task management for both users (Kioma & Takitsu)
- **🔥 Streak System**: Track consecutive days of completed tasks with visual progress
- **🕒 Timezone Settings**: Task reset at midnight in your local timezone
- **📲 Fully Responsive**: Optimized experience on mobile, tablet, and desktop devices
- **⚡ Performance Optimized**: Fast loading and smooth animations on all devices

### Advanced Features
- **🔔 Task Notifications**: Set custom reminders for your tasks
  - Customizable 12-hour time format (AM/PM)
  - Notification sounds and vibration feedback
  - Repeat options (daily, weekdays, weekly)
- **💾 Offline Support**: Enhanced service worker with strategic caching for reliable offline use
- **📱 Cross-Device PWA**: Install as an app on any device (mobile, tablet, and desktop)
- **🌐 Cross-Platform**: Synchronizes between devices with a consistent experience
- **⚙️ Desktop Integration**: Shortcuts and side panel support for modern browsers

### Design Elements
- **🎭 Anime-Inspired UI**: Beautiful animations and theme-specific particle effects
- **🌙 Dark Theme**: Glass-morphism design with neon accents for each character
  - Bright green theme for Kioma
  - Vibrant blue theme for Takitsu
- **🎵 Optimized Sound Effects**: Performance-friendly audio feedback for interactions
- **👾 Chibi Assistant**: Helpful animated character with encouraging messages
- **✨ Particle Effects**: Dynamic background particles matching user themes

## Technical Improvements

### Performance Optimizations
- **🚀 Optimized Animations**: Reduced particles.js load for better performance
- **🧠 DOM Caching**: Minimized DOM queries for smoother experience
- **📦 Strategic Caching**: Enhanced service worker with resource-specific caching
- **📱 Mobile Optimizations**: Touch-friendly interactions and reduced CPU usage
- **🖥️ Desktop Enhancements**: Two-column layout and visual effects for desktop users

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository to your local machine
2. Navigate to the project directory
3. Install backend dependencies:

```bash
cd backend
npm install
```

### Running the Application

#### Frontend Only (Client-side storage)

Simply open the `index.html` file in your web browser to use the app with client-side storage.

#### With Backend (Server-side storage)

1. Start the backend server:

```bash
cd backend
npm start
```

2. Open your browser and go to `http://localhost:3000`

## Customizing Tasks

Tasks are hardcoded in the HTML files for easy editing. To modify tasks:

### For Kioma:

Open `kioma.html` and locate the task list section:

```html
<ul id="kioma-tasks">
    <li class="task-item">
        <label>
            <input type="checkbox" class="task-checkbox">
            <span class="task-text">Morning meditation for 10 minutes</span>
        </label>
    </li>
    <!-- Add or modify tasks here -->
</ul>
```

### For Takitsu:

Open `takitsu.html` and locate the task list section:

```html
<ul id="takitsu-tasks">
    <li class="task-item">
        <label>
            <input type="checkbox" class="task-checkbox">
            <span class="task-text">Morning workout routine</span>
        </label>
    </li>
    <!-- Add or modify tasks here -->
</ul>
```

To add a new task, simply add a new `<li>` element with the same structure.

## Timezone Configuration

When a user visits their page for the first time, they'll be prompted to select their timezone. This setting is saved in their browser's local storage and used to determine when tasks should reset (at midnight in their local timezone).

If you need to reset the timezone:

1. Clear browser storage for the site
2. Refresh the page
3. Select a new timezone

## Project Structure

```
anime-task-tracker/
├── assets/
│   ├── audio/     # Sound effects
│   ├── css/       # Stylesheets
│   ├── img/       # Images and avatars
│   └── js/        # JavaScript files
├── backend/       # Server-side code
├── index.html     # Landing page
├── kioma.html     # Kioma's tasks page
├── takitsu.html   # Takitsu's tasks page
└── README.md      # This file
```

## Customization Options

### Changing Themes

The app has custom themes for each user. To modify:

1. Edit `assets/css/style.css` to change base colors
2. Modify user-specific variables:
   - Kioma: `--accent-kioma: #ff6bcb;`
   - Takitsu: `--accent-takitsu: #4fc3f7;`

### Adding Sound Effects

Place new sound files in the `assets/audio/` directory and reference them in the JavaScript files:

```javascript
const newSound = new Audio('assets/audio/your-sound.mp3');
newSound.volume = 0.5;
newSound.play();
```

### Modifying Animations

Edit `assets/css/animations.css` to change the visual effects and animations.

## Console Easter Egg

Open your browser's console to discover a hidden easter egg! There's also a secret Konami code available on the home page. Can you find it?

## Technical Details

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Node.js with Express
- Storage: LocalStorage (client-side) + JSON files (server-side)
- Time Management: Luxon.js for timezone handling
- Animations: Custom CSS animations + Particles.js

## License

This project is private and intended for use only by Kioma and Takitsu.

---

Made with ❤️ and lots of anime inspiration!
