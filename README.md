This is Frontend Branch
# sprintstart-frontend

## Setup Guide

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository and navigate into the project folder:
   ```bash
   cd sprintstart-frontend
   ```
2. Install the project dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root of the `sprintstart-frontend` directory with the following configuration:

```env
# Keycloak Configuration
VITE_KEYCLOAK_AUTHORITY=http://localhost:8081/auth/realms/sprintstart
VITE_KEYCLOAK_CLIENT_ID=sprintstart-frontend
#5173 if started with npm run dev
VITE_KEYCLOAK_REDIRECT_URI=http://localhost:3000

#Github token (classic)
VITE_GITHUB_PAT=ghp_yor_token
```

### Development

To start the local development server, run:

```bash
npm run dev
```
The application will be accessible in your browser at: **http://localhost:5173/**


### One Command Start

To start the local deployment via docker compose in command, run:

```bash
docker compose up --build
```
The application will be accessible in your browser at: **http://localhost:3000/**

---

## 🛠️ Developer Notes

### 🔑 Authentication & User Setup

The application uses **Keycloak** for Identity and Access Management. There are two ways to get started:

#### Option A: Create a Real User (Full Flow)
To test the full login experience:
1.  **Access Keycloak Admin**: Go to [http://localhost:8081](http://localhost:8081/admin).
    *   **Username**: `admin`
    *   **Password**: `admin` (or as set in your `.env`)
2.  **Create User**:
    *   Switch to the `sprintstart` realm.
    *   Go to **Users** -> **Add user**.
    *   After creating, go to the **Credentials** tab and set a password (turn off "Temporary").
3.  **Role Assignment**: Go to the **Role mapping** tab.
    *   **For regular users**: Ensure the user has the `USER` role.
    *   **For administrators**: Click **Assign role**, change the filter dropdown to **Filter by realm roles**, select `ADMIN`, and save.
4.  **Login**: Now, when you open the frontend, you will be redirected to the Keycloak login page (8081). Once logged in, it will redirect back to the app, which then communicates with the **Backend** ([http://localhost:8080](http://localhost:8080)).
