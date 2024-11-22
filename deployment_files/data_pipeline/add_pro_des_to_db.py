import os
import psycopg2

# Get the environment variable
DB_PASSWORD = os.getenv('DB_PASSWORD')

# Database connection parameters
db_params = {
    'dbname': 'pauling_db',
    'user': 'postgres',
    'password': DB_PASSWORD,
    'host': 'pauling.crm4owq8k3sh.us-east-1.rds.amazonaws.com',  # or your database host
    'port': '5432'        # default PostgreSQL port
}

# Connect to the database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

# Path to the folder containing .text files
data_folder = './data/wikicrow2'

# Loop through all .text files in the specified folder
for filename in os.listdir(data_folder):
    if filename.endswith('.txt'):
        protein_name = filename[:-4]  # Remove the '.text' extension
        file_path = os.path.join(data_folder, filename)

        # Read the content of the file
        with open(file_path, 'r', encoding='utf-8') as file:
            protein_description = file.read()

        # Insert data into the database
        try:
            cursor.execute("""
                INSERT INTO proteins (protein_name, protein_description)
                VALUES (%s, %s)
                ON CONFLICT (protein_name) DO NOTHING;  -- Prevent duplicates
            """, (protein_name, protein_description))
        except Exception as e:
            print(f"Error inserting {protein_name}: {e}")            
        print(protein_name)    

# Commit the transaction and close the connection
conn.commit()
cursor.close()
conn.close()

print("Data insertion complete.")