import mysql.connector
import os

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def connect_to_db():
    print("--- Python DB Connection Check ---")
    
    # Configuration - Reads from ENV or uses Defaults
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'simfraud_db')
    }
    
    print(f"Target: {config['user']}@{config['host']}/{config['database']}")

    try:
        # Connect
        db = mysql.connector.connect(**config)
        
        if db.is_connected():
            print("✅ Connected to MySQL Database successfully!")
            
            cursor = db.cursor()
            
            # Simple Verification Query
            cursor.execute("SELECT COUNT(*) FROM SIMFraudUserProfile")
            result = cursor.fetchone()
            print(f"   Current User Count: {result[0]}")
            
            # Check for recent transactions
            cursor.execute("SELECT COUNT(*) FROM SIMFraudTransaction")
            tx_result = cursor.fetchone()
            print(f"   Transaction Count: {tx_result[0]}")
            
            cursor.close()
            db.close()
            print("--- Connection Closed ---")
            
    except mysql.connector.Error as err:
        print(f"❌ Connection Failed: {err}")
        print("\nTip: Ensure you have installed the connector:")
        print("     pip install mysql-connector-python")

if __name__ == "__main__":
    connect_to_db()
