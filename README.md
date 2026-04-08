# 🗓️ Interactive Wall Calendar Component

A highly interactive, production-ready wall calendar component built with Next.js, Tailwind CSS, and `date-fns`. 

This project goes beyond a simple date picker by integrating a physical "wall calendar" aesthetic with modern SaaS features like drag-to-select, data export, strict booking logic, and dynamic seasonal theming based on the Indian climatic calendar.

## 🔗 Submission Links
* **Video Demonstration:** https://drive.google.com/file/d/1V-vl1F3ATQaRmImEk_oOO0-Yv4L60oVL/view?usp=sharing
* **Live Demo:** https://calender-take-u-forward.vercel.app/

## ✨ Key Features & Technical Choices

### 1. Wall Calendar Aesthetic & Dynamic Theming
* **Structure:** Adheres to the physical wall calendar inspiration, featuring a prominent hero image anchoring the date grid and a dedicated workspace below.
* **Seasonal Context (Indian Climate):** The application parses the currently viewed month and dynamically updates both the hero image and the Tailwind UI color palette (e.g., Emerald for Monsoon, Amber for Summer) to match the season.
* **Framer Motion Integration:** Implemented performant `spring` animations for sliding between months, mimicking the physical act of flipping a calendar page.

### 2. Advanced Range Selection
* **Fluid Drag-and-Select:** Moved beyond standard click-to-select by implementing native `onMouseDown` and `onMouseEnter` events for a buttery-smooth, drag-to-highlight user experience.
* **Smart Calculation:** Automatically calculates and displays the duration of the selected range dynamically.

### 3. Production-Ready Business Logic
* **Strict Booking Toggle:** A UI constraint that prevents users from selecting dates in the past, demonstrating the ability to handle real-world booking logic and conditional styling.
* **Data Export:** Utilizes native browser `Blob` APIs to allow users to export their selected range and notes into a beautifully formatted, downloadable `.txt` file.
* **Auto-Save Notes:** Memos are saved locally to `localStorage` using a custom debounce hook to prevent excessive read/writes, complete with an animated syncing indicator.
* **Keyboard Shortcuts:** Added global event listeners for power users (`T` for Today, `Left/Right Arrows` for navigation, `Esc` to clear selection).

### 4. Localization & Context
* **Indian Formatting:** The week starts on Monday (the standard Indian working week).
* **Festivals & Holidays:** Includes localized holiday markers (e.g., Republic Day, Diwali, Independence Day) injected seamlessly into the grid that adapt to the active theme's contrast requirements.

## 🛠️ Tech Stack
* **Framework:** React / Next.js (App Router)
* **Styling:** Tailwind CSS (Utility-first for responsive, maintainable design)
* **Date Logic:** `date-fns` (Chosen for its modularity, performance, and immutability compared to raw JS dates)
* **Animations:** `framer-motion`
* **Icons:** `lucide-react`

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-link>

2.Navigate to the project directory:

 ```bash
cd calendar-challenge
Install dependencies:
```

```bash
npm install
Start the development server:
```
 ```bash
npm run dev
```

5.Open http://localhost:3000 in your browser to view the application.
