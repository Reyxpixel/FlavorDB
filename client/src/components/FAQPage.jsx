import React, { useState } from 'react';

export default function FAQPage() {
  const [openPanel, setOpenPanel] = useState(null);

  const togglePanel = (id) => {
    setOpenPanel(openPanel === id ? null : id);
  };

  const faqs = [
  {
    "id": "faq-0",
    "header": "Q1: What are the various ingredient categories within FlavorDB?",
    "bodyHtml": "\n\t\t\t\t\t<strong>\n\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t<li>Additive</li>\n\t\t\t\t\t\t\t<li>Animal Product</li>\n\t\t\t\t\t\t\t<li>Bakery</li>\n\t\t\t\t\t\t\t<li>Beverage</li>\n\t\t\t\t\t\t\t<li>Beverage Alcoholic</li>\n\t\t\t\t\t\t\t<li>Beverage Caffeinated</li>\n\t\t\t\t\t\t\t<li>Cereal</li>\n\t\t\t\t\t\t\t<li>Maize</li>\n\t\t\t\t\t\t\t<li>Dairy</li>\n\t\t\t\t\t\t\t<li>Dish</li>\n\t\t\t\t\t\t\t<li>Essential Oil</li>\n\t\t\t\t\t\t\t<li>Fish</li>\n\t\t\t\t\t\t\t<li>Seafood</li>\n\t\t\t\t\t\t\t<li>Flower</li>\n\t\t\t\t\t\t\t<li>Fruit</li>\n\t\t\t\t\t\t\t<li>Berry</li>\n\t\t\t\t\t\t\t<li>Fruit Citrus</li>\n\t\t\t\t\t\t\t<li>Fruit Essence</li>\n\t\t\t\t\t\t\t<li>Fungus</li>\n\t\t\t\t\t\t\t<li>Herb</li>\n\t\t\t\t\t\t\t<li>Meat</li>\n\t\t\t\t\t\t\t<li>Legume</li>\n\t\t\t\t\t\t\t<li>Nut</li>\n\t\t\t\t\t\t\t<li>Seed</li>\n\t\t\t\t\t\t\t<li>Plant</li>\n\t\t\t\t\t\t\t<li>Plant Derivative</li>\n\t\t\t\t\t\t\t<li>Spice</li>\n\t\t\t\t\t\t\t<li>Vegetable</li>\n\t\t\t\t\t\t\t<li>Cabbage</li>\n\t\t\t\t\t\t\t<li>Vegetable Fruit</li>\n\t\t\t\t\t\t\t<li>Gourd</li>\n\t\t\t\t\t\t\t<li>Vegetable Root</li>\n\t\t\t\t\t\t\t<li>Vegetable Stem</li>\n\t\t\t\t\t\t\t<li>Vegetable Tuber</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t</strong>\n\t\t\t\t"
  },
  {
    "id": "faq-1",
    "header": "Q2: What is ZINC Similarity Search?",
    "bodyHtml": "<strong> ZINC is a free public resource for discovery of drug-like molecules. The database contains over twenty million commercially available molecules in biologically relevant representations that may be downloaded in popular ready-to-dock formats and subsets. The similarity search done against ZINC compares the input SMILE and each SMILE present in the database. Depending upon the similarity percentage (Eg: 90% which is the default threshold) it displays the similar compounds.<br>\n\n\t\t\t\tFor further information please visit the ZINC database: <a target=\"_blank\" href=\"http://zinc15.docking.org/\">http://zinc15.docking.org/</a></strong>\n\t\t\t\t"
  },
  {
    "id": "faq-2",
    "header": "Q3: How do I use the “Flavor Pairing” app?",
    "bodyHtml": "<strong> \n\n\t\t\t\t\tRefer to the Flavor Pairing section on the <a href=\"/flavordb/how_to_use\">how to use</a> page\n\t\t\t\t</strong>\n\t\t\t"
  },
  {
    "id": "faq-3",
    "header": "Q4: What are FlavorDB Statistics?",
    "bodyHtml": "<strong> \n\n\t\t\t\t<a href=\"http://cosylab.iiitd.edu.in/flavordb/#visual_search\">Flavor DB statistics</a> explain the vastness and depth of flavor DB using interactive Google Charts (<a href=\"https://developers.google.com/chart/\" target=\"_blank\">https://developers.google.com/chart/</a>).\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-4",
    "header": "Q5: How do I use “Visual Search”?",
    "bodyHtml": "<strong> \n\n\t\t\tRefer to the Visual Search section on the <a href=\"/flavordb/how_to_use\">how to use</a> page\n\t\t</strong>\n\t"
  },
  {
    "id": "faq-5",
    "header": "Q6: How to use “Advanced Search”?",
    "bodyHtml": "<strong> \n\n\t\t\tRefer to the Advanced Search section on the <a href=\"/flavordb/how_to_use\">how to use</a> page\n\t\t</strong>\n\t"
  },
  {
    "id": "faq-6",
    "header": "Q7: How was “The Flavor Network” constructed?",
    "bodyHtml": "<strong> \n\n\t\t\tFlavor network was constructed using <a href=\"https://d3js.org/\" target=\"_blank\">d3.js</a> hierarchical edge bundeling (<a href=\"https://bl.ocks.org/mbostock/7607999\" target=\"_blank\">https://bl.ocks.org/mbostock/7607999</a>).To address dense pattern of interrelationships due to abundance of sharing, the backbone network showing statistically significant edges is depicted.\n\n\t\t</strong>\n\t"
  },
  {
    "id": "faq-7",
    "header": "Q8: How do you perform a similarity search?",
    "bodyHtml": "<strong> One search option provided is to perform a molecular search by using the JSME tool. With this one can draw a molecule’s structure and search for similar molecules. For each structure that is drawn, the JSME Molecular Editor generates its corresponding SMILE value. We then run the SMILE value through Open Babel to generate a molecular fingerprint. \n\t\t<br><br>\n\t\tThen we check molecular structural similarity using Open Babel to calculate the Tanimoto Coefficient between the generated fingerprint and data from our database. We use a threshold value of 0.3 to display our results. Thus, only molecules that have a similarity level of 30% or higher are displayed.</strong>\n\n\t\t"
  },
  {
    "id": "faq-8",
    "header": "Q9: What are the different concepts used in FlavorDB and how to they relate to each other?",
    "bodyHtml": "<strong>The illustration depicts relationships among different concepts incorporated in FlavorDB. The 'Entity is synonymous to an Ingredient', and is a key concept in the framework. In this example, ‘Onion’ is an Entity/Ingredient which is classified into the Category ‘Vegetable’. The natural origin (plant or animal species/genus/family/kingdom) of an ingredient is referred to as the Natural Source, which in the case of onion is ‘Allium’. Each ingredient comprises a set of flavor molecules. And further, each flavor molecule is characterized by a ‘flavor profile’ (a set of flavor terms) and by an array of ‘molecular properties’ (Physicochemical, 2D/3D and ADMET).\n\t\t<br><br>\n\n\t\t<img style=\"max-height: 50em; max-width: 50em;\" src=\"/flavordb/static/images/concepts_fdb_faq.jpg\">\n\n\t\t</strong>"
  },
  {
    "id": "faq-9",
    "header": "Q10: Prerequisites needed to run FlavorDB?",
    "bodyHtml": "<strong> A modern web browser with JavaScript enabled.</strong>"
  },
  {
    "id": "faq-10",
    "header": "Q11: What browsers does FlavorDB support?",
    "bodyHtml": "<strong>FlavorDB supports all modern web browsers. But the Flavor Network can be best viewed on Chrome, Firefox and Edge</strong>"
  },
  {
    "id": "faq-11",
    "header": "Q12: What is Tech Stack used to build FlavorDB?",
    "bodyHtml": "<strong>Front End: HTML, CSS, JavaScript, AJAX, jQuery(v1.12.4), Bootstrap(v3.3.7), DataTables(<a href=\"https://datatables.net\" target=\"_blank\">https://datatables.net/</a>), Google Charts(<a href=\"https://developers.google.com/chart/\" target=\"_blank\">https://developers.google.com/chart/</a>) ,D3.js\n\t\t\tJSME Molecular Editor(<a href=\"http://peter-ertl.com/jsme/\" target=\"_blank\">http://peter-ertl.com/jsme/</a>), Jmol: an open-source Java viewer for chemical structures in 3D. <a target=\"_blank\" href=\"http://www.jmol.org/\">http://www.jmol.org/</a>\n\t\t\tBack End: Python, Django, Mysql, OpenBabel(v2.4.0)</strong>\n\t\t"
  },
  {
    "id": "faq-12",
    "header": "Q13: What is Jmol?",
    "bodyHtml": "<strong> Jmol: an open-source Java viewer for chemical structures in 3D. <a target=\"_blank\" href=\"http://www.jmol.org/\">http://www.jmol.org/</a><br>\n\t\t\tJmol does not require 3D acceleration plugins. Jmol returns a 3D representation of a molecule that may be used as a teaching tool, or for research e.g. in chemistry and biochemistry. It is free and open source software, written in Java and so it runs on Windows, Mac OS X, Linux and Unix systems.\n\n\t\t\tFew technical advantages of Jmol are:\n\t\t\t<ul>\n\t\t\t\t<li>Molecular 3D visualisation</li>\n\t\t\t\t<li>Zooming facilities</li>\n\t\t\t\t<li>Provision to download the viewed molecule in mol2 format</li>\n\t\t\t</ul>\n\t\t\tFor further information please visit the Jmol website: <a target=\"_blank\" href=\"http://jmol.sourceforge.net/\">here</a>\n\t\t</strong>"
  },
  {
    "id": "faq-13",
    "header": "Q14: What do I need to have the Jmol files to render properly?",
    "bodyHtml": "<strong> A modern web browser with JavaScript enabled.</strong>"
  },
  {
    "id": "faq-14",
    "header": "Q15: What is the source of data and images?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tTo begin with, a list of ingredients was created using, Foodb (<a href=\"http://foodb.ca\" target=\"_blank\">http://foodb.ca</a>) and arXiv preprint arXiv:1502.03815, 2015. Each of the 951 ingredients were then manually classified into 34 categories: Additive, Animal Product, Bakery, Beverage, Beverage Alcoholic, Beverage Caffeinated, Cereal, Maize, Dairy, Dish, Essential Oil, Fish, Seafood, Flower, Fruit, Berry, Fruit Citrus, Fruit Essence, Fungus, Herb, Meat, Legume, Nut, Seed, Plant, Plant Derivative, Spice, Vegetable, Cabbage, Vegetable Fruit, Gourd, Vegetable Root, Vegetable Stem, and Vegetable Tuber. Each entity was also mapped to its natural source, with a total of 532 unique sources being identified. The details of entities and their natural sources, related images, and scientific classification were obtained from Wikipedia using Python’s BeautifulSoup4 library (<a href=\"https://www.crummy.com/software/BeautifulSoup\" target=\"_blank\">https://www.crummy.com/software/BeautifulSoup</a>) and MediaWiki’s action API (MediaWiki The Free Wiki Engine).\n\n\t\t\t\t<br><br>\n\t\t\t\tThe data of flavor molecules for each of these ingredients were compiled via literature survey, flavor resources, and previously reported data:\n\n\t\t\t\t<ul>\n\t\t\t\t\t<li>Burdock,G.A. (2010) Fenaroli’s handbook of flavor ingredients.</li>\n\t\t\t\t\t<li>Ahn,Y.-Y., Ahnert,S.E., Bagrow,J.P. and Barabási,A.-L. (2011) Flavor network and the principles of food pairing. Sci. Rep., 1, 196.</li>\n\t\t\t\t\t<li>Jain,A., Rakhi,N.K. and Bagler,G. (2015) Analysis of food pairing in regional cuisines of India. PLoS One, 10.</li>\n\t\t\t\t\t<li>Jain,A., Rakhi,N.K. and Bagler,G. (2015) Spices form the basis of food pairing in Indian cuisine. arXiv:1502.03815.</li>\n\t\t\t\t\t<li>www.foodb.ca</li>\n\t\t\t\t\t<li>Arn,H. and Acree,T.E. (1998) Flavornet: A database of aroma compounds based on odor potency in natural products. Dev. Food Sci., 40, 27.</li>\n\t\t\t\t\t<li>Ahmed,J., Preissner,S., Dunkel,M., Worth,C.L., Eckert,A. and Preissner,R. (2011) SuperSweet-A resource on natural and artificial sweetening agents. Nucleic Acids Res., 39.</li>\n\t\t\t\t\t<li>Wiener,A., Shudler,M., Levit,A. and Niv,M.Y. (2012) BitterDB: A database of bitter compounds. Nucleic Acids Res., 40, 413–419, D377-82.</li>\n\n\t\t\t\t</ul>\n\n\t\t\t\tThe data of flavor molecules for each of these ingredients were compiled via flavor resources such as Fenaroli’s handbook of flavor ingredients, previously reported data and literature survey. Common names, scientific name and synonyms of ingredients were used to query PubMed to obtain articles that reported their flavor molecules. Flavor molecules associated with entities/ingredients were thus curated from existing sources and compiled manually. Molecules from SuperSweet, BitterDB and Flavornet were further included along with their flavor profiles. Additionally, information for 33 taste receptors including Sweet, Bitter, Sour, and Umami is also available in FlavorDB. For each receptor, we provide its Uniprot ID, name, involvement in taste, and Uniprot link. \n\t\t\t\t<br>\n\t\t\t\t<br>\n\t\t\t\tThe chemical identifiers of molecules were obtained from various sources, and were standardized to procure their CAS (Chemical Abstract Service) numbers. CAS numbers were then mapped to their corresponding PubChem IDs, as the former are often degenerate with multiple CAS numbers pointing to the same molecule, and some pointing to multiple molecules. Thus, PubChem ID was used as the unique primary key for every flavor molecule. Using the PubChem ID, compound identifiers (such as common name, IUPAC, Canonical SMILES), physicochemical properties and 2D images were obtained from PubChem REST API (<a href=\"https://pubchem.ncbi.nlm.nih.gov/pug_rest/PUG_REST.html\" target=\"_blank\">https://pubchem.ncbi.nlm.nih.gov/pug_rest/PUG_REST.html</a>). The flavor profile of the molecule (FEMA Flavor Profile, FEMA Number, Taste, and Odor) was downloaded from PubChem.\n\t\t\t\t<br>\n\t\t\t\t<br>\n\t\t\t\tFurther 2D/3D, ADMET and physicochemical properties as well as Mol2 files for all 25595 molecules were obtained using Discovery Studio 4.0. The functional groups were obtained using Checkmol software. Functional group refers to an atom, or a group of atoms that have similar chemical properties whenever they occur in different compounds. Thus, it defines the characteristic physical and chemical properties of families of organic compounds.<br>\n\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-15",
    "header": "Q16: What are Functional Groups and how were they obtained?",
    "bodyHtml": "<strong> \n\t\t\tFunctional Groups:- The functional group is an atom, or a group of atoms that has similar chemical properties whenever it occurs in different compounds. It defines the characteristic physical and chemical properties of families of organic compounds. (<a href=\"http://goldbook.iupac.org/F02555.html\" target=\"_blank\">http://goldbook.iupac.org/F02555.html</a>)<br><br>\n\t\t\tCheckmol: - A free and an open source tool, checkmol, detect and assign the functional group information on any small molecules with 2D coordinates. The checkmol is a command-line utility program, which reads molecular structure files in different formats and analyzes the input molecule for the presence of various functional groups. The output text can be easily placed into a database table, permitting the creation of chemical databases with a functional group search option.<br><br>\n\t\t\t<ol>\n\t\t\t\t<li><p>\n\t\t\t\t\tAnalysis of Functional Groups in Organic Molecules, <a href=\"http://merian.pch.univie.ac.at/~nhaider/cheminf/cmmm.html\" target=\"_blank\">http://merian.pch.univie.ac.at/~nhaider/cheminf/cmmm.html</a>\n\t\t\t\t</p></li>\n\t\t\t\t<li>\n\t\t\t\t\t<p>\n\t\t\t\t\t\tN. Haider, Functionality pattern matching as an efficient complementary structure/reaction search tool: an open-source approach, Molecules 15 (8) (2010) 5079–5092.( <a href=\"http://www.mdpi.com/1420-3049/15/8/5079\">http://www.mdpi.com/1420-3049/15/8/5079</a>)\n\t\t\t\t\t</p>\n\t\t\t\t</li>\n\t\t\t</ol>\n\n\t\t\tTotal List of functional groups generated by Checkmol :- (<a href=\"http://merian.pch.univie.ac.at/~nhaider/cheminf/fgtable.pdf\" target=\"_blank\">http://merian.pch.univie.ac.at/~nhaider/cheminf/fgtable.pdf</a>)</strong>\n\n\n\t\t"
  },
  {
    "id": "faq-16",
    "header": "Q17: Do you use cookies?",
    "bodyHtml": "\n\t\t\t<strong> \n\n\t\t\t\tWe are using cookies to provide statistics that help us give best experience for our site.\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-17",
    "header": "Q18: Can we use FlavorDB in mobiles?",
    "bodyHtml": "\n\t\t\t<strong> \n\n\t\t\t\tYes, just visit flavorDB from your mobile browser. But the data visualizations such as flavor network are best viewed on desktop.\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-18",
    "header": "Q19: How do I access the data from FlavorDB?",
    "bodyHtml": "\n\t\t\t<strong> \n\n\t\t\t\tData is accessible for molecules as well as entities/ingredients. These can be downloaded in JSON format from the ‘Molecular &amp; Flavor Profile’ tab (More Info.) and the entity page respectively. The molecules’ data can also be obtained in Mol2, 2D Image and SDF formats. These data are available under a <a href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\">Creative Commons License Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)</a>. \n\t\t\t\t<br><br>\n\t\t\t\t<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png\"></a>\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-19",
    "header": "Q20: How do I contribute to data?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tYou may contact us at <a href=\"/flavordb/contact\" target=\"_blank\"> bagler+FlavorDB@iiitd.ac.in</a> for errata or suggesting information of flavor profile and ingredient association with relevant references.\n\t\t\t\t<br><br>\n\t\t\t\tYou may also fill the following forms to report errors or giving suggestions.\n\t\t\t\t<br><br>\n\t\t\t\tSuggestions Form for reporting new flavor molecules or Entity/Ingredient associations: <br>\n\t\t\t\t<a href=\"https://docs.google.com/forms/d/e/1FAIpQLSe9m_rNojup_dQohU3gHA-ByYbbbB9-x6bv4knyxu0ZQ2ClTA/viewform\" target=\"_blank\">https://docs.google.com/forms/d/e/1FAIpQLSe9m_rNojup_dQohU3gHA-ByYbbbB9-x6bv4knyxu0ZQ2ClTA/viewform</a> \n\t\t\t\t<br><br>\n\t\t\t\tErrata Form to report errors in data: <br>\n\t\t\t\t<a href=\"https://docs.google.com/forms/d/e/1FAIpQLSfRYt6D4-c9UKGFpvvucqRvV871pMix6mnC1cskT9CXcEiLLw/viewform\" target=\"_blank\">https://docs.google.com/forms/d/e/1FAIpQLSfRYt6D4-c9UKGFpvvucqRvV871pMix6mnC1cskT9CXcEiLLw/viewform</a>\n\n\t\t\t\t\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-20",
    "header": "Q21: Under what license is FlavorDB available?",
    "bodyHtml": "\n\t\t\t<strong> \n<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png\"></a><br>This work is licensed under a <a style=\"font-weight: bold;\" rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc-sa/3.0/\">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-21",
    "header": "Q21: How to Cite us?",
    "bodyHtml": "\n\t\t\t<strong> \n\t\t\t\tNeelansh Garg†, Apuroop Sethupathy†, Rudraksh Tuwani†, Rakhi NK†, Shubham Dokania†, Arvind Iyer†, Ayushi Gupta†, Shubhra Agrawal†, Navjot Singh†, Shubham Shukla†, Kriti Kathuria†, Rahul Badhwar, Rakesh Kanji, Anupam Jain, Avneet Kaur, Rashmi Nagpal, and Ganesh Bagler*, FlavorDB: A database of flavor molecules, Nucleic Acids Research, gkx957, (2017). †Equal contribution *Corresponding Author\n\t\t\t</strong>\n\t\t"
  },
  {
    "id": "faq-22",
    "header": "Q22: Who is the team behind FlavorDB?",
    "bodyHtml": "\n\n\t\t\t<table class=\"table table-striped\">\n\t\t\t\t<thead>\n\t\t\t\t\t<tr><th>Name</th>\n\t\t\t\t\t<th>Position</th>\n\t\t\t\t\t<th>Affiliation</th>\n\t\t\t\t\t<th>Contribution</th>\n\t\t\t\t</tr></thead>\n\t\t\t\t<tbody>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td><a href=\"/flavordb/contact\">Ganesh Bagler</a></td>\n\t\t\t\t\t\t<td>Project Head</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Idea conception, Project design and management, Database design and implementation   </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Neelansh Garg</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>USICT, Guru Gobind Singh Indraprastha University, New Delhi</td>\n\t\t\t\t\t\t<td>Database design, Development of FlavorDB Web Resource, Data Mining, Data Visualisation and Data Analytics </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Apuroop Sethupathy</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Ashoka University, Sonepat</td>\n\t\t\t\t\t\t<td>Database design, Development of FlavorDB Web Resource, Data Mining, Data Visualisation and Data Analytics </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Rudraksh Tuwani</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Sri Venkateswara College, Delhi University</td>\n\t\t\t\t\t\t<td>Natural Language Processing, feature extraction, Data Mining and Data Analytics </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Rakhi N K</td>\n\t\t\t\t\t\t<td>PhD Research Scholar</td>\n\t\t\t\t\t\t<td>Department of Bioscience and Bioengineering, Indian Institute of Technology Jodhpur, Jodhpur</td>\n\t\t\t\t\t\t<td>Manual data compilation, and curation, Quality Check, food pairing analysis</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Shubham Dokania</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Delhi Technological University, New Delhi</td>\n\t\t\t\t\t\t<td>Feature extraction and data mining</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Arvind Iyer</td>\n\t\t\t\t\t\t<td>M.Tech (Computational Biology) Student</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Database design, Development of FlavorDB Web Resource, Data Mining</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Ayushi Gupta</td>\n\t\t\t\t\t\t<td>M.Tech (Computational Biology) Student</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Data compilation, curation and Data structure design </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Shubhra Agrawal</td>\n\t\t\t\t\t\t<td>M.Tech Student</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Data compilation, curation and Data structure design </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Navjot Singh</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Delhi Technological University, New Delhi</td>\n\t\t\t\t\t\t<td>Food pairing analysis</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Shubham Shukla</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Northern India Engineering College, Guru Gobind Singh Indraprastha University, New Delhi</td>\n\t\t\t\t\t\t<td>Data extraction and Quality Check </td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Kriti Kathuria</td>\n\t\t\t\t\t\t<td>Summer Research Intern</td>\n\t\t\t\t\t\t<td>Maharaja Agrasen College, Delhi University, New Delhi</td>\n\t\t\t\t\t\t<td>Data retrieval and compilation, Quality Check</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Anupam Jain</td>\n\t\t\t\t\t\t<td>M.Tech. (Systems Science) Student</td>\n\t\t\t\t\t\t<td>Department of Bioscience and Bioengineering, Indian Institute of Technology Jodhpur, Jodhpur</td>\n\t\t\t\t\t\t<td>Data compilation and food pairing analysis</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Rahul Badhwar</td>\n\t\t\t\t\t\t<td>PhD Research Scholar</td>\n\t\t\t\t\t\t<td>Department of Bioscience and Bioengineering, Indian Institute of Technology Jodhpur, Jodhpur</td>\n\t\t\t\t\t\t<td>Molecular properties extraction</td>\n\t\t\t\t\t</tr>\n\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Rakesh Kanji</td>\n\t\t\t\t\t\t<td>PhD Research Scholar</td>\n\t\t\t\t\t\t<td>Department of Bioscience and Bioengineering, Indian Institute of Technology Jodhpur, Jodhpur</td>\n\t\t\t\t\t\t<td>Molecular properties extraction</td>\n\t\t\t\t\t</tr>\n\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Avneet Kaur</td>\n\t\t\t\t\t\t<td>Research Intern</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Data compilation assistance</td>\n\t\t\t\t\t</tr>\n\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td>Rashmi Nagpal</td>\n\t\t\t\t\t\t<td>Research Intern</td>\n\t\t\t\t\t\t<td>Center for Computational Biology, Indraprastha Institute of Information Technology (IIIT-Delhi), New Delhi</td>\n\t\t\t\t\t\t<td>Data compilation assistance</td>\n\t\t\t\t\t</tr>\n\n\n\t\t\t\t</tbody>\n\t\t\t</table>\n\n\t\t"
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
            {openPanel === faq.id && (
              <div className="legacy-panel-collapse">
                <div 
                  className="legacy-panel-body" 
                  dangerouslySetInnerHTML={{ __html: faq.bodyHtml }} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
