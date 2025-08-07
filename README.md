# StudyGuardianBot

## Pitch  
Our Telegram bot, StudyGuardianBot, helps users stay focused and motivated by providing a customizable Pomodoro timer, task management, motivational quotes, and reminders. It simplifies study sessions with pause, break, and resume functionality to boost productivity.

## Setup Instructions  
1. Clone the repository  
2. Run `npm install` to install dependencies  
3. Create a `.env` file with your Telegram bot token:  
   `BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE`  
4. Run `node index.js` to start the bot

## Features and Usage
- `/start` – Greets the user and introduces the bot  
- `/help` – Lists all available commands  
- `/study` – Starts a 25‑minute Pomodoro focus session  
- `/pause` – Pauses the current study timer  
- `/resume` – Resumes a paused session  
- `/break` – Starts a 5‑minute break  
- `/stop` – Cancels the current session and resets timers  
- `/quote` – Sends a random motivational quote  
- `/todo` – Manage a to‑do list (add, view, remove tasks)  
- `/clear` – Clears all tasks from the to‑do list  
- `/reminder` – Sets a timed reminder (e.g. `/reminder 10 Stretch!`)  

The bot tracks each user’s study sessions in memory.

## Demo:
https://www.awesomescreenshot.com/video/42889386?key=c94972ac4a25ead77d69318721faf3c2

# TelegramBotProject
