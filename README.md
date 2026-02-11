# Meraki Migration & Backup Tool

This is a utility for migrating Meraki network devices and for performing comprehensive configuration backups.

## Architecture

The application consists of two main parts:

1.  **Frontend**: A standalone static application built with React and TypeScript that runs in your browser. It handles the user interface and all workflow logic.
2.  **Backend**: A local Node.js server using Express.js that runs on your machine. The frontend sends all API requests to this local server, which then makes the actual calls to the Meraki Dashboard API.

This architecture is necessary to securely handle Meraki API credentials and to bypass browser CORS (Cross-Origin Resource Sharing) security restrictions during local development.

```
┌─────────────────────────┐      ┌───────────────────────────┐      ┌────────────────────────┐
│      User's Browser     │      │     Local Machine         │      │   Meraki Dashboard API │
│                         │      │                           │      │                        │
│  React Frontend App     ├──────┼─▶ Local Express.js Server ├──────┼─▶  (api.meraki.com)      │
│  (index.html)           │      │   (localhost:8787)        │      │                        │
│                         │◀─────┼───────────────────────────│◀─────┼── (JSON Response)        │
└─────────────────────────┘      └───────────────────────────┘      └────────────────────────┘
```

## Running the Application Locally

To use the tool, you must run both the backend proxy and the frontend.

### 1. Start the Backend Proxy

First, you need to start the local proxy server.

Navigate to the `backend` directory in your terminal and follow the instructions in the `backend/README.md` file. In summary:

```bash
cd backend
npm install
npm start
```

**Leave this terminal window open.** The proxy server must be running for the application to work.

### 2. Run the Frontend

Once the backend proxy is running, simply open the `index.html` file from the project's root directory in your web browser.

For the best experience, it's recommended to serve the file using a simple local web server, such as the "Live Server" extension for Visual Studio Code.
