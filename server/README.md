# Meraki API Proxy (Local Backend)

This directory contains a simple Node.js Express server that acts as a local proxy for the Meraki Dashboard API. It forwards API requests from the frontend to securely handle credentials and CORS.

## Running the Local Proxy

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher) and `npm` installed.

### 1. Install Dependencies

From within this `backend` directory, install the required packages. This only needs to be done once.

```bash
npm install
```

### 2. Start the Server

Once dependencies are installed, you can start the local development server.

```bash
npm start
```

This will start the proxy on `http://127.0.0.1:8787`.

**Important:** You must keep this terminal window open and the server running while you are using the frontend application.
