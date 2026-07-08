import React, { useState } from 'react';

export default function FAQPage() {
  const [openPanel, setOpenPanel] = useState(null);

  const togglePanel = (id) => {
    setOpenPanel(openPanel === id ? null : id);
  };

  const faqs = [
  {
    "id": "faq-0",
    "header": "What molecules are considered rare?",
    "bodyHtml": "<strong>A molecule is counted as Rare when it appears in 5 or fewer entities/ingredients.</strong>"
  },
  {
    "id": "faq-1",
    "header": "What is the Total Rarity Score?",
    "bodyHtml": "<strong>Total Rarity Score captures the extent to which this entity/ingredient is built from molecules that are rare across all entities/ingredients. It is the sum of each molecule's rarity weight over all molecules in this entity/ingredient: Score = Σ 1/df(m), where df(m) is the number of entities/ingredients that contain molecule m.</strong>"
  },
  {
    "id": "faq-2",
    "header": "What is the Relevance Score?",
    "bodyHtml": "<strong>The Relevance Score of a molecule captures its uniqueness. It is calculated as the inverse of its document frequency: 1/df(m), where df(m) is the total number of ingredients that contain this molecule.</strong>"
  },
  {
    "id": "faq-3",
    "header": "What is the Flavor Importance of a molecule?",
    "bodyHtml": "<strong>The Flavor Importance of a molecule captures its uniqueness. It is calculated as the inverse of its document frequency: 1/df(m), where df(m) is the total number of ingredients that contain this molecule.</strong>"
  },
  {
    "id": "faq-4",
    "header": "What are the various ingredient categories within FlavorDB?",
    "bodyHtml": "\n\t\t\t\t\t<strong>\n\t\t\t\t\t\t<ul style=\"column-count: 3; column-gap: 2rem; list-style-position: inside; padding-top: 0.5rem;\">\n\t\t\t\t\t\t\t<li>Additive</li>\n\t\t\t\t\t\t\t<li>Animal Product</li>\n\t\t\t\t\t\t\t<li>Bakery</li>\n\t\t\t\t\t\t\t<li>Beverage</li>\n\t\t\t\t\t\t\t<li>Beverage Alcoholic</li>\n\t\t\t\t\t\t\t<li>Beverage Caffeinated</li>\n\t\t\t\t\t\t\t<li>Cereal</li>\n\t\t\t\t\t\t\t<li>Maize</li>\n\t\t\t\t\t\t\t<li>Dairy</li>\n\t\t\t\t\t\t\t<li>Dish</li>\n\t\t\t\t\t\t\t<li>Essential Oil</li>\n\t\t\t\t\t\t\t<li>Fish</li>\n\t\t\t\t\t\t\t<li>Seafood</li>\n\t\t\t\t\t\t\t<li>Flower</li>\n\t\t\t\t\t\t\t<li>Fruit</li>\n\t\t\t\t\t\t\t<li>Berry</li>\n\t\t\t\t\t\t\t<li>Fruit Citrus</li>\n\t\t\t\t\t\t\t<li>Fruit Essence</li>\n\t\t\t\t\t\t\t<li>Fungus</li>\n\t\t\t\t\t\t\t<li>Herb</li>\n\t\t\t\t\t\t\t<li>Meat</li>\n\t\t\t\t\t\t\t<li>Legume</li>\n\t\t\t\t\t\t\t<li>Nut</li>\n\t\t\t\t\t\t\t<li>Seed</li>\n\t\t\t\t\t\t\t<li>Plant</li>\n\t\t\t\t\t\t\t<li>Plant Derivative</li>\n\t\t\t\t\t\t\t<li>Spice</li>\n\t\t\t\t\t\t\t<li>Vegetable</li>\n\t\t\t\t\t\t\t<li>Cabbage</li>\n\t\t\t\t\t\t\t<li>Vegetable Fruit</li>\n\t\t\t\t\t\t\t<li>Gourd</li>\n\t\t\t\t\t\t\t<li>Vegetable Root</li>\n\t\t\t\t\t\t\t<li>Vegetable Stem</li>\n\t\t\t\t\t\t\t<li>Vegetable Tuber</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t</strong>\n\t\t\t\t"
  },
  {
    "id": "faq-5",
    "header": "Prerequisites needed to run FlavorDB?",
    "bodyHtml": "<strong> A modern web browser with JavaScript enabled.</strong>"
  },
  {
    "id": "faq-6",
    "header": "What is Tech Stack used to build FlavorDB?",
    "bodyHtml": "<strong>Front End: HTML, CSS, JavaScript, AJAX, jQuery(v1.12.4), Bootstrap(v3.3.7), DataTables(<a href=\"https://datatables.net\" target=\"_blank\">https://datatables.net/</a>), Google Charts(<a href=\"https://developers.google.com/chart/\" target=\"_blank\">https://developers.google.com/chart/</a>) ,D3.js\n\t\t\tJSME Molecular Editor(<a href=\"http://peter-ertl.com/jsme/\" target=\"_blank\">http://peter-ertl.com/jsme/</a>), Jmol: an open-source Java viewer for chemical structures in 3D. <a target=\"_blank\" href=\"http://www.jmol.org/\">http://www.jmol.org/</a>\n\t\t\tBack End: Python, Django, Mysql, OpenBabel(v2.4.0)</strong>\n\t\t"
  },
  {
    "id": "faq-7",
    "header": "What is Jmol?",
    "bodyHtml": "<strong> Jmol: an open-source Java viewer for chemical structures in 3D. <a target=\"_blank\" href=\"http://www.jmol.org/\">http://www.jmol.org/</a><br>\n\t\t\tJmol does not require 3D acceleration plugins. Jmol returns a 3D representation of a molecule that may be used as a teaching tool, or for research e.g. in chemistry and biochemistry. It is free and open source software, written in Java and so it runs on Windows, Mac OS X, Linux and Unix systems.\n\n\t\t\tFew technical advantages of Jmol are:\n\t\t\t<ul>\n\t\t\t\t<li>Molecular 3D visualisation</li>\n\t\t\t\t<li>Zooming facilities</li>\n\t\t\t\t<li>Provision to download the viewed molecule in mol2 format</li>\n\t\t\t</ul>\n\t\t\tFor further information please visit the Jmol website: <a target=\"_blank\" href=\"http://jmol.sourceforge.net/\">here</a>\n\t\t</strong>"
  },
  {
    "id": "faq-8",
    "header": "What is the source of data and images?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tTo begin with, a list of ingredients was created using, Foodb (<a href=\"http://foodb.ca\" target=\"_blank\">http://foodb.ca</a>) and arXiv preprint arXiv:1502.03815, 2015. Each of the 951 ingredients were then manually classified into 34 categories: Additive, Animal Product, Bakery, Beverage, Beverage Alcoholic, Beverage Caffeinated, Cereal, Maize, Dairy, Dish, Essential Oil, Fish, Seafood, Flower, Fruit, Berry, Fruit Citrus, Fruit Essence, Fungus, Herb, Meat, Legume, Nut, Seed, Plant, Plant Derivative, Spice, Vegetable, Cabbage, Vegetable Fruit, Gourd, Vegetable Root, Vegetable Stem, and Vegetable Tuber. Each entity was also mapped to its natural source, with a total of 532 unique sources being identified. The details of entities and their natural sources, related images, and scientific classification were obtained from Wikipedia using Python’s BeautifulSoup4 library (<a href=\"https://www.crummy.com/software/BeautifulSoup\" target=\"_blank\">https://www.crummy.com/software/BeautifulSoup</a>) and MediaWiki’s action API (MediaWiki The Free Wiki Engine).\n\n\t\t\t\t<br><br>\n\t\t\t\tThe data of flavor molecules for each of these ingredients were compiled via literature survey, flavor resources, and previously reported data:\n\n\t\t\t\t<ul>\n\t\t\t\t\t<li>Burdock,G.A. (2010) Fenaroli’s handbook of flavor ingredients.</li>\n\t\t\t\t\t<li>Ahn,Y.-Y., Ahnert,S.E., Bagrow,J.P. and Barabási,A.-L. (2011) Flavor network and the principles of food pairing. Sci. Rep., 1, 196.</li>\n\t\t\t\t\t<li>Jain,A., Rakhi,N.K. and Bagler,G. (2015) Analysis of food pairing in regional cuisines of India. PLoS One, 10.</li>\n\t\t\t\t\t<li>Jain,A., Rakhi,N.K. and Bagler,G. (2015) Spices form the basis of food pairing in Indian cuisine. arXiv:1502.03815.</li>\n\t\t\t\t\t<li>www.foodb.ca</li>\n\t\t\t\t\t<li>Arn,H. and Acree,T.E. (1998) Flavornet: A database of aroma compounds based on odor potency in natural products. Dev. Food Sci., 40, 27.</li>\n\t\t\t\t\t<li>Ahmed,J., Preissner,S., Dunkel,M., Worth,C.L., Eckert,A. and Preissner,R. (2011) SuperSweet-A resource on natural and artificial sweetening agents. Nucleic Acids Res., 39.</li>\n\t\t\t\t\t<li>Wiener,A., Shudler,M., Levit,A. and Niv,M.Y. (2012) BitterDB: A database of bitter compounds. Nucleic Acids Res., 40, 413–419, D377-82.</li>\n\n\t\t\t\t</ul>\n\n\t\t\t\tThe data of flavor molecules for each of these ingredients were compiled via flavor resources such as Fenaroli’s handbook of flavor ingredients, previously reported data and literature survey. Common names, scientific name and synonyms of ingredients were used to query PubMed to obtain articles that reported their flavor molecules. Flavor molecules associated with entities/ingredients were thus curated from existing sources and compiled manually. Molecules from SuperSweet, BitterDB and Flavornet were further included along with their flavor profiles. Additionally, information for 33 taste receptors including Sweet, Bitter, Sour, and Umami is also available in FlavorDB. For each receptor, we provide its Uniprot ID, name, involvement in taste, and Uniprot link. \n\t\t\t\t<br>\n\t\t\t\t<br>\n\t\t\t\tThe chemical identifiers of molecules were obtained from various sources, and were standardized to procure their CAS (Chemical Abstract Service) numbers. CAS numbers were then mapped to their corresponding PubChem IDs, as the former are often degenerate with multiple CAS numbers pointing to the same molecule, and some pointing to multiple molecules. Thus, PubChem ID was used as the unique primary key for every flavor molecule. Using the PubChem ID, compound identifiers (such as common name, IUPAC, Canonical SMILES), physicochemical properties and 2D images were obtained from PubChem REST API (<a href=\"https://pubchem.ncbi.nlm.nih.gov/pug_rest/PUG_REST.html\" target=\"_blank\">https://pubchem.ncbi.nlm.nih.gov/pug_rest/PUG_REST.html</a>). The flavor profile of the molecule (FEMA Flavor Profile, FEMA Number, Taste, and Odor) was downloaded from PubChem.\n\t\t\t\t<br>\n\t\t\t\t<br>\n\t\t\t\tFurther 2D/3D, ADMET and physicochemical properties as well as Mol2 files for all 25595 molecules were obtained using Discovery Studio 4.0. The functional groups were obtained using Checkmol software. Functional group refers to an atom, or a group of atoms that have similar chemical properties whenever they occur in different compounds. Thus, it defines the characteristic physical and chemical properties of families of organic compounds.<br>\n\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-9",
    "header": "What are Functional Groups and how were they obtained?",
    "bodyHtml": "<strong> \n\t\t\tFunctional Groups:- The functional group is an atom, or a group of atoms that has similar chemical properties whenever it occurs in different compounds. It defines the characteristic physical and chemical properties of families of organic compounds. (<a href=\"http://goldbook.iupac.org/F02555.html\" target=\"_blank\">http://goldbook.iupac.org/F02555.html</a>)<br><br>\n\t\t\tCheckmol: - A free and an open source tool, checkmol, detect and assign the functional group information on any small molecules with 2D coordinates. The checkmol is a command-line utility program, which reads molecular structure files in different formats and analyzes the input molecule for the presence of various functional groups. The output text can be easily placed into a database table, permitting the creation of chemical databases with a functional group search option.<br><br>\n\t\t\t<ol>\n\t\t\t\t<li><p>\n\t\t\t\t\tAnalysis of Functional Groups in Organic Molecules, <a href=\"http://merian.pch.univie.ac.at/~nhaider/cheminf/cmmm.html\" target=\"_blank\">http://merian.pch.univie.ac.at/~nhaider/cheminf/cmmm.html</a>\n\t\t\t\t</p></li>\n\t\t\t\t<li>\n\t\t\t\t\t<p>\n\t\t\t\t\t\tN. Haider, Functionality pattern matching as an efficient complementary structure/reaction search tool: an open-source approach, Molecules 15 (8) (2010) 5079–5092.( <a href=\"http://www.mdpi.com/1420-3049/15/8/5079\">http://www.mdpi.com/1420-3049/15/8/5079</a>)\n\t\t\t\t\t</p>\n\t\t\t\t</li>\n\t\t\t</ol>\n\n\t\t\tTotal List of functional groups generated by Checkmol :- (<a href=\"http://merian.pch.univie.ac.at/~nhaider/cheminf/fgtable.pdf\" target=\"_blank\">http://merian.pch.univie.ac.at/~nhaider/cheminf/fgtable.pdf</a>)</strong>\n\n\n\t\t"
  },
  {
    "id": "faq-10",
    "header": "Do you use cookies?",
    "bodyHtml": "\n\t\t\t<strong> \n\n\t\t\t\tWe are using cookies to provide statistics that help us give best experience for our site.\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-11",
    "header": "How do I access the data from FlavorDB?",
    "bodyHtml": "\n\t\t\t<strong> \n\n\t\t\t\tData is accessible for molecules as well as entities/ingredients. These can be downloaded in JSON format from the ‘Molecular &amp; Flavor Profile’ tab (More Info.) and the entity page respectively. The molecules’ data can also be obtained in Mol2, 2D Image and SDF formats. These data are available under a <a href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\">Creative Commons License Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)</a>. \n\t\t\t\t<br><br>\n\t\t\t\t<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png\"></a>\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-12",
    "header": "How do I contribute to data?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tYou may contact us at <a href=\"/flavordb/contact\" target=\"_blank\"> bagler+FlavorDB@iiitd.ac.in</a> for errata or suggesting information of flavor profile and ingredient association with relevant references.\n\t\t\t\t<br><br>\n\t\t\t\tYou may also fill the following forms to report errors or giving suggestions.\n\t\t\t\t<br><br>\n\t\t\t\tSuggestions Form for reporting new flavor molecules or Entity/Ingredient associations: <br>\n\t\t\t\t<a href=\"https://docs.google.com/forms/d/e/1FAIpQLSe9m_rNojup_dQohU3gHA-ByYbbbB9-x6bv4knyxu0ZQ2ClTA/viewform\" target=\"_blank\">https://docs.google.com/forms/d/e/1FAIpQLSe9m_rNojup_dQohU3gHA-ByYbbbB9-x6bv4knyxu0ZQ2ClTA/viewform</a> \n\t\t\t\t<br><br>\n\t\t\t\tErrata Form to report errors in data: <br>\n\t\t\t\t<a href=\"https://docs.google.com/forms/d/e/1FAIpQLSfRYt6D4-c9UKGFpvvucqRvV871pMix6mnC1cskT9CXcEiLLw/viewform\" target=\"_blank\">https://docs.google.com/forms/d/e/1FAIpQLSfRYt6D4-c9UKGFpvvucqRvV871pMix6mnC1cskT9CXcEiLLw/viewform</a>\n\n\t\t\t\t\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-13",
    "header": "Under what license is FlavorDB available?",
    "bodyHtml": "\n\t\t\t<strong> \n<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png\"></a><br>This work is licensed under a <a style=\"font-weight: bold;\" rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-14",
    "header": "How to Cite us?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tNeelansh Garg†, Apuroop Sethupathy†, Rudraksh Tuwani†, Rakhi NK†, Shubham Dokania†, Arvind Iyer†, Ayushi Gupta†, Shubhra Agrawal†, Navjot Singh†, Shubham Shukla†, Kriti Kathuria†, Rahul Badhwar, Rakesh Kanji, Anupam Jain, Avneet Kaur, Rashmi Nagpal, Reyansh Bansal, Manan Katoch, and Ganesh Bagler*, FlavorDB: A database of flavor molecules, Nucleic Acids Research, gkx957, (2017). †Equal contribution *Corresponding Author\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-15",
    "header": "Who is the team behind FlavorDB Pro?",
    "bodyHtml": "\n\n\t\t\t<table class=\"fdb-team-table\">\n\t\t\t\t<thead>\n\t\t\t\t\t<tr><th>Name</th>\n\t\t\t\t\t<th>Position</th>\n\t\t\t\t\t<th>Affiliation</th>\n\t\t\t\t\t<th>Contribution</th>\n\t\t\t\t</tr></thead>\n\t\t\t\t<tbody>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td><a href=\"/flavordb/contact\">Ganesh Bagler</a></td>\n\t\t\t\t\t\t<td>Project Head</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Idea conception, Project design and management, Database design and implementation   </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Reyansh Bansal</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Database design, Development of FlavorDB Web Resource, Data Visualisation and Data Analytics</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Manan Katoch</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Database design, Development of FlavorDB Web Resource, Data Visualisation and Data Analytics</td>\n\t\t\t\t\t</tr>\n\t\t\t\t</tbody>\n\t\t\t</table>\n\n\t\t"
  }
];

  return (
    <div className="legacy-container">
      <div className="legacy-jumbotron text-center">
        <h2><strong>Frequently Asked Questions (FAQs)</strong></h2>
      </div>

      <div className="legacy-panel-group">
        {faqs.map((faq) => (
          <div className="legacy-panel" key={faq.id}>
            <div
              className="legacy-panel-heading"
              onClick={() => togglePanel(faq.id)}
            >
              <h4 className="legacy-panel-title">
                {faq.header}
              </h4>
            </div>
            <div className={`legacy-panel-collapse ${openPanel === faq.id ? "open" : ""}`}>
              <div className="legacy-panel-body-wrapper">
                <div
                  className="legacy-panel-body"
                  dangerouslySetInnerHTML={{ __html: faq.bodyHtml }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
