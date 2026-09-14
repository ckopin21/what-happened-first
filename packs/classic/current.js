// Fresh Classic Jeopardy pack. Keep this schema stable so the engine can swap content safely.
window.CLASSIC_JEOPARDY_PACK = {
  id: "general-knowledge-v2",
  title: "CLASSIC JEOPARDY",
  subtitle: "Everyone answers every clue.",
  genre: "General Knowledge",
  rules: { wrongMultiplier: 0, hintMultiplier: 0.5 },
  categories: [
    { name: "World Geography", clues: [
      { value:100, question:"What is the capital of Canada?", answer:"Ottawa", aliases:["Ottawa"], hint:"It is in Ontario, but it is not Toronto." },
      { value:200, question:"What strait separates southern Spain from northern Morocco?", answer:"Strait of Gibraltar", aliases:["Strait of Gibraltar","Gibraltar Strait","Gibraltar"], hint:"It links the Atlantic Ocean with the Mediterranean Sea." },
      { value:300, question:"Salar de Uyuni, the world's largest salt flat, is in what country?", answer:"Bolivia", aliases:["Bolivia"], hint:"It is a landlocked country in western South America." },
      { value:400, question:"Ulaanbaatar is the capital of what country?", answer:"Mongolia", aliases:["Mongolia"], hint:"This country lies between Russia and China." },
      { value:500, question:"What river forms a large portion of the border between Texas and Mexico?", answer:"Rio Grande", aliases:["Rio Grande","The Rio Grande","Rio Bravo","Rio Bravo del Norte"], hint:"It flows southeast toward the Gulf of Mexico.", followup:{ question:"What name is commonly used for the Rio Grande in Mexico?", answer:"Rio Bravo", aliases:["Rio Bravo","Rio Bravo del Norte","Río Bravo","Río Bravo del Norte"], hint:"Its Spanish name includes a word meaning fierce or brave." } }
    ]},
    { name: "History", clues: [
      { value:100, question:"What civilization built Chichén Itzá?", answer:"Maya", aliases:["Maya","Mayans","Mayan civilization","The Maya"], hint:"This civilization flourished in Mesoamerica." },
      { value:200, question:"What war was formally ended between Germany and the Allied powers by the Treaty of Versailles?", answer:"World War I", aliases:["World War I","WWI","World War 1","First World War","The Great War"], hint:"The treaty was signed in 1919." },
      { value:300, question:"Suleiman the Magnificent ruled what empire?", answer:"Ottoman Empire", aliases:["Ottoman Empire","The Ottoman Empire","Ottomans"], hint:"Its capital was Constantinople during his reign." },
      { value:400, question:"What English ship carried the Pilgrims to New England in 1620?", answer:"Mayflower", aliases:["Mayflower","The Mayflower"], hint:"Its passengers established Plymouth Colony." },
      { value:500, question:"Which leader crowned himself Emperor of the French in 1804?", answer:"Napoleon Bonaparte", aliases:["Napoleon","Napoleon Bonaparte","Bonaparte","Napoleon I"], hint:"He rose to power after the French Revolution.", followup:{ question:"On what island did Napoleon spend his final exile?", answer:"Saint Helena", aliases:["Saint Helena","St Helena","St. Helena"], hint:"It is a remote island in the South Atlantic." } }
    ]},
    { name: "Science", clues: [
      { value:100, question:"What gas do plants absorb from the atmosphere during photosynthesis?", answer:"Carbon dioxide", aliases:["Carbon dioxide","CO2","CO₂"], hint:"Humans exhale this gas." },
      { value:200, question:"What SI unit measures electric current?", answer:"Ampere", aliases:["Ampere","Amp","Amps","Amperes"], hint:"Its symbol is A." },
      { value:300, question:"What is the largest organ of the human body?", answer:"Skin", aliases:["Skin","The skin"], hint:"It forms the body's outer protective barrier." },
      { value:400, question:"What type of blood vessel carries blood away from the heart?", answer:"Artery", aliases:["Artery","Arteries"], hint:"The aorta is the largest example." },
      { value:500, question:"What is the boundary around a black hole beyond which nothing can escape called?", answer:"Event horizon", aliases:["Event horizon","The event horizon"], hint:"Crossing this boundary prevents even light from returning.", followup:{ question:"What theoretical radiation from black holes is named after a physicist?", answer:"Hawking radiation", aliases:["Hawking radiation","Hawking"], hint:"It is named for Stephen Hawking." } }
    ]},
    { name: "Entertainment", clues: [
      { value:100, question:"What is the name of Mario's brother in Nintendo games?", answer:"Luigi", aliases:["Luigi","Luigi Mario"], hint:"He traditionally wears green." },
      { value:200, question:"What fictional continent contains King's Landing in Game of Thrones?", answer:"Westeros", aliases:["Westeros"], hint:"Most of the Seven Kingdoms are located there." },
      { value:300, question:"Who directed Inception, Interstellar, and Oppenheimer?", answer:"Christopher Nolan", aliases:["Christopher Nolan","Nolan"], hint:"He also directed The Dark Knight trilogy." },
      { value:400, question:"What band released the 1977 album Rumours?", answer:"Fleetwood Mac", aliases:["Fleetwood Mac"], hint:"The album includes Dreams and Go Your Own Way." },
      { value:500, question:"What 2019 South Korean film became the first non-English-language movie to win the Academy Award for Best Picture?", answer:"Parasite", aliases:["Parasite"], hint:"It is a dark comedy-thriller centered on two families.", followup:{ question:"Who directed Parasite?", answer:"Bong Joon-ho", aliases:["Bong Joon-ho","Bong Joon Ho","Bong"], hint:"The director also made Snowpiercer and Okja." } }
    ]},
    { name: "Sports", clues: [
      { value:100, question:"How many players from one team are on the court at a time in basketball?", answer:"Five", aliases:["5","Five","5 players","Five players"], hint:"A full lineup includes two guards, two forwards, and a center." },
      { value:200, question:"What trophy is awarded to the NHL champion?", answer:"Stanley Cup", aliases:["Stanley Cup","The Stanley Cup"], hint:"It is one of the oldest championship trophies in North American sports." },
      { value:300, question:"Which country won the 2010 FIFA World Cup?", answer:"Spain", aliases:["Spain"], hint:"Its winning goal in the final came during extra time." },
      { value:400, question:"Which boxer was famously nicknamed 'The Greatest'?", answer:"Muhammad Ali", aliases:["Muhammad Ali","Ali","Cassius Clay"], hint:"He was born Cassius Clay." },
      { value:500, question:"Who achieved tennis's only calendar-year Golden Slam in singles, in 1988?", answer:"Steffi Graf", aliases:["Steffi Graf","Graf"], hint:"She won all four majors plus Olympic singles gold that year.", followup:{ question:"Which city hosted the 1988 Summer Olympics where she completed the Golden Slam?", answer:"Seoul", aliases:["Seoul","Seoul, South Korea"], hint:"The Games were held in South Korea." } }
    ]}
  ]
};
