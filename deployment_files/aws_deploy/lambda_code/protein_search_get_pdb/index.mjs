import pkg from 'pg';  // Import the entire module
const { Client } = pkg;  // Destructure the Client class

export const handler = async (event) => {
    const corsOrigin = 'https://molstar.org';
    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405, // Method Not Allowed
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                },
                body: JSON.stringify({ message: 'Method ' + event.httpMethod + ' Not Allowed' }),
            };
        };
    } catch (error) {
        console.error('Error checking request method:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
            },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
    let res
    let response; // Declare response at the top
    // Declare the db
    const client = new Client({
        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
        database: process.env.db,  // Ensure this is a string
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });
    try {
        await client.connect();  // Connect to the database
        // Database query logic here
        // Execute query to get the protein desciption
        const protein_name = event.queryStringParameters['protein_name'];
        const pdb_file = await client.query(`
        SELECT pdb_file 
        FROM proteins 
        WHERE protein_name = $1;
    `, [protein_name]);

        // Check if the protein was found
        if (pdb_file.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                },
                body: JSON.stringify({ message: 'Protein not found' }),
            };
        }
        // Return the pdb_file
        const pdb_file_result = pdb_file.rows[0].pdb_file;
        // Set up the response
        response = {
            statusCode: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${protein_name}.pdb"`,
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': corsOrigin,
            },
            body: pdb_file_result,
        };
    } catch (err) {
        console.error('Connection error', err.stack);
        response = {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
            },
            body: JSON.stringify('Database connection error'),
        };
    } finally {
        await client.end();  // End the connection
    }
    return response;
};
