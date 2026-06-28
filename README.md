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
VITE_KEYCLOAK_AUTHORITY=http://localhost:8081/realms/sprintstart
VITE_KEYCLOAK_CLIENT_ID=sprintstart-frontend
VITE_KEYCLOAK_REDIRECT_URI=http://localhost:5173
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
1.  **Access Keycloak Admin**: Go to [http://localhost:8081/admin](http://localhost:8081/admin).
    *   **Username**: `admin`
    *   **Password**: `admin` (or as set in your `.env`)
2.  **Create User**:
    *   Switch to the `sprintstart` realm.
    *   Go to **Users** -> **Add user**.
    *   After creating, go to the **Credentials** tab and set a password (turn off "Temporary").
3.  **Role Assignment**: Go to the **Role mapping** tab and ensure the user has the `USER` role (if required).
4.  **Login**: Now, when you open the frontend, you will be redirected to the Keycloak login page (8081). Once logged in, it will redirect back to the app, which then communicates with the **Backend** ([http://localhost:8080](http://localhost:8080)).

#### Option B: Mock User Bypass (Fast Development)
If you don't want to deal with Keycloak redirects:
1. Open the application in your browser.
2. Open the **Browser Console** (F12 -> Console).
3. Run:
   ```javascript
   sessionStorage.setItem('test-user-id', '39e6e571-a4f9-4d09-ab63-4762c93b6863');
   ```
4. Refresh the page. The app will bypass the login and act as the verified user.

### Data Ingestion
The **Data Ingestion** section shows source status, recent ingestion runs, and source details from the canonical backend endpoints.

*   **What works**: You can connect new GitHub repositories and see ingestion status once the backend reports runs through `/api/v1/ingestion-status` and `/api/v1/ingestion-runs`.
*   **Manual verification**: You can also verify repository connections through backend logs or the database:
    ```bash
    docker exec sprintstart-db psql -U sprintstart -d sprintstart -c "SELECT * FROM gh_repository_connections;"
    ```
