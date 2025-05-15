"""
Server Starter Script for FinPath Insight
This script helps set up the environment, start the server, and run tests
"""

import os
import sys
import subprocess
import time
import asyncio
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent))

# Check if .env file exists
env_file = Path(__file__).parent / ".env"
if not env_file.exists():
    print("No .env file found. Running setup_env.py to create one...")
    try:
        subprocess.run([sys.executable, "setup_env.py"], check=True)
    except subprocess.CalledProcessError:
        print("Failed to set up environment. Please run setup_env.py manually.")
        sys.exit(1)

def start_server():
    """Start the FastAPI server"""
    print("\n=== Starting FastAPI Server ===\n")
    
    # Start the server as a subprocess
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(Path(__file__).parent)
    )
    
    # Wait for the server to start
    print("Waiting for server to start...")
    time.sleep(5)
    
    return server_process

def run_tests():
    """Run the API tests"""
    print("\n=== Running API Tests ===\n")
    
    try:
        # Run the test script
        subprocess.run([sys.executable, "test_api.py"], check=True)
        print("\nTests completed successfully!")
    except subprocess.CalledProcessError:
        print("\nSome tests failed. Check the output for details.")

def setup_database():
    """Set up the database tables"""
    print("\n=== Setting Up Database ===\n")
    
    try:
        # Run the database setup script
        subprocess.run([sys.executable, "-m", "app.scripts.update_database"], check=True)
        print("\nDatabase setup completed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("\nDatabase setup failed. Check the output for details.")
        return False

def main():
    """Main function to run the server and tests"""
    # First, set up the database
    db_success = setup_database()
    if not db_success:
        print("Database setup failed. Do you want to continue? (y/n)")
        choice = input().lower()
        if choice != 'y':
            print("Exiting...")
            return
    
    # Start the server
    server_process = start_server()
    
    try:
        # Run the tests
        print("\nDo you want to run the API tests? (y/n)")
        choice = input().lower()
        if choice == 'y':
            run_tests()
        
        # Keep the server running
        print("\nServer is running at http://localhost:8000")
        print("Press Ctrl+C to stop the server...")
        
        # Wait for the server process to complete (or be interrupted)
        server_process.wait()
    
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        # Make sure to terminate the server process
        server_process.terminate()
        print("Server stopped.")

if __name__ == "__main__":
    main()
