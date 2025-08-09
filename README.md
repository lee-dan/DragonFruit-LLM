# FailProof LLM Stress Testing Platform

An open-source platform for stress-testing Large Language Models (LLMs) to ensure they are reliable, secure, and accurate.

## Overview

This repository contains the full codebase for the FailProof platform, which includes:

-   A **Next.js frontend** for creating and monitoring test runs.
-   A **Python backend** (using FastAPI) for running the tests and analyzing the results.
-   Advanced failure detection, including hallucination detection, using a variety of techniques.

## Getting Started

Follow these instructions to get the FailProof platform running on your local machine for development and testing.

### Prerequisites

-   **Node.js** (v18 or later)
-   **Python** (v3.10 or later)
-   An **OpenAI API Key**

### 1. Set Up the Backend

First, you'll need to set up and run the Python backend.

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    -   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    -   On Windows:
        ```bash
        .\\venv\\Scripts\\activate
        ```

4.  **Install the required packages:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Create a `.env` file:**
    Create a new file named `.env` in the `backend` directory and add your OpenAI API key like this:
    ```
    OPENAI_API_KEY="your-api-key-here"
    ```

6.  **Run the backend server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will now be running at `http://localhost:8000`.

### 2. Set Up the Frontend

Next, set up and run the Next.js frontend in a separate terminal.

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```

2.  **Install the required packages:**
    ```bash
    npm install
    ```

3.  **Run the frontend server:**
    ```bash
    npm run dev
    ```
    The frontend will now be running at `http://localhost:3000`.

### 3. Start Testing!

You can now open your browser to `http://localhost:3000` to access the FailProof dashboard and start running your first tests.
