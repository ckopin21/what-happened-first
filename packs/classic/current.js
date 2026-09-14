// Fresh Classic Jeopardy pack. Keep this schema stable so the engine can swap content safely.
window.CLASSIC_JEOPARDY_PACK = {
  id: "general-knowledge-v3",
  title: "CLASSIC JEOPARDY",
  subtitle: "Everyone answers every clue.",
  genre: "General Knowledge",
  rules: { wrongMultiplier: 0, hintMultiplier: 0.5 },
  categories: [
    { name: "Oceans & Islands", clues: [
      { value:100, question:"What is the largest ocean on Earth?", answer:"Pacific Ocean", aliases:["Pacific Ocean","Pacific","The Pacific"], hint:"It lies between Asia and the Americas." },
      { value:200, question:"Reykjavík is the capital of what island nation?", answer:"Iceland", aliases:["Iceland"], hint:"This Nordic country sits in the North Atlantic." },
      { value:300, question:"Sumatra is an island belonging to what country?", answer:"Indonesia", aliases:["Indonesia"], hint:"This Southeast Asian nation contains thousands of islands." },
      { value:400, question:"Angel Falls, the world's tallest uninterrupted waterfall, is in what country?", answer:"Venezuela", aliases:["Venezuela"], hint:"It is in northern South America." },
      { value:500, question:"What sea is defined by ocean currents rather than by surrounding land?", answer:"Sargasso Sea", aliases:["Sargasso Sea","The Sargasso Sea"], hint:"It is famous for floating mats of sargassum seaweed.", followup:{ question:"The Sargasso Sea is located within which ocean?", answer:"Atlantic Ocean", aliases:["Atlantic Ocean","Atlantic","The Atlantic"], hint:"It lies east of North America." } }
    ]},
    { name: "Words & Language", clues: [
      { value:100, question:"What do you call a word with the opposite meaning of another word?", answer:"Antonym", aliases:["Antonym","An antonym"], hint:"Hot and cold are an example pair." },
      { value:200, question:"What is a sentence containing every letter of the alphabet called?", answer:"Pangram", aliases:["Pangram","A pangram"], hint:"The quick brown fox sentence is a famous example." },
      { value:300, question:"The prefix bio-, as in biology, comes from a Greek word meaning what?", answer:"Life", aliases:["Life","Living","Living things"], hint:"Biology is the study of this." },
      { value:400, question:"What word names an intense fear of heights?", answer:"Acrophobia", aliases:["Acrophobia"], hint:"Its Greek root refers to something high or at the top." },
      { value:500, question:"What are the logographic characters used in Japanese writing called?", answer:"Kanji", aliases:["Kanji","Kanji characters"], hint:"Japanese also uses the hiragana and katakana syllabaries.", followup:{ question:"Kanji characters were historically adopted from which language?", answer:"Chinese", aliases:["Chinese","The Chinese language","Written Chinese"], hint:"The source language originated across the East China Sea." } }
    ]},
    { name: "Food & Drink", clues: [
      { value:100, question:"What legume is the main ingredient in traditional hummus?", answer:"Chickpeas", aliases:["Chickpeas","Chickpea","Garbanzo beans","Garbanzo bean"], hint:"They are also called garbanzo beans." },
      { value:200, question:"What crumbly white cheese is traditionally used in a Greek salad?", answer:"Feta", aliases:["Feta","Feta cheese"], hint:"It is commonly made from sheep's milk or a sheep-and-goat blend." },
      { value:300, question:"What finely ground green tea powder is used in Japanese tea ceremonies?", answer:"Matcha", aliases:["Matcha","Matcha powder"], hint:"It gives drinks and desserts a vivid green color." },
      { value:400, question:"Paella originated in what Spanish city or surrounding region?", answer:"Valencia", aliases:["Valencia","Valencian Community","The Valencia region"], hint:"This Mediterranean city is on Spain's eastern coast." },
      { value:500, question:"What dessert base is made by whipping egg whites with sugar?", answer:"Meringue", aliases:["Meringue","A meringue"], hint:"It can be baked crisp or used as a pie topping.", followup:{ question:"What French dessert sandwiches buttercream between two almond-meringue shells?", answer:"Macaron", aliases:["Macaron","Macarons","French macaron"], hint:"Do not confuse it with the coconut macaroon." } }
    ]},
    { name: "Wild Nature", clues: [
      { value:100, question:"What is the largest living land animal?", answer:"African bush elephant", aliases:["African bush elephant","African elephant","Bush elephant","Elephant"], hint:"It is the largest of the elephant species." },
      { value:200, question:"What process transforms a caterpillar into a butterfly?", answer:"Metamorphosis", aliases:["Metamorphosis","Complete metamorphosis"], hint:"It includes a pupal stage inside a chrysalis." },
      { value:300, question:"What fast-growing plant is the tallest member of the grass family?", answer:"Bamboo", aliases:["Bamboo"], hint:"Some species can grow several feet in one day." },
      { value:400, question:"What biological sonar ability helps many bats navigate in darkness?", answer:"Echolocation", aliases:["Echolocation","Echo location","Sonar"], hint:"The animal listens for returning sound waves." },
      { value:500, question:"The axolotl is native to what lake and canal system?", answer:"Lake Xochimilco", aliases:["Lake Xochimilco","Xochimilco","Xochimilco canals","The canals of Xochimilco"], hint:"The habitat is famous for colorful flat-bottomed boats.", followup:{ question:"Xochimilco is located within which national capital?", answer:"Mexico City", aliases:["Mexico City","Ciudad de México","CDMX"], hint:"It is the capital of Mexico." } }
    ]},
    { name: "Arts & Architecture", clues: [
      { value:100, question:"Who painted Girl with a Pearl Earring?", answer:"Johannes Vermeer", aliases:["Johannes Vermeer","Vermeer"], hint:"This Dutch painter was also known for The Milkmaid." },
      { value:200, question:"Flying buttresses are most strongly associated with what architectural style?", answer:"Gothic", aliases:["Gothic","Gothic architecture","Gothic style"], hint:"Many medieval European cathedrals use this style." },
      { value:300, question:"Who composed the ballet Swan Lake?", answer:"Pyotr Ilyich Tchaikovsky", aliases:["Tchaikovsky","Pyotr Tchaikovsky","Pyotr Ilyich Tchaikovsky"], hint:"The Russian composer also wrote The Nutcracker." },
      { value:400, question:"Who created the sculpture The Thinker?", answer:"Auguste Rodin", aliases:["Auguste Rodin","Rodin"], hint:"This French sculptor also created The Kiss." },
      { value:500, question:"Which architect designed the house Fallingwater?", answer:"Frank Lloyd Wright", aliases:["Frank Lloyd Wright","Wright","FLW"], hint:"He called his approach organic architecture.", followup:{ question:"Fallingwater is located in what U.S. state?", answer:"Pennsylvania", aliases:["Pennsylvania","PA"], hint:"The house is southeast of Pittsburgh." } }
    ]}
  ]
};
