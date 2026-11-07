# Contributing to Bomb Jack 💣

Thank you for your interest in improving Bomb Jack! Contributions, bug fixes, and especially **custom levels** are very welcome.

## 🗺️ How to Contribute a New Level

The easiest way to create a level is using the built-in **Visual Level Editor**:
1. Run the game locally (`npm install` then `npm run dev`).
2. Press `E` on the main menu to open the **Level Editor**.
3. Design your platform layout, place bombs, drop enemies (`Walker`, `Flier`, `Bouncer`), and set a player spawn (`S`).
4. Click **"Download level.js"** or **"Copy to Clipboard"** from the sidebar toolbar.
5. Save the file into `src/levels/levelN.js` (incrementing N to match the next sequence).
6. Register your new level in `src/config/levels.js` by importing it and adding it to the `LEVELS` array.
7. Test it locally by running through the game!

## 🚀 Submitting a Pull Request
1. Fork the repository and create your branch from `master`.
2. Ensure your code builds cleanly (`npm run build`).
3. Open a Pull Request with a clear description of your changes or the theme of your custom level.