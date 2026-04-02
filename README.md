# Exam Roadmap Dashboard

A comprehensive, dynamic web-based dashboard and API service tracking exam question mapping across multiple academic and public service pipelines. 

The primary goal of this application is to serve as a central directory for available Previous Year Questions (PYQs), track mock test integrations, and visualize data availability for different career pathways, handling historical anomalies such as years when exams were not conducted.

## 🚀 Features

- **Four Primary Exam Tracks:** Segregated and organized datasets for:
  - Banking Track (IBPS, SBI, etc.)
  - Govt Exams Track (UPSC, SSC, Defence, State PSC, etc.)
  - JEE / NEET Track (Engineering & Medical)
  - Tech Track (Core Programming, System Design, Backend, etc.)
- **Dynamic Year Parsing:** Frontend visually calculates a chronological hierarchy (from roughly 2010 to 2025) taking into mind metadata like varying year spans and skipping `not_conducted` years.
- **Micro-Animations & Smooth UI:** Sleek frontend utilizing Vanilla CSS & DOM manipulations to produce a high-fidelity user experience without bulky frameworks. 
- **Modular Data Seeding Pipeline:** Normalized JSON artifacts are robustly synchronized with a MongoDB cluster ensuring clean data injection without strictly constrained schema loss. 

## 🛠️ Technology Stack

**Frontend:**
- HTML5
- Vanilla JavaScript (`new.js`) 
- CSS3 Custom Styling System (`new.css`)

**Backend:**
- Node.js
- Express.js (REST API Routes)
- MongoDB Atlas (Database backend)
- Mongoose ODM (`strict: false` parsing architecture for flexible metadata representation)

## 📁 Project Structure

```text
/Course-Explorer
├── /data                    # Core Source of Truth for Database (JSON schemas)
│   ├── Banking Track.json
│   ├── Govt Exams Track.json
│   ├── JEE NEET Track.json
│   ├── tech track.json
│   └── _raw_csv_backups/    # Legacy archival files
├── /scripts                 # Database Synchronization pipelines
│   ├── seed_topics.js       # The primary data injestion agent
│   └── _archive/            # Deprecated data patching/utility scripts
├── .env                     # Contains PORT and MongoDB credentials 
├── new.css                  # UI Stylesheet 
├── new.js                   # Application state management & DOM controller
├── server.js                # Express API application core
└── index.html               # Frontend dashboard entry file
```

## 🔌 API Endpoints
The backend runs a local cross-origin REST server supplying essential metric aggregation for the frontend.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tracks` | GET | Fetch all available broad Exam Tracks |
| `/categories` | GET | List categories corresponding to a specific `track` parameter |
| `/exams` | GET | Filter all exam components mapped to a specific `category` |
| `/years` | GET | Retrieve synced year coverage linked within the `questions` aggregate |
| `/topic-meta` | GET | Returns crucial display metadata (`year_range`, `not_conducted`) for a specific exam title |

## ⚙️ How to Setup and Run

### 1. Prerequisites 
Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v14 or higher)
- A [MongoDB Data Cluster](https://www.mongodb.com/) (URI connection string)

### 2. Environment Variables
Create a `.env` file at the root repository mapping the configuration to your database:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/goverment_qb?retryWrites=true&w=majority
```

### 3. Installation
Install the necessary NPM modules:
```bash
npm install
```

### 4. Database Seeding
To normalize and build your initial state in the database, run the active script using the source JSON documents in `/data`:
```bash
node scripts/seed_topics.js
```

### 5. Running the Application
Spin up the persistent Express backend:
```bash
node server.js
```
The server will now accept connections. Open `index.html` in your favorite web browser using a local static asset runner to explore the application!

## 🧪 Ongoing Development
- Ensuring that newline `\r` carriage returns don't break strict URI component querying logic.
- Building upon the `tech track` specific metrics based on a mapped `5,000` completion goal problem ceiling.
