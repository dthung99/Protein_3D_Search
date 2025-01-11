import pkg from 'pg';  // Import the entire module
const { Client } = pkg;  // Destructure the Client class

export const handler = async (event) => {
    const corsOrigin = 'https://proteinsearch.dthung.com';
    try {
        if (event.httpMethod !== 'POST') {
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
    // Use this code snippet in your app.
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
        const protein_name = JSON.parse(event.body)['protein_name'];
        const protein_description = await client.query(`
        SELECT protein_description 
        FROM proteins 
        WHERE protein_name = $1;
    `, [protein_name]);

        // Check if the protein was found
        if (protein_description.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                },
                body: JSON.stringify({ message: 'Protein not found' }),
            };
        }
        // Return the protein description
        const protein_description_result = protein_description.rows[0].protein_description;
        // Set up the response
        response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
            },
            body: JSON.stringify(protein_description_result),
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
