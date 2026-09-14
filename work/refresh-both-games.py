from pathlib import Path
import re

root=Path('.')
timeline=root/'outputs/dog-jeopardy.html'
classic=root/'packs/classic/current.js'

html=timeline.read_text()

new_categories=r'''const categories=[
{name:"Technology",clues:[
{q:"Which happened first: Wikipedia launched, or the first iPod was released?",h:"Both milestones arrived during 2001 and helped define the early-2000s internet and gadget era.",a:"Wikipedia launched first",choices:["Wikipedia launched","the first iPod was released"]},
{q:"Which happened first: Netflix was founded, or Google was founded?",h:"Both companies began during the late-1990s internet boom, roughly a year apart.",a:"Netflix was founded first",choices:["Netflix was founded","Google was founded"]},
{q:"Which happened first: the USB 1.0 specification was released, or Bluetooth 1.0 was released?",h:"Both connectivity standards emerged during the second half of the 1990s, a few years apart.",a:"the USB 1.0 specification was released first",choices:["the USB 1.0 specification was released","Bluetooth 1.0 was released"]},
{q:"Which happened first: the first Amazon Kindle was released, or the first commercial Android phone was released?",h:"These consumer devices debuted near the end of the 2000s, about a year apart.",a:"the first Amazon Kindle was released first",choices:["the first Amazon Kindle was released","the first commercial Android phone was released"]},
{q:"Which happened first: Instagram launched, or Snapchat launched?",h:"Both mobile social apps arrived near the start of the 2010s, about a year apart.",a:"Instagram launched first",choices:["Instagram launched","Snapchat launched"],special:true,fq:"In what year did Instagram launch?",fa:"2010 — Instagram launched in October 2010.",fchoices:["2008","2009","2010","2011"],fcorrect:"2010"}
]},
{name:"History",clues:[
{q:"Which happened first: the Mongol Empire was founded under Genghis Khan, or Magna Carta was sealed?",h:"Both events occurred in the early 13th century, less than a decade apart.",a:"the Mongol Empire was founded under Genghis Khan first",choices:["the Mongol Empire was founded under Genghis Khan","Magna Carta was sealed"]},
{q:"Which happened first: the Hundred Years' War began, or the Black Death reached Europe?",h:"Both reshaped 14th-century Europe and began within about a decade of one another.",a:"the Hundred Years' War began first",choices:["the Hundred Years' War began","the Black Death reached Europe"]},
{q:"Which happened first: the U.S. Declaration of Independence was adopted, or James Cook reached Hawaii?",h:"These late-18th-century events occurred only a couple of years apart.",a:"the U.S. Declaration of Independence was adopted first",choices:["the U.S. Declaration of Independence was adopted","James Cook reached Hawaii"]},
{q:"Which happened first: the French Revolution began, or the first U.S. census was conducted?",h:"These events happened around the turn from the 1780s to the 1790s.",a:"the French Revolution began first",choices:["the French Revolution began","the first U.S. census was conducted"]},
{q:"Which happened first: the Suez Canal opened, or the German Empire was proclaimed?",h:"Both milestones transformed 19th-century Europe and trade within a very short span.",a:"the Suez Canal opened first",choices:["the Suez Canal opened","the German Empire was proclaimed"],special:true,fq:"In which decade did the Suez Canal open?",fa:"The 1860s — the Suez Canal opened in 1869.",fchoices:["1840s","1850s","1860s","1870s"],fcorrect:"1860s"}
]},
{name:"Pop Culture",clues:[
{q:"Which happened first: MTV launched, or Michael Jackson's Thriller album was released?",h:"Both became defining pop-culture landmarks of the early 1980s, roughly a year apart.",a:"MTV launched first",choices:["MTV launched","Michael Jackson's Thriller album was released"]},
{q:"Which happened first: The Simpsons premiered as a full TV series, or Home Alone was released?",h:"These entertainment milestones arrived around the turn from the 1980s to the 1990s.",a:"The Simpsons premiered as a full TV series first",choices:["The Simpsons premiered as a full TV series","Home Alone was released"]},
{q:"Which happened first: Jurassic Park was released in theaters, or Friends premiered on television?",h:"Both were major 1990s hits and debuted in consecutive years.",a:"Jurassic Park was released in theaters first",choices:["Jurassic Park was released in theaters","Friends premiered on television"]},
{q:"Which happened first: the Pokémon anime premiered in Japan, or the movie Titanic was released?",h:"Both debuted during 1997, several months apart.",a:"the Pokémon anime premiered in Japan first",choices:["the Pokémon anime premiered in Japan","the movie Titanic was released"]},
{q:"Which happened first: Netflix introduced streaming, or Breaking Bad premiered?",h:"These milestones arrived in consecutive years near the end of the 2000s.",a:"Netflix introduced streaming first",choices:["Netflix introduced streaming","Breaking Bad premiered"],special:true,fq:"In what year did Netflix introduce its streaming service?",fa:"2007 — Netflix began offering streaming in 2007.",fchoices:["2005","2006","2007","2008"],fcorrect:"2007"}
]},
{name:"Science",clues:[
{q:"Which happened first: Darwin published On the Origin of Species, or Gregor Mendel published his pea-plant experiments?",h:"Both foundational biology works appeared during the mid-19th century, several years apart.",a:"Darwin published On the Origin of Species first",choices:["Darwin published On the Origin of Species","Gregor Mendel published his pea-plant experiments"]},
{q:"Which happened first: radioactivity was discovered, or the electron was discovered?",h:"These physics discoveries occurred in consecutive years near the end of the 19th century.",a:"radioactivity was discovered first",choices:["radioactivity was discovered","the electron was discovered"]},
{q:"Which happened first: penicillin was discovered, or Pluto was discovered?",h:"Both discoveries occurred around the turn from the 1920s to the 1930s.",a:"penicillin was discovered first",choices:["penicillin was discovered","Pluto was discovered"]},
{q:"Which happened first: the DNA double-helix structure was described, or Sputnik 1 was launched?",h:"These scientific milestones happened within the same decade during the 1950s.",a:"the DNA double-helix structure was described first",choices:["the DNA double-helix structure was described","Sputnik 1 was launched"]},
{q:"Which happened first: 51 Pegasi b was announced, or Dolly the sheep was born?",h:"These breakthroughs in astronomy and biology occurred in consecutive years in the mid-1990s.",a:"51 Pegasi b was announced first",choices:["51 Pegasi b was announced","Dolly the sheep was born"],special:true,fq:"In what year was 51 Pegasi b announced?",fa:"1995 — its discovery was announced in 1995.",fchoices:["1993","1994","1995","1996"],fcorrect:"1995"}
]},
{name:"Sports",clues:[
{q:"Which happened first: the first Wimbledon Championship was held, or the first modern Olympic Games were held?",h:"Both sporting traditions began in the late 19th century, less than two decades apart.",a:"the first Wimbledon Championship was held first",choices:["the first Wimbledon Championship was held","the first modern Olympic Games were held"]},
{q:"Which happened first: the first FIFA World Cup was held, or the first NBA game was played?",h:"These major sports milestones began during the first half of the 20th century, more than a decade apart.",a:"the first FIFA World Cup was held first",choices:["the first FIFA World Cup was held","the first NBA game was played"]},
{q:"Which happened first: Super Bowl I was played, or tennis entered the Open Era?",h:"These changes in major sports occurred in consecutive years during the late 1960s.",a:"Super Bowl I was played first",choices:["Super Bowl I was played","tennis entered the Open Era"]},
{q:"Which happened first: Michael Jordan won his first NBA championship, or Tiger Woods won his first Masters Tournament?",h:"Both career-defining victories happened during the 1990s, several years apart.",a:"Michael Jordan won his first NBA championship first",choices:["Michael Jordan won his first NBA championship","Tiger Woods won his first Masters Tournament"]},
{q:"Which happened first: the NBA held its first game, or the first Formula 1 World Championship season began?",h:"These postwar sports milestones were separated by only a few years.",a:"the NBA held its first game first",choices:["the NBA held its first game","the first Formula 1 World Championship season began"],special:true,fq:"At which circuit was the first Formula 1 World Championship race held?",fa:"Silverstone — the 1950 British Grand Prix at Silverstone opened the championship.",fchoices:["Silverstone","Monza","Monaco","Spa-Francorchamps"],fcorrect:"Silverstone"}
]}
];'''
html2=re.sub(r'const categories=\[[\s\S]*?\];\s*\n\s*let players=',new_categories+'\n\nlet players=',html,count=1)
if html2==html: raise SystemExit('categories replacement failed')
html=html2

avatar_block='''/* AVATAR_NEW_VECTOR_ART_V14: standalone SVG assets for reliable mobile rendering */\nconst avatarOptions=[\n{name:"Corgi",image:"../assets/avatars/corgi.svg?v=2"},\n{name:"Cat",image:"../assets/avatars/cat.svg?v=2"},\n{name:"Panda",image:"../assets/avatars/panda.svg?v=2"},\n{name:"Penguin",image:"../assets/avatars/penguin.svg?v=2"},\n{name:"Fox",image:"../assets/avatars/fox.svg?v=2"},\n{name:"Frog",image:"../assets/avatars/frog.svg?v=2"},\n{name:"Shark",image:"../assets/avatars/shark.svg?v=2"},\n{name:"Duck",image:"../assets/avatars/duck.svg?v=2"}\n];'''
html2=re.sub(r'function avatarSvg\(inner\)\{[\s\S]*?\nconst avatarOptions=\[[\s\S]*?\n\];',avatar_block,html,count=1)
if html2==html: raise SystemExit('avatar replacement failed')
html=html2
timeline.write_text(html)

classic.write_text(r'''// Fresh Classic Jeopardy pack. Keep this schema stable so the engine can swap content safely.
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
''')
print('refreshed timeline avatars/questions and classic questions')
