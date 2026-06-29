# 🚀 BigQuery Release Notes Explorer & Tweeter

A modern, responsive, dark-mode web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches Google BigQuery release notes and lets you search, filter, and easily Tweet about any specific update.

---

## ✨ Features

*   **🔄 Live XML Parsing:** Automatically fetches and processes the latest updates from the official [BigQuery Release Notes feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml).
*   **🧩 Smart Segmentation:** Splits aggregated daily release posts into discrete, individual updates grouped by type (e.g., *Feature*, *Change*, *Deprecated*, *Breaking Change*).
*   **🎨 Premium Glassmorphism UI:** Sleek dark-mode aesthetic featuring deep blue/violet glow highlights, vibrant badge categories, and smooth micro-animations.
*   **🔍 Search & Filter:** Real-time keyword search and categorical filtering.
*   **🐦 X (Twitter) Web Intent Integration:**
    *   Direct one-click sharing on X for individual cards.
    *   Select card mode with a floating bottom action drawer.
    *   Includes a custom Tweet preview modal with a live character count (280-character limit check) to customize posts before publishing.

---

## 🛠️ Tech Stack

*   **Backend:** Python 3, Flask, Requests, BeautifulSoup4
*   **Frontend:** Vanilla HTML5, Vanilla CSS3 (custom variables, keyframes), Vanilla JavaScript (ES6+), FontAwesome Icons

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have Python 3 installed on your machine.

### ⚙️ Installation
1. Clone this repository and navigate to the directory:
   ```bash
   git clone https://github.com/mayankudapurkar/bigquery-release-notes-tweeter.git
   cd bigquery-release-notes-tweeter
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Or manually: `pip install flask requests beautifulsoup4`)*

3. Start the Flask server:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

---

## 📂 Project Structure

```text
├── app.py                  # Flask backend & XML parsing engine
├── README.md               # Repository documentation
├── .gitignore              # Ignored files (pycache, envs, IDEs)
├── templates/
│   └── index.html          # Web page structural layout
└── static/
    ├── css/
    │   └── style.css       # Core styling & design token rules
    └── js/
        └── app.js          # Client-side dynamic interaction logic
```
