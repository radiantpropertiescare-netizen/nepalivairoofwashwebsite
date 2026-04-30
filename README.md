# Nepali Vai Roof Wash

A premium, responsive, lead-generation website designed for Nepali Vai Roof Wash, a professional roof restoration and exterior cleaning business based in Sydney, Australia.

## 🚀 Overview

This project is a fully functional static website designed to capture leads, showcase services, and highlight past projects through before/after transformations. The website is optimized for performance, fully responsive across all devices, and includes integrated contact forms.

## 🛠 Tech Stack

- **HTML5**: Semantic structure and accessibility.
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design. (Loaded via CDN)
- **Vanilla JavaScript**: Lightweight interactions for the mobile navigation menu and the before/after image slider.
- **Formsubmit**: Third-party form handler used to securely send leads and inquiries directly to `nepalivairoofwash@gmail.com` without needing a backend server.

## 📱 Features

- **Responsive Design**: Works perfectly on mobile phones, tablets, and desktop computers.
- **Dynamic Mobile Menu**: Slide-out hamburger navigation for smaller screens.
- **Lead Capture Forms**: Ready-to-use forms on the Home, Services, and Contact pages.
- **Interactive Before/After Slider**: Engaging visual element to showcase roof restoration results.
- **Modern UI**: Bento-grid layouts, smooth hover animations, and a cohesive, brand-aligned color palette.

## 📂 Project Structure

```text
├── index.html       # Homepage & hero section
├── about.html       # Company information
├── services.html    # Detailed breakdown of services
├── process.html     # Step-by-step restoration process
├── contact.html     # Dedicated contact page & info
├── get-quote.html   # Facebook Ads lead funnel — 6-step quote wizard
└── images/          # Directory containing all local assets
```

## 📋 Get Quote Page (`/get-quote`)

This is the **main lead generation funnel page**, designed as a Facebook Ads landing page.

### How it works
- **6-step wizard flow** — one question per screen, no distractions
- No header/navbar shown — users stay focused on completing the form
- Step 4 is **multi-select** (services); all other steps are single-select
- Validation popup shows exact text: `"Please select the options."`
- On submit, all answers are logged to the browser console (see below)

### Email / API integration
> ⚠️ Email is **not connected yet**.  
> All form data is stored in a JavaScript object and logged to the console on submit.  
> See the `// TODO: Connect Resend / Netlify Function later` comment in `get-quote.html`.

### Tracking data captured
Each submission automatically captures: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `timestamp`, `pageUrl`, `referrer`.

### Meta Pixel Integration
> ⚠️ Meta Pixel is **not added yet**.
> A Lead event will be added later only after the real Pixel ID is available. No fake tracking code has been added.

### Design
- **Mobile-first** — optimised for 320px–430px screens (Facebook Ads traffic)
- Clean wizard UI, large tap-friendly cards, no horizontal scroll
- Matches the existing site brand (Manrope + Inter fonts, red/blue palette)

## 🚀 How to View Locally

Because this is a static website, you don't need to install any heavy dependencies or databases. 

1. Clone this repository to your local machine.
2. Open any `.html` file directly in your web browser (e.g., double-click `index.html`).
3. Alternatively, for the best experience (and to test the forms), use a local server like `npx serve` or the Live Server extension in VS Code.

## 🌍 Deployment

This site is production-ready and built to be deployed on platforms like **Netlify**, **Vercel**, or **GitHub Pages**. Simply connect your GitHub repository to your chosen platform, and it will automatically deploy the static files.
