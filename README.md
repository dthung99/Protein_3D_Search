# Protein Structure Search Engine

This is a web server application built using Flask and Gunicorn for viewing Protein structures.

## Development

Only code used in deployment on AWS is provided.

## Deployment

The application is deployed on AWS using the following steps:

1. **Databases**:
   - Create a database and a new table based on the SQL queries in [deployment_files/SQL_queries.sql](deployment_files/SQL_queries.sql).

2. **Data Pipeline**: The [data_pipeline](deployment_files/data_pipeline) folder contains the scripts to interact with the database. To run the pipeline, execute the following steps:
   - Download data from this Google Cloud Storage: `gs://fh-public/wikicrow2` to [deployment_files/data_pipeline/data/wikicrow2](deployment_files/data_pipeline/data/wikicrow2).
   - Use [add_pro_des_to_db.py](deployment_files/data_pipeline/add_pro_des_to_db.py) to add the protein names and descriptions from the [data/wikicrow2](deployment_files/data_pipeline/data/wikicrow2).
   - Use [add_pdb_to_db.py](deployment_files/data_pipeline/add_pdb_to_db.py) to fetch the PDB file for the 3D model from the internet.
   - Use [pipeline_report.log](deployment_files/data_pipeline/pipeline_report.log) contains information about the pipelines. In the pipelines I couldn't find 3D model of around 1300/20000 proteins (~7%).

3. **Web Server**: The [web_server](deployment_files/web_server) folder contains the Flask application and related files. To run the web server, follow these steps:
   - Ensure Gunicorn is installed.
   - Set up an SSL certificate from Let's Encrypt.
   - Start the Gunicorn server with the following command:
     ```bash
     sudo DB_PASSWORD=<YOUR_PASSWORD_FOR_DB> gunicorn --bind 0.0.0.0:443 --certfile=/etc/letsencrypt/live/dthung.xyz/fullchain.pem --keyfile=/etc/letsencrypt/live/dthung.xyz/privkey.pem app:app
     ```
   - This command will start the Gunicorn server and host it on HTTPS.
   - **NOTE**: HTTPS is required as the 3D viewer is an embedded window fetched from another HTTPS source.