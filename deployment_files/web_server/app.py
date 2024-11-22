from flask import Flask, render_template, request, Response, abort
import psycopg2
from flask_cors import cross_origin
import os
import psycopg2

# Get the environment variable
DB_PASSWORD = os.getenv("DB_PASSWORD")

app = Flask(__name__)

# Database connection parameters
db_params = {
    'dbname': 'pauling_db',
    'user': 'postgres',
    'password': DB_PASSWORD,
    'host': 'pauling.crm4owq8k3sh.us-east-1.rds.amazonaws.com',  # or your database host
    'port': '5432'        # default PostgreSQL port
}

@app.route('/', methods=['GET', 'POST'])
def home(): 
    if request.method == 'POST':
        # Connect to the db
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        # Get the information
        search_term = request.form['search_term']
        cursor.execute("SELECT * FROM proteins WHERE protein_name = %s;", (search_term,))
        result = cursor.fetchall()
        # Close the connection
        cursor.close()
        conn.close()
        if len(result) == 0:
            return render_template('index.html')           
        result = result[0]
        name, description, pdb = result
        description = description.split('\n')[1:]
        return render_template('index.html', name=name, description=description, pdb=pdb)
    return render_template('index.html')

@app.route('/pdb', methods=['GET'])
@cross_origin()
def serve_pdb():
    # Get the protein name from query parameters
    protein_name = request.args.get('protein')
    # Check if use pass

    if not protein_name:
        return abort(400, description="Protein name is required")
    try:
        # Connect to the database
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()

        # Query to fetch the PDB file path or data
        query = "SELECT pdb_file_path FROM your_table WHERE protein_name = %s"       
        cursor.execute("SELECT pdb_file FROM proteins WHERE protein_name = %s;", (protein_name,))
        result = cursor.fetchone()
        # Close the database connection
        cursor.close()
        conn.close()

        if result is None:
            return abort(404, description="Protein not found")

        pdb_content = result[0]

        # Create a response with the PDB content
        return Response(
            pdb_content,
            mimetype='text/plain',  # Set the MIME type for PDB files
            headers={"Content-Disposition": f"attachment;filename={protein_name}.pdb"}  # Set the filename for download
        )
    except Exception as e:
        return abort(500, description=str(e))
    
if __name__ == '__main__':
    app.run(debug=True)
    
