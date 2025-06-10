#!/usr/bin/env python3
import os
import sys
import subprocess
import webbrowser
import time
import signal
import platform

def is_python_installed():
    """Check if Python is installed and version >= 3.8"""
    if sys.version_info[0] < 3 or (sys.version_info[0] == 3 and sys.version_info[1] < 8):
        print("Error: Python 3.8 or higher is required")
        return False
    return True

def check_requirements():
    """Check if all requirements are installed"""
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], 
                      check=True)
        return True
    except subprocess.CalledProcessError:
        print("Error: Failed to install requirements")
        return False

def start_backend():
    """Start the Flask backend server"""
    os.chdir('backend')
    if platform.system() == 'Windows':
        return subprocess.Popen([sys.executable, 'app.py'])
    return subprocess.Popen([sys.executable, 'app.py'])

def start_frontend():
    """Start a simple HTTP server for the frontend"""
    os.chdir('../frontend')
    port = 8100
    if platform.system() == 'Windows':
        return subprocess.Popen([sys.executable, '-m', 'http.server', str(port)])
    return subprocess.Popen([sys.executable, '-m', 'http.server', str(port)])

def main():
    """Main function to run the application"""
    # Check Python version
    if not is_python_installed():
        sys.exit(1)

    # Store the original directory
    original_dir = os.getcwd()

    print("\n=== TumorXtract Setup ===")
    print("Checking requirements...")
    
    # Install requirements
    if not check_requirements():
        sys.exit(1)

    print("\nStarting servers...")
    
    try:
        # Start backend
        backend_process = start_backend()
        print("Backend server starting...")
        time.sleep(2)  # Give the backend time to start

        # Start frontend
        frontend_process = start_frontend()
        print("Frontend server starting...")
        time.sleep(1)

        # Open browser
        print("\nOpening application in browser...")
        webbrowser.open('http://localhost:8000')

        print("\n=== TumorXtract is running ===")
        print("Backend URL: http://localhost:5000")
        print("Frontend URL: http://localhost:8000")
        print("\nPress Ctrl+C to stop the servers")

        # Wait for keyboard interrupt
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down servers...")
        
        # Clean up processes
        if platform.system() == 'Windows':
            backend_process.terminate()
            frontend_process.terminate()
        else:
            os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
            os.killpg(os.getpgid(frontend_process.pid), signal.SIGTERM)

        # Return to original directory
        os.chdir(original_dir)
        print("Servers stopped successfully")

    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
