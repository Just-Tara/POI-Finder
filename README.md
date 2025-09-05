# 🌍 Interactive Map Search App

An interactive map application built with **React, Vite, Leaflet, and Mapbox**, that allows users to:

- Search for **places and addresses** using Mapbox Geocoding API.
- Explore **Points of Interest (POIs)** like Restaurants, Hospitals, Banks, Parks, etc. using **Overpass API (OpenStreetMap data)**.
- View results on the map with **custom markers**.
- Save and manage **search history**.
- Mobile and desktop responsive interface.

🚀 **Live Demo:** [View on GitHub Pages]()

---

## ✨ Features
- 🔎 Search by keyword or address  
- ⚡ Quick search for popular categories (Food, Shopping, Services, Education, Tourism)  
- 📍 Detects and centers around your current location  
- 🗂 Maintains search history (stored in localStorage)  
- 📱 Responsive design (works on mobile and desktop)  

---

## 🛠 Tech Stack
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)  
- [Leaflet](https://leafletjs.com/) for interactive maps  
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)  
- [Overpass API](https://overpass-api.de/) for POI search  
- [Tailwind CSS](https://tailwindcss.com/) for styling  

---

## 📂 Project Structure
├── public/ # Static assets
├── src/
│ ├── components/ # React components
│ ├── App.jsx # Main app
│ ├── main.jsx # Entry point
│ └── styles.css # Global styles
├── index.html
├── vite.config.js
├── package.json
└── README.md