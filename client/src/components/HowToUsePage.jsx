import React from 'react';

export default function HowToUsePage() {
  return (
    <>
      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #ddd', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1565c0', marginBottom: '1.5rem' }}>FlavourDB Overview</h2>
        
        <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.7, marginBottom: '1.2rem' }}>
          FlavorDB is a resource with extensive coverage of 25595 flavor molecules. Among molecules listed in the database, 2254 have been reported to be found in 936 natural entities/ingredients. These natural ingredients have further been classified into 34 categories, and mapped to 527 distinct natural sources. An additional 13869 compounds were identified as synthetic. For the remaining 9472 molecules no specific source could be ascertained. The features provided as part of the detailed molecular and flavor profiles of these compounds have an impact on their taste and odor through gustatory and olfactory sensory mechanisms.
        </p>

        <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.7, marginBottom: '1.2rem' }}>
          FlavorDB offers a user-friendly interface for querying and browsing flavor molecules, entities/ingredients, natural sources, as well as performing flavor pairing. Interactive data visualizations such as the flavor network and interlinked search options are provided to retrieve relevant information. Apart from searching via textual query or by drawing the chemical structure, FlavorDB also provides a ‘Visual Search’. Using this a user can interactively browse through the ingredient categories to access corresponding natural entities and subsequently obtain details of their flavor molecules.
        </p>

        <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.7 }}>
          For any flavor molecule, the resource also facilitates lookup for structurally similar molecules within the database as well as those commercially available from external sources (ZINC). Thus, through a blend of the entity and flavor space along with a dynamic interface and visualizations, FlavorDB provides a wide spectrum of information facilitating insights into the flavor universe.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#555' }}>
        <strong>We are currently working on detailed tutorials for usage guidelines.</strong>
      </div>
    </>
  );
}
