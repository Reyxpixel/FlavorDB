import React from 'react';

export default function ContactPage() {
  return (
    <div className="legacy-container">
      <div className="legacy-jumbotron">
        <div className="legacy-row">
          <div className="legacy-col-md-5">
            <h2><strong>Contact Us</strong></h2>
            <p>
              Dr. Ganesh Bagler<br />
              <a href="http://ccb.iiitd.ac.in/" target="_blank" rel="noopener noreferrer">Center for Computational Biology</a><br />
              Indraprastha Institute of Information Technology Delhi (IIIT Delhi),<br />
              B-205, Academic Block,<br />
              Okhla Phase III, Near Govindpuri Metro Station,<br />
              New Delhi, India 110020.<br />
              <b>Email: </b><a href="mailto:bagler+FlavorDB@iiitd.ac.in">bagler+FlavorDB@iiitd.ac.in</a><br />
              <b>Tel:</b> +91-11-26907-443 (Work)
            </p>
          </div>
          <div className="legacy-col-md-7">
            <iframe 
              title="IIITD Map"
              style={{ minHeight: '500px', width: '100%', border: '0' }}
              frameBorder="0"
              src="https://www.google.com/maps/embed/v1/place?q=place_id:ChIJHazaZOXjDDkRVsV7DjQuWCw&key=AIzaSyBRBQG98E5YdUoooyAk2wd-_olpWmL5ACE"
              allowFullScreen>
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
