import { useState } from 'react'
import './App.css'

function App() {
  const [justEnter, setJustEnter] = useState(true);
  const [proteinName, setProteinName] = useState('');
  const [isProteinFound, setIsProteinFound] = useState(false);
  const [showedProteinNameSearch, setShowedProteinNameSearch] = useState('');
  const [showedProteinDescription, setShowedProteinDescription] = useState('');
  var proteinNameSearch
  // Handle the submit button
  const handleSubmitForSearch = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission
    // API call to search for protein data
    try {
      // Clean the entry
      proteinNameSearch = proteinName.replace(/\s+/g, '').toUpperCase();
      // Get desciption
      const response = await fetch('https://kk0y3yt53j.execute-api.eu-west-2.amazonaws.com/prod/protein_search_get_protein_description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ protein_name: proteinNameSearch }), // Adjust according to the API's expected request body
      });
      // Get the data
      const proteinDescriptionFromDB = await response.json();
      if (response.ok) {
        setShowedProteinNameSearch(proteinNameSearch);
        setShowedProteinDescription(proteinDescriptionFromDB);
        setIsProteinFound(true);
      } else {
        setShowedProteinNameSearch('');
        setShowedProteinDescription('');
        setIsProteinFound(false);
      }
    } catch (error) {
      console.error("Error fetching protein data:", error);
      setIsProteinFound(false);
    } finally {
      setJustEnter(false); // Update state to indicate that the user has entered a search term
    }
  };


  // Variable to hold the rendered content
  let content;

  if (justEnter) {
    content = (<>
      <p>Please enter a protein name to search.</p>
      <p style={{ marginTop: '-20px', fontSize: '0.8rem', textAlign: 'center' }}>
        If you don't have anything in mind, here are a few suggestions: A2M, NEDD8, PWWP3B, ST6GALNAC6.
      </p>
    </>
    );
  } else if (isProteinFound) {
    content = (
      <>
        <h2>Search Results</h2>
        <div>
          <strong>Name:</strong> {showedProteinNameSearch}
        </div>
        <br />
        <strong>Description:</strong>
        <div className="scrollable-text">
          {showedProteinDescription.split('\n').map((line, index) => {
            if (line.startsWith('##')) {
              return <h3 key={index}>{line.substring(3)}</h3>; // Remove "## " and render as h2
            } else if (line.startsWith('# ')) {
              return <h2 key={index}>{line.substring(2)}</h2>; // Remove "# " and render as h1
            } else {
              return <p key={index}>{line}</p>; // Render as paragraph
            }
          })}
        </div>
        <br />
        <strong>3D model:</strong>
        <iframe id="molstar-iframe"
          width="100%"
          height="600"
          frameBorder="0"
          src={"https://molstar.org/viewer/?structure-url=https://kk0y3yt53j.execute-api.eu-west-2.amazonaws.com/prod/protein_search_get_pdb?protein_name=" + showedProteinNameSearch + "&structure-url-format=pdb&structure-url-is-binary=0&hide-controls=1"}
          allowFullScreen={false}>
        </iframe>;
      </>
    );
  } else {
    content = (
      <p style={{ textAlign: 'center' }}>No results found. Try these Protein: A1BG CSN2 IL1R2</p>
    );
  }

  return (
    <div className="container">
      <h1>Search for a Protein</h1>
      {/* Add the download link for all protein names */}
      <p style={{ marginTop: '-20px', fontSize: '1rem', textAlign: 'center' }}>
        <a href="/all_proteins.csv" download>See all protein names available in the database</a>
      </p>
      <form method="POST" style={{ alignItems: 'center' }}>
        <input type="text"
          name="search_term"
          placeholder="Enter a protein name"
          value={proteinName}
          onChange={(e) => setProteinName(e.target.value)}
          required />
        <button type="submit" onClick={handleSubmitForSearch}>Search</button>
      </form>
      {content}
    </div>
  );
}

export default App
