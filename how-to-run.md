# How to Run TumorXtract

This guide provides instructions on how to set up and run the TumorXtract project, which consists of a .NET Core backend API, a Flask AI service, and a static HTML/CSS/JavaScript frontend.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**: For cloning the repository.
*   **.NET SDK (6.0 or higher)**: The backend API is built with ASP.NET Core.
*   **Python (3.8 or higher)**: The AI service is a Flask application. 
*   **SQL Server (or SQL Server Express/LocalDB)**: The .NET backend uses SQL Server for its database.
*   **SQL Server Management Studio (SSMS)**

## 2. Project Structure

The project is organized into the following main directories:

*   `backend/AiService/`: Contains the Flask application for AI model inference.
*   `backend/TumorXtract/`: Contains the ASP.NET Core API solution.
*   `frontend/`: Contains the static HTML, CSS, and JavaScript files for the user interface.
*   `AI/`: Contains the AI model files (`.h5`).
*   `Database/`: Contains the SQL Server database backup file (`.bak`).

## 3. Setup Instructions

### 3.1. Flask AI Service Setup

1.  **Navigate to AI Service Directory**:
    ```bash
    cd backend/AiService/backend
    ```
2.  **Create a Python Virtual Environment**:
    ```bash
    python -m venv venv
    ```
3.  **Activate the Virtual Environment**:
    *   **Windows**:
        ```bash
        .\venv\Scripts\activate
        ```
4.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    This will install `flask`, `flask-cors`, `numpy`, `tensorflow`, `Pillow`, and `opencv-python`.
### 3.3. ASP.NET Core Backend API Setup

1.  **Navigate to API Project Directory**:
    ```bash
    cd backend/TumorXtract/TumorXtract.Solution/TumorXtract.APIs
    ```
2.  **Restore .NET Dependencies**:
    ```bash
    dotnet restore
    ```
3.  **Build the Project**:
    ```bash
    dotnet build
    ```

### 3.4. Frontend Setup

The frontend is a static web application (HTML, CSS, JavaScript). No specific build steps are required. It can be served by any static file server.

## 4. Running the Application

The project includes a `run.py` script in the root directory that can start the Flask AI service 

1.  **Ensure all prerequisites and setup steps are completed.**
2.  **Navigate to the project root directory**:
    ```bash
    cd d:/TumorXtract-F
    ```
3.  **Run the main script**:
    ```bash
    python run.py
    ```

This script will:
*   Check for Python version and install Python dependencies for the AI service.
*   Start the Flask AI service on `http://localhost:5000`.
### Alternative: Running Components Separately

You can also run each component individually:

#### 4.1. Running Flask AI Service

1.  **Navigate to AI Service Directory**:
    ```bash
    cd backend/AiService/backend
    ```
2.  **Activate Virtual Environment**:
    *   **Windows**: `.\venv\Scripts\activate`
    *   **macOS/Linux**: `source venv/bin/activate`
3.  **Run the Flask app**:
    ```bash
    python app.py
    ```
    The AI service will run on `http://localhost:5000`.

#### 4.2. Running ASP.NET Core Backend API

1.  **Navigate to API Project Directory**:
    ```bash
    cd backend/TumorXtract/TumorXtract.Solution/TumorXtract.APIs
    ```
2.  **Run the API**:
    ```bash
    dotnet run
    ```

#### 4.3. Running Frontend

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    ```
2.  **Start a simple HTTP server**:
    ```bash
    python -m http.server 8000
    ```
    (Requires Python installed)
    Alternatively, you can use a VS Code extension like "Live Server" to serve the `frontend` directory.