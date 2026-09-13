// Classic Jeopardy question content lives in this one file so the genre can be
// swapped without touching the game engine. Ask ChatGPT to replace this pack
// with a new theme while preserving the schema below.
window.CLASSIC_JEOPARDY_PACK = {
  id: "general-knowledge-v1",
  title: "CLASSIC JEOPARDY",
  subtitle: "Everyone answers every clue.",
  genre: "General Knowledge",
  rules: {
    wrongMultiplier: 0,
    hintMultiplier: 0.5
  },
  categories: [
    {
      name: "World Geography",
      clues: [
        { value: 100, question: "What is the capital of Japan?", answer: "Tokyo", aliases: ["Tokyo"], hint: "It is Japan's largest city." },
        { value: 200, question: "What river runs through Paris?", answer: "The Seine", aliases: ["Seine", "The Seine"], hint: "Its name begins with S." },
        { value: 300, question: "Marrakech is a major city in what country?", answer: "Morocco", aliases: ["Morocco"], hint: "This North African country borders Algeria." },
        { value: 400, question: "What is the largest country in the world by land area?", answer: "Russia", aliases: ["Russia", "Russian Federation"], hint: "It spans Europe and Asia." },
        { value: 500, question: "What South American country has Portuguese as its official language?", answer: "Brazil", aliases: ["Brazil"], hint: "It is the continent's largest country." }
      ]
    },
    {
      name: "History",
      clues: [
        { value: 100, question: "Who was the first president of the United States?", answer: "George Washington", aliases: ["George Washington", "Washington"], hint: "He also commanded the Continental Army." },
        { value: 200, question: "What civilization built Machu Picchu?", answer: "The Inca", aliases: ["Inca", "The Inca", "Incan", "Inca Empire"], hint: "Their empire was centered in Peru." },
        { value: 300, question: "What 1215 document limited the power of the English king?", answer: "Magna Carta", aliases: ["Magna Carta", "The Magna Carta"], hint: "It was sealed by King John." },
        { value: 400, question: "What Roman city was buried by Mount Vesuvius in AD 79?", answer: "Pompeii", aliases: ["Pompeii"], hint: "Its ruins are near modern Naples." },
        { value: 500, question: "Mansa Musa ruled what West African empire?", answer: "The Mali Empire", aliases: ["Mali", "Mali Empire", "The Mali Empire"], hint: "Its name is also a modern country." }
      ]
    },
    {
      name: "Science",
      clues: [
        { value: 100, question: "What is the common name for H₂O?", answer: "Water", aliases: ["Water"], hint: "You drink it every day." },
        { value: 200, question: "What planet is famous for the Great Red Spot?", answer: "Jupiter", aliases: ["Jupiter"], hint: "It is the largest planet in our solar system." },
        { value: 300, question: "What process lets plants convert light energy into chemical energy?", answer: "Photosynthesis", aliases: ["Photosynthesis"], hint: "It uses sunlight, water, and carbon dioxide." },
        { value: 400, question: "What element has atomic number 79?", answer: "Gold", aliases: ["Gold", "Au"], hint: "Its chemical symbol is Au." },
        { value: 500, question: "What scientist formulated the three laws of motion?", answer: "Isaac Newton", aliases: ["Isaac Newton", "Newton", "Sir Isaac Newton"], hint: "He is also associated with universal gravitation." }
      ]
    },
    {
      name: "Pop Culture",
      clues: [
        { value: 100, question: "What is the name of the cowboy toy in Toy Story?", answer: "Woody", aliases: ["Woody", "Sheriff Woody"], hint: "Tom Hanks voices him." },
        { value: 200, question: "What school of witchcraft and wizardry does Harry Potter attend?", answer: "Hogwarts", aliases: ["Hogwarts", "Hogwarts School of Witchcraft and Wizardry"], hint: "Its houses include Gryffindor and Slytherin." },
        { value: 300, question: "What blue video game character is known for collecting rings at high speed?", answer: "Sonic the Hedgehog", aliases: ["Sonic", "Sonic the Hedgehog"], hint: "He is Sega's mascot." },
        { value: 400, question: "What artist released the hit song “Shake It Off”?", answer: "Taylor Swift", aliases: ["Taylor Swift", "Swift"], hint: "The song appeared on the album 1989." },
        { value: 500, question: "What TV series is set around Hawkins, Indiana and the Upside Down?", answer: "Stranger Things", aliases: ["Stranger Things"], hint: "Eleven is one of its main characters." }
      ]
    },
    {
      name: "Sports",
      clues: [
        { value: 100, question: "How many points is a touchdown worth before the extra point attempt?", answer: "Six", aliases: ["6", "Six", "6 points", "Six points"], hint: "It is one more than five." },
        { value: 200, question: "The FIFA World Cup is normally held every how many years?", answer: "Four", aliases: ["4", "Four", "4 years", "Four years"], hint: "It matches the Summer Olympic cycle." },
        { value: 300, question: "Who was the first gymnast to receive a perfect 10 at the Olympics?", answer: "Nadia Comăneci", aliases: ["Nadia Comaneci", "Nadia Comăneci", "Comaneci", "Comăneci"], hint: "She competed for Romania in 1976." },
        { value: 400, question: "What NBA franchise plays its home games in Toronto?", answer: "Toronto Raptors", aliases: ["Toronto Raptors", "Raptors", "The Raptors"], hint: "Their name references a dinosaur." },
        { value: 500, question: "How many tournaments make up a calendar-year Grand Slam in tennis?", answer: "Four", aliases: ["4", "Four", "4 tournaments", "Four tournaments"], hint: "Australian, French, Wimbledon, and US." }
      ]
    }
  ]
};
