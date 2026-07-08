const fs = require('fs');
function processFile(inFile, outFile) {
  let html = fs.readFileSync(inFile, 'utf8');
  let navStart = html.indexOf('<nav class=\"navbar navbar-inverse\">');
  let navEnd = html.indexOf('</nav>') + 6;
  if (navStart !== -1) {
    html = html.substring(0, navStart) + html.substring(navEnd);
  }
  let footerStart = html.indexOf('<footer class=\"primary-footer\">');
  let footerEnd = html.indexOf('</footer>') + 9;
  if (footerStart !== -1) {
    html = html.substring(0, footerStart) + html.substring(footerEnd);
  }
  fs.writeFileSync(outFile, html);
}
processFile('faq.html', 'client/public/faq_static.html');
processFile('contact.html', 'client/public/contact_static.html');

