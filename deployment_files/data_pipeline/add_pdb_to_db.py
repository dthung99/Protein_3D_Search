import psycopg2
import apache_beam
import requests
import logging
import time
import os

# Get the environment variable
DB_PASSWORD = os.getenv('DB_PASSWORD')


# Configure logging
logging.basicConfig(filename='./pipeline_report.log', level=logging.INFO)

# Database connection parameters
db_params = {
    'dbname': 'pauling_db',
    'user': 'postgres',
    'password': DB_PASSWORD,
    'host': 'pauling.crm4owq8k3sh.us-east-1.rds.amazonaws.com',  # or your database host
    'port': '5432'        # default PostgreSQL port
}

# Function to download PDB files
def download_pdb(protein_name):
    # Download from rcsb first
    pdb_url = f"https://files.rcsb.org/download/{protein_name}.pdb"
    response = requests.get(pdb_url)

    # Download from AlphaFold if failed
    if response.status_code == 200:
        return (protein_name, response.content)
    else:
        # Get the accession from uniprot
        uniprot_base_url = "https://rest.uniprot.org/uniprotkb/search"
        params = {
            'query': protein_name,
            'format': 'json',
            'size': 1  # Retrieve only first result
        }        
        try: 
            response = requests.get(uniprot_base_url, params=params)
            primaryAccession = response.json()['results'][0]['primaryAccession']
            # Download the pdb
            pdb_url = f"https://alphafold.ebi.ac.uk/files/AF-{primaryAccession}-F1-model_v4.pdb"
            response = requests.get(pdb_url)
            # Download from AlphaFold if failed
            if response.status_code == 200:
                return (protein_name, response.content)
            else:
                logging.info(f"Cannot find Protein: {protein_name}")
                return None
            
        except requests.exceptions.Timeout:
            logging.info(f"Timeout for {protein_name}")
            return None
        except Exception as e:
            logging.info(f"Cannot find Accession for: {protein_name}")
            return None

# Function to insert into PostgreSQL using the connection pool
def insert_into_db(protein_data):
    if protein_data is None:
        return  # Skip None entries

    # Connect to the database 
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    # Update the db
    try:
        protein_name, pdb_file = protein_data
        pdb_file = pdb_file.decode('utf-8')
        cursor.execute(
            """
            UPDATE proteins
            SET pdb_file = %s
            WHERE protein_name = %s AND pdb_file IS NULL;
            """,
            (pdb_file, protein_name)
            )
        conn.commit()
    except Exception as e:
        logging.info(f"Error adding pdb: {e} for {protein_name}")
    # Close the cursor and connection
    if cursor:
        cursor.close()
    if conn:
        conn.close()

def get_all_protein_names():
    # Connect to the database 
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    # Execute the query to fetch all protein names
    cursor.execute("SELECT protein_name FROM proteins;")
    # Fetch all results and store in a list
    protein_names = [(row[0],) for row in cursor.fetchall()]
    # Close the cursor and connection
    cursor.close()
    conn.close()
    return protein_names

test_proteins = [('A1CF'), ('A1BG'),]
all_proteins = get_all_protein_names()

start_time = time.time()

with apache_beam.Pipeline() as pipeline:    
    (
        pipeline
        | 'Read Proteins' >> apache_beam.Create(all_proteins)
        | 'Download PDB Files' >> apache_beam.Map(download_pdb)
        | 'Filter None' >> apache_beam.Filter(lambda x: x is not None)
        | 'Insert into DB' >> apache_beam.Map(insert_into_db)
    )

end_time = time.time()
execution_time = end_time - start_time
logging.info(f"Execution time: {execution_time:.2f} seconds")
