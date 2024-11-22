CREATE DATABASE pauling_db;
CREATE TABLE proteins (
    protein_name VARCHAR(255) PRIMARY KEY,
    protein_description TEXT,
    pdb_file TEXT
);