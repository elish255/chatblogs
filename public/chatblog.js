const CHATBLOG_AVATAR_SPRITE = "/__l5e/assets-v1/bc0b72bb-247a-4197-a4ce-13aafa083dce/chatblog-avatars.jpg";
function setSpriteAvatar(el,id){el.classList.add("sprite-avatar");el.style.backgroundPosition=`${((id-1)%10)*100/9}% ${Math.floor((id-1)/10)*20}%`;}
/* =========================================================
   LUGHAPAY - KISWAHILI CONVERSATION ENGINE
   Version 2.1

   - Hakuna API
   - Hakuna API key
   - Hakuna AI service
   - Pure JavaScript
   - Context-aware conversation
   - Kila chat partner ana personality yake
   - Kila partner ana opening tofauti
   - Bot anakumbuka jina/location/work/topic
   - Replies zinafuata mazungumzo
   ========================================================= */


/* =========================================================
   1. ACCOUNT / BALANCE
   ========================================================= */

let salio = parseInt(localStorage.getItem("user_salio")) || 0;
let totalWithdrawn =
  parseInt(localStorage.getItem("user_withdrawn")) || 0;


/* =========================================================
   2. CHAT VARIABLES
   ========================================================= */

let currentSelectedMzungu = null;

let currentDurationMinutes = 1;

let currentRewardAmount = 0;
let chatTimerInterval = null;
let chatTimerSeconds = 60;
let chatTotalSeconds = 60;

// Maximum messages a visitor can send before registration is required.
const MAX_FREE_CHAT_MESSAGES = Number.POSITIVE_INFINITY;


/* =========================================================
   3. CHAT MEMORY
   ========================================================= */

let conversation = null;


/* =========================================================
   4. 30 CHAT PARTNERS
   ========================================================= */

const wazunguData = [

  {
    id: 1,
    name: "Henry",
    age: 25,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anajifunza Kiswahili kwa ajili ya safari yake ya Zanzibar.",
    style: "friendly",
    interests: ["safari", "chakula", "Tanzania"],
    openings: [
      "Habari  Mimi ni Henry. Nimekuwa nikijifunza Kiswahili hivi karibuni. Siku yako imeanzaje?",
      "Hujambo! Mimi naitwa Henry. Nafurahi kupata mtu wa kuzungumza naye kwa Kiswahili  Unatokea wapi?",
      "Mambo!  Mimi ni Henry. Bado najifunza Kiswahili, kwa hiyo ningependa sana kuzungumza nawe."
    ]
  },

  {
    id: 2,
    name: "Sarah",
    age: 28,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anapenda utamaduni, muziki na maisha ya Tanzania.",
    style: "social",
    interests: ["muziki", "utamaduni", "chakula"],
    openings: [
      "Mambo!  Mimi ni Sarah. Leo nimekuja kujifunza Kiswahili na kuongea kidogo. Unaendeleaje?",
      "Habari yako? Mimi ni Sarah  Niambie, siku yako iko vipi?",
      "Hey  Naitwa Sarah. Nimefurahi kuwa hapa. Wewe huwa unapenda kufanya nini ukiwa free?"
    ]
  },

  {
    id: 3,
    name: "Oliver",
    age: 31,
    country: "Canada",
    flag: "🇨🇦",
    bio: "Anataka kuboresha Kiswahili chake kupitia mazungumzo.",
    style: "curious",
    interests: ["lugha", "safari", "kazi"],
    openings: [
      "Hujambo  Mimi ni Oliver. Kiswahili changu bado hakijawa kizuri sana, lakini najitahidi. Unaendeleaje?",
      "Habari! Naitwa Oliver. Ningependa kujifunza Kiswahili kupitia mazungumzo ya kawaida. Unaitwa nani?",
      "Mambo  Mimi ni Oliver. Niambie kitu kimoja kuhusu wewe."
    ]
  },

  {
    id: 4,
    name: "Emma",
    age: 24,
    country: "Germany",
    flag: "🇩🇪",
    bio: "Anapenda Tanzania, nature na wildlife.",
    style: "nature",
    interests: ["nature", "wildlife", "safari"],
    openings: [
      "Habari  Mimi ni Emma. Nimekuwa nikisoma kuhusu Tanzania sana. Unaishi sehemu gani?",
      "Hujambo! Mimi naitwa Emma. Tanzania inanivutia sana. Leo unaendeleaje?",
      "Mambo!  Ningependa kujua zaidi kuhusu maisha ya Tanzania. Wewe unatokea wapi?"
    ]
  },

  {
    id: 5,
    name: "Lucas",
    age: 29,
    country: "France",
    flag: "🇫🇷",
    bio: "Anajifunza Kiswahili kwa ajili ya biashara na safari.",
    style: "business",
    interests: ["biashara", "safari", "kazi"],
    openings: [
      "Habari yako? Mimi ni Lucas  Nimeanza kujifunza Kiswahili kwa sababu napenda Tanzania. Unafanya kazi gani?",
      "Mambo! Naitwa Lucas. Ningependa kuzoea mazungumzo ya kawaida ya Kiswahili. Unaendeleaje?",
      "Hujambo  Mimi ni Lucas. Wewe ni mtu wa biashara au unasoma?"
    ]
  },

  {
    id: 6,
    name: "Sophia",
    age: 26,
    country: "Australia",
    flag: "🇦🇺",
    bio: "Anapenda Bongo Flava na utamaduni wa Tanzania.",
    style: "music",
    interests: ["muziki", "Bongo Flava", "utamaduni"],
    openings: [
      "Mambo! 🎵 Mimi ni Sophia. Nimekuwa nikisikiliza muziki wa Tanzania hivi karibuni. Wewe unapenda muziki?",
      "Habari  Naitwa Sophia. Leo ningependa tuzungumzie vitu vya kawaida. Unapenda kufanya nini?",
      "Hujambo! Mimi ni Sophia. Nimefurahi kukuona hapa  Siku yako imekuwaje?"
    ]
  },

  {
    id: 7,
    name: "Liam",
    age: 30,
    country: "Netherlands",
    flag: "🇳🇱",
    bio: "Anatamani kutembelea Arusha na kujifunza Kiswahili.",
    style: "travel",
    interests: ["Arusha", "safari", "technology"],
    openings: [
      "Hujambo! Mimi ni Liam  Nimekuwa nikijifunza Kiswahili kwa ajili ya safari yangu Tanzania. Unaishi wapi?",
      "Habari yako? Naitwa Liam. Ningependa sana kujua maisha ya kila siku Tanzania yakoje.",
      "Mambo!  Mimi ni Liam. Nimepanga kutembelea Tanzania siku moja. Leo unaendeleaje?"
    ]
  },

  {
    id: 8,
    name: "Ava",
    age: 23,
    country: "Sweden",
    flag: "🇸🇪",
    bio: "Anapenda kujifunza lugha mpya.",
    style: "language",
    interests: ["lugha", "shule", "muziki"],
    openings: [
      "Habari  Mimi ni Ava. Napenda sana kujifunza lugha mpya. Kiswahili ni lugha yangu mpya sasa!",
      "Hujambo! Naitwa Ava. Unaweza kunifundisha neno moja la Kiswahili leo? ",
      "Mambo! Mimi ni Ava  Wewe ulianza kujifunza mambo gani mapya hivi karibuni?"
    ]
  },

  {
    id: 9,
    name: "Noah",
    age: 27,
    country: "Norway",
    flag: "🇳🇴",
    bio: "Anafanya kazi ya kujitolea Tanzania.",
    style: "helpful",
    interests: ["kazi", "community", "Tanzania"],
    openings: [
      "Habari! Mimi ni Noah  Nafanya kazi ya kujitolea na ninajifunza Kiswahili. Unaishi wapi?",
      "Hujambo. Naitwa Noah. Ningependa kujifunza maneno ambayo watu hutumia kila siku.",
      "Mambo  Mimi ni Noah. Unaendeleaje leo?"
    ]
  },

  {
    id: 10,
    name: "Mia",
    age: 22,
    country: "Denmark",
    flag: "🇩🇰",
    bio: "Anapenda chakula na mazungumzo ya kawaida.",
    style: "food",
    interests: ["chakula", "kupika", "safari"],
    openings: [
      "Mambo!  Mimi ni Mia. Nina swali moja muhimu: unapenda chakula gani?",
      "Habari  Naitwa Mia. Nimekuwa nikisikia mengi kuhusu chakula cha Tanzania. Wewe unapenda kula nini?",
      "Hujambo! Mimi ni Mia. Leo nimekuja kwa mazungumzo mafupi ya Kiswahili."
    ]
  },

  {
    id: 11,
    name: "Ethan",
    age: 33,
    country: "Switzerland",
    flag: "🇨🇭",
    bio: "Anapanga kupanda Kilimanjaro.",
    style: "adventure",
    interests: ["Kilimanjaro", "safari", "sports"],
    openings: [
      "Habari  Mimi ni Ethan. Nimepanga kuja Tanzania kwa ajili ya Kilimanjaro. Unaishi wapi?",
      "Mambo! Naitwa Ethan. Mimi napenda sana adventure. Wewe unapenda kusafiri?",
      "Hujambo! Mimi ni Ethan. Unaendeleaje? Natumaini siku yako iko vizuri."
    ]
  },

  {
    id: 12,
    name: "Isabella",
    age: 27,
    country: "Italy",
    flag: "🇮🇹",
    bio: "Anataka kuwasiliana vizuri na marafiki wa Tanzania.",
    style: "friendly",
    interests: ["marafiki", "chakula", "lugha"],
    openings: [
      "Hujambo  Mimi ni Isabella. Nimefurahi kupata mtu wa kuongea naye. Unaitwa nani?",
      "Habari yako? Mimi naitwa Isabella. Leo unaendeleaje?",
      "Mambo  Ningependa kujifunza Kiswahili cha mazungumzo ya kawaida. Ukoje?"
    ]
  },

  {
    id: 13,
    name: "James",
    age: 35,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anavutiwa na muundo wa lugha ya Kiswahili.",
    style: "academic",
    interests: ["lugha", "elimu", "historia"],
    openings: [
      "Habari. Mimi ni James. Ninavutiwa sana na lugha ya Kiswahili. Wewe umejifunza lugha gani nyingine?",
      "Hujambo  Naitwa James. Ningependa kuelewa zaidi kuhusu matumizi ya Kiswahili cha kila siku.",
      "Mambo! Mimi ni James. Unaendeleaje leo?"
    ]
  },

  {
    id: 14,
    name: "Charlotte",
    age: 26,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anapenda misemo na nahau za Kiswahili.",
    style: "playful",
    interests: ["misemo", "lugha", "muziki"],
    openings: [
      "Mambo!  Mimi ni Charlotte. Nimekuwa nikijifunza misemo ya Kiswahili. Unajua msemo mzuri?",
      "Habari  Naitwa Charlotte. Leo unaendeleaje?",
      "Hujambo! Mimi ni Charlotte. Nataka tuongee kama marafiki wa kawaida."
    ]
  },

  {
    id: 15,
    name: "Benjamin",
    age: 32,
    country: "Canada",
    flag: "🇨🇦",
    bio: "Anataka kuzungumza Kiswahili kwa ufasaha.",
    style: "learner",
    interests: ["lugha", "kazi", "safari"],
    openings: [
      "Habari  Mimi ni Benjamin. Lengo langu ni kuweza kuzungumza Kiswahili vizuri. Unaishi wapi?",
      "Hujambo! Naitwa Benjamin. Unaweza kuongea Kiswahili vizuri?",
      "Mambo! Mimi ni Benjamin. Nimefurahi kuongea nawe leo."
    ]
  },

  {
    id: 16,
    name: "Amelia",
    age: 21,
    country: "New Zealand",
    flag: "🇳🇿",
    bio: "Anapenda safari na tamaduni za Afrika.",
    style: "culture",
    interests: ["utamaduni", "safari", "chakula"],
    openings: [
      "Habari  Mimi ni Amelia. Napenda sana kujifunza kuhusu tamaduni mbalimbali. Unaishi wapi?",
      "Mambo! Naitwa Amelia. Ni kitu gani unapenda zaidi kuhusu Tanzania?",
      "Hujambo  Siku yako imeanzaje?"
    ]
  },

  {
    id: 17,
    name: "Alexander",
    age: 34,
    country: "Belgium",
    flag: "🇧🇪",
    bio: "Anataka kujifunza mazungumzo ya kila siku.",
    style: "casual",
    interests: ["maisha", "kazi", "marafiki"],
    openings: [
      "Mambo! Mimi ni Alexander  Leo nataka tuongee kawaida tu. Unaendeleaje?",
      "Habari yako? Naitwa Alexander. Wewe ni mtu wa aina gani ukiwa na marafiki?",
      "Hujambo  Nimefurahi kuongea nawe. Uko salama?"
    ]
  },

  {
    id: 18,
    name: "Harper",
    age: 25,
    country: "Ireland",
    flag: "🇮🇪",
    bio: "Anapenda historia na maeneo ya pwani.",
    style: "history",
    interests: ["historia", "Zanzibar", "utamaduni"],
    openings: [
      "Habari  Mimi ni Harper. Zanzibar inanivutia sana. Umewahi kwenda huko?",
      "Mambo! Naitwa Harper. Ningependa kujua zaidi kuhusu Tanzania.",
      "Hujambo! Leo unaendeleaje?"
    ]
  },

  {
    id: 19,
    name: "Daniel",
    age: 28,
    country: "Spain",
    flag: "🇪🇸",
    bio: "Anajiandaa kwa ziara ya kikazi Tanzania.",
    style: "professional",
    interests: ["kazi", "biashara", "safari"],
    openings: [
      "Habari yako? Mimi ni Daniel. Najiandaa kuja Tanzania kwa kazi. Unafanya kazi gani?",
      "Hujambo  Naitwa Daniel. Ningependa kujifunza Kiswahili cha kutumia kazini.",
      "Mambo! Mimi ni Daniel. Unaendeleaje leo?"
    ]
  },

  {
    id: 20,
    name: "Evelyn",
    age: 29,
    country: "Finland",
    flag: "🇫🇮",
    bio: "Anasoma lugha na jamii.",
    style: "academic",
    interests: ["elimu", "lugha", "jamii"],
    openings: [
      "Habari  Mimi ni Evelyn. Napenda kujifunza kuhusu lugha na watu. Wewe unasoma au unafanya kazi?",
      "Hujambo! Naitwa Evelyn. Leo ningependa kusikia kuhusu maisha yako ya kawaida.",
      "Mambo  Unaendeleaje?"
    ]
  },

  {
    id: 21,
    name: "Matthew",
    age: 31,
    country: "Austria",
    flag: "🇦🇹",
    bio: "Anataka kuwasiliana vizuri na wenyeji.",
    style: "traveler",
    interests: ["safari", "Tanzania", "chakula"],
    openings: [
      "Hujambo! Mimi ni Matthew  Nataka kujifunza jinsi watu wanavyoongea Kiswahili kila siku.",
      "Habari yako? Naitwa Matthew. Unaishi mji gani?",
      "Mambo!  Siku yako imekuwaje?"
    ]
  },

  {
    id: 22,
    name: "Abigail",
    age: 24,
    country: "Portugal",
    flag: "🇵🇹",
    bio: "Anapenda kujifunza salamu na maneno mepesi.",
    style: "beginner",
    interests: ["lugha", "chakula", "marafiki"],
    openings: [
      "Habari  Mimi ni Abigail. Bado ni beginner kabisa kwenye Kiswahili  Unaendeleaje?",
      "Mambo! Naitwa Abigail. Unaweza kunisaidia kujifunza Kiswahili kidogo?",
      "Hujambo  Leo nataka kufanya mazoezi ya Kiswahili."
    ]
  },

  {
    id: 23,
    name: "Henry Jr",
    age: 27,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anajifunza Kiswahili kwa ajili ya project.",
    style: "technology",
    interests: ["technology", "kazi", "elimu"],
    openings: [
      "Mambo! Mimi ni Henry Jr.  Nafanya project inayohusisha Tanzania. Wewe unafanya kazi gani?",
      "Habari! Naitwa Henry Jr. Ningependa kujua zaidi kuhusu kazi za vijana Tanzania.",
      "Hujambo  Unaendeleaje leo?"
    ]
  },

  {
    id: 24,
    name: "Emily",
    age: 30,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anavutiwa na maisha ya Waswahili.",
    style: "culture",
    interests: ["utamaduni", "familia", "chakula"],
    openings: [
      "Habari  Mimi ni Emily. Ninapenda sana kujua jinsi maisha ya kila siku yalivyo Tanzania.",
      "Mambo! Naitwa Emily. Familia ni muhimu sana kwangu. Wewe unaishi na familia yako?",
      "Hujambo! Unaendeleaje?"
    ]
  },

  {
    id: 25,
    name: "Jackson",
    age: 26,
    country: "Australia",
    flag: "🇦🇺",
    bio: "Ni mwanamuziki anayejifunza Kiswahili.",
    style: "music",
    interests: ["muziki", "Bongo Flava", "creative"],
    openings: [
      "Mambo! 🎵 Mimi ni Jackson. Mimi ni mwanamuziki na napenda sana muziki wa Tanzania.",
      "Habari  Naitwa Jackson. Wewe unasikiliza muziki wa aina gani?",
      "Hujambo! Leo nataka kujua muziki unaoupenda."
    ]
  },

  {
    id: 26,
    name: "Ella",
    age: 23,
    country: "Germany",
    flag: "🇩🇪",
    bio: "Anajiandaa kwa safari ya kujitolea.",
    style: "volunteer",
    interests: ["community", "Tanzania", "travel"],
    openings: [
      "Habari  Mimi ni Ella. Najiandaa kuja Tanzania kwa kazi ya kujitolea. Unaishi wapi?",
      "Mambo! Naitwa Ella. Ningependa kujua zaidi kuhusu maisha ya kawaida Tanzania.",
      "Hujambo  Unaendeleaje leo?"
    ]
  },

  {
    id: 27,
    name: "Sebastian",
    age: 32,
    country: "Switzerland",
    flag: "🇨🇭",
    bio: "Anapenda jinsi Kiswahili kinavyosikika.",
    style: "language",
    interests: ["lugha", "muziki", "culture"],
    openings: [
      "Hujambo  Mimi ni Sebastian. Napenda sana jinsi Kiswahili kinavyosikika.",
      "Habari! Naitwa Sebastian. Unaitwa nani?",
      "Mambo  Leo unaendeleaje?"
    ]
  },

  {
    id: 28,
    name: "Aria",
    age: 25,
    country: "Norway",
    flag: "🇳🇴",
    bio: "Anataka kujua zaidi kuhusu Zanzibar.",
    style: "travel",
    interests: ["Zanzibar", "beach", "travel"],
    openings: [
      "Habari  Mimi ni Aria. Zanzibar ni sehemu ninayotamani sana kutembelea.",
      "Mambo! Naitwa Aria. Umewahi kwenda Zanzibar?",
      "Hujambo Unaishi wapi?"
    ]
  },

  {
    id: 29,
    name: "Jack",
    age: 29,
    country: "Canada",
    flag: "🇨🇦",
    bio: "Anajifunza maneno ya pongezi na shukrani.",
    style: "friendly",
    interests: ["marafiki", "lugha", "chakula"],
    openings: [
      "Mambo!  Mimi ni Jack. Nimefurahi sana kupata mtu wa kuongea naye.",
      "Habari yako? Naitwa Jack. Uko salama?",
      "Hujambo  Leo unaendeleaje?"
    ]
  },

  {
    id: 30,
    name: "Scarlett",
    age: 27,
    country: "France",
    flag: "🇫🇷",
    bio: "Anapanga kutembelea mbuga za wanyama Tanzania.",
    style: "wildlife",
    interests: ["wildlife", "safari", "nature"],
    openings: [
      "Habari  Mimi ni Scarlett. Nimekuwa nikitamani kutembelea mbuga za wanyama Tanzania.",
      "Mambo! Naitwa Scarlett. Wewe unapenda safari?",
      "Hujambo  Nimefurahi kuongea nawe leo."
    ]
  }
,

  {
    id: 31,
    name: "Daniel",
    age: 28,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anajifunza Kiswahili na anapenda mazungumzo ya kawaida.",
    style: "friendly",
    interests: ["lugha, marafiki, Tanzania"],
    openings: [
      "Habari! Mimi ni Daniel. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Daniel. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Daniel. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 32,
    name: "Chloe",
    age: 26,
    country: "France",
    flag: "🇫🇷",
    bio: "Anapenda kukutana na watu na kujifunza utamaduni wa Tanzania.",
    style: "social",
    interests: ["lugha, utamaduni, marafiki"],
    openings: [
      "Habari! Mimi ni Chloe. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Chloe. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Chloe. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 33,
    name: "James",
    age: 30,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anavutiwa na biashara na kujifunza Kiswahili.",
    style: "business",
    interests: ["biashara, kazi, teknolojia"],
    openings: [
      "Habari! Mimi ni James. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa James. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni James. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 34,
    name: "Lily",
    age: 24,
    country: "Australia",
    flag: "🇦🇺",
    bio: "Anapenda muziki na utamaduni wa Afrika Mashariki.",
    style: "music",
    interests: ["muziki, utamaduni, lugha"],
    openings: [
      "Habari! Mimi ni Lily. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Lily. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Lily. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 35,
    name: "Benjamin",
    age: 32,
    country: "Germany",
    flag: "🇩🇪",
    bio: "Anapenda safari na anataka kutembelea Tanzania.",
    style: "travel",
    interests: ["safari, Tanzania, travel"],
    openings: [
      "Habari! Mimi ni Benjamin. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Benjamin. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Benjamin. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 36,
    name: "Grace",
    age: 27,
    country: "Canada",
    flag: "🇨🇦",
    bio: "Anajifunza Kiswahili na anapenda mazungumzo ya kawaida.",
    style: "friendly",
    interests: ["lugha, marafiki, Tanzania"],
    openings: [
      "Habari! Mimi ni Grace. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Grace. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Grace. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 37,
    name: "Thomas",
    age: 29,
    country: "Switzerland",
    flag: "🇨🇭",
    bio: "Anapenda adventure na maeneo ya kuvutia Tanzania.",
    style: "adventure",
    interests: ["adventure, safari, nature"],
    openings: [
      "Habari! Mimi ni Thomas. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Thomas. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Thomas. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 38,
    name: "Sophie",
    age: 25,
    country: "Sweden",
    flag: "🇸🇪",
    bio: "Anapenda kujifunza lugha mpya na kuzungumza na watu.",
    style: "language",
    interests: ["lugha, culture, muziki"],
    openings: [
      "Habari! Mimi ni Sophie. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Sophie. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Sophie. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 39,
    name: "William",
    age: 34,
    country: "Netherlands",
    flag: "🇳🇱",
    bio: "Anapenda teknolojia na mazungumzo kuhusu maisha ya kila siku.",
    style: "technology",
    interests: ["technology, kazi, lugha"],
    openings: [
      "Habari! Mimi ni William. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa William. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni William. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 40,
    name: "Amelia",
    age: 23,
    country: "Denmark",
    flag: "🇩🇰",
    bio: "Anapenda chakula na kujifunza mapishi ya Tanzania.",
    style: "food",
    interests: ["chakula, kupika, travel"],
    openings: [
      "Habari! Mimi ni Amelia. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Amelia. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Amelia. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 41,
    name: "George",
    age: 31,
    country: "Ireland",
    flag: "🇮🇪",
    bio: "Anapenda safari na anataka kutembelea Tanzania.",
    style: "travel",
    interests: ["safari, Tanzania, travel"],
    openings: [
      "Habari! Mimi ni George. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa George. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni George. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 42,
    name: "Isla",
    age: 28,
    country: "Scotland",
    flag: "🏴",
    bio: "Anapenda nature na wildlife za Tanzania.",
    style: "nature",
    interests: ["nature, wildlife, safari"],
    openings: [
      "Habari! Mimi ni Isla. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Isla. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Isla. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 43,
    name: "Matthew",
    age: 27,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anapenda michezo na mazungumzo ya kirafiki.",
    style: "sports",
    interests: ["sports, fitness, marafiki"],
    openings: [
      "Habari! Mimi ni Matthew. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Matthew. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Matthew. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 44,
    name: "Hannah",
    age: 26,
    country: "New Zealand",
    flag: "🇳🇿",
    bio: "Anapenda kujifunza tamaduni mbalimbali.",
    style: "culture",
    interests: ["culture, Tanzania, travel"],
    openings: [
      "Habari! Mimi ni Hannah. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Hannah. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Hannah. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 45,
    name: "Alexander",
    age: 35,
    country: "Austria",
    flag: "🇦🇹",
    bio: "Anapenda kuuliza na kujifunza kuhusu maisha Tanzania.",
    style: "curious",
    interests: ["Tanzania, culture, watu"],
    openings: [
      "Habari! Mimi ni Alexander. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Alexander. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Alexander. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 46,
    name: "Megan",
    age: 24,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anapenda muziki na utamaduni wa Afrika Mashariki.",
    style: "music",
    interests: ["muziki, utamaduni, lugha"],
    openings: [
      "Habari! Mimi ni Megan. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Megan. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Megan. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 47,
    name: "Robert",
    age: 33,
    country: "Belgium",
    flag: "🇧🇪",
    bio: "Anavutiwa na biashara na kujifunza Kiswahili.",
    style: "business",
    interests: ["biashara, kazi, teknolojia"],
    openings: [
      "Habari! Mimi ni Robert. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Robert. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Robert. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 48,
    name: "Lucy",
    age: 22,
    country: "Finland",
    flag: "🇫🇮",
    bio: "Anapenda kujifunza lugha mpya na kuzungumza na watu.",
    style: "language",
    interests: ["lugha, culture, muziki"],
    openings: [
      "Habari! Mimi ni Lucy. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Lucy. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Lucy. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 49,
    name: "Michael",
    age: 29,
    country: "United States",
    flag: "🇺🇸",
    bio: "Anapenda safari na anataka kutembelea Tanzania.",
    style: "travel",
    interests: ["safari, Tanzania, travel"],
    openings: [
      "Habari! Mimi ni Michael. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Michael. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Michael. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 50,
    name: "Clara",
    age: 30,
    country: "Germany",
    flag: "🇩🇪",
    bio: "Anapenda nature na wildlife za Tanzania.",
    style: "nature",
    interests: ["nature, wildlife, safari"],
    openings: [
      "Habari! Mimi ni Clara. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Clara. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Clara. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 51,
    name: "David",
    age: 28,
    country: "Norway",
    flag: "🇳🇴",
    bio: "Anapenda adventure na maeneo ya kuvutia Tanzania.",
    style: "adventure",
    interests: ["adventure, safari, nature"],
    openings: [
      "Habari! Mimi ni David. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa David. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni David. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 52,
    name: "Charlotte",
    age: 27,
    country: "Canada",
    flag: "🇨🇦",
    bio: "Anapenda chakula na kujifunza mapishi ya Tanzania.",
    style: "food",
    interests: ["chakula, kupika, travel"],
    openings: [
      "Habari! Mimi ni Charlotte. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Charlotte. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Charlotte. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 53,
    name: "Christopher",
    age: 31,
    country: "Australia",
    flag: "🇦🇺",
    bio: "Anapenda teknolojia na mazungumzo kuhusu maisha ya kila siku.",
    style: "technology",
    interests: ["technology, kazi, lugha"],
    openings: [
      "Habari! Mimi ni Christopher. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Christopher. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Christopher. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 54,
    name: "Eva",
    age: 25,
    country: "Czech Republic",
    flag: "🇨🇿",
    bio: "Anapenda kukutana na watu na kujifunza utamaduni wa Tanzania.",
    style: "social",
    interests: ["lugha, utamaduni, marafiki"],
    openings: [
      "Habari! Mimi ni Eva. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Eva. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Eva. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 55,
    name: "Daniela",
    age: 29,
    country: "Italy",
    flag: "🇮🇹",
    bio: "Anapenda kujifunza tamaduni mbalimbali.",
    style: "culture",
    interests: ["culture, Tanzania, travel"],
    openings: [
      "Habari! Mimi ni Daniela. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Daniela. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Daniela. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 56,
    name: "Samuel",
    age: 36,
    country: "South Africa",
    flag: "🇿🇦",
    bio: "Anapenda kujifunza lugha mpya na kuzungumza na watu.",
    style: "language",
    interests: ["lugha, culture, muziki"],
    openings: [
      "Habari! Mimi ni Samuel. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Samuel. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Samuel. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 57,
    name: "Julia",
    age: 26,
    country: "Spain",
    flag: "🇪🇸",
    bio: "Anapenda kukutana na watu na kujifunza utamaduni wa Tanzania.",
    style: "social",
    interests: ["lugha, utamaduni, marafiki"],
    openings: [
      "Habari! Mimi ni Julia. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Julia. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Julia. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 58,
    name: "Andrew",
    age: 30,
    country: "United Kingdom",
    flag: "🇬🇧",
    bio: "Anapenda kuuliza na kujifunza kuhusu maisha Tanzania.",
    style: "curious",
    interests: ["Tanzania, culture, watu"],
    openings: [
      "Habari! Mimi ni Andrew. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Andrew. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Andrew. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 59,
    name: "Victoria",
    age: 33,
    country: "New Zealand",
    flag: "🇳🇿",
    bio: "Anapenda wildlife, nature na safari.",
    style: "wildlife",
    interests: ["wildlife, safari, nature"],
    openings: [
      "Habari! Mimi ni Victoria. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Victoria. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Victoria. Niambie kitu kimoja kuhusu Tanzania."
    ]
  },

  {
    id: 60,
    name: "Edward",
    age: 27,
    country: "Ireland",
    flag: "🇮🇪",
    bio: "Anajifunza Kiswahili na anapenda mazungumzo ya kawaida.",
    style: "friendly",
    interests: ["lugha, marafiki, Tanzania"],
    openings: [
      "Habari! Mimi ni Edward. Nimefurahi kupata mtu wa kuzungumza naye kwa Kiswahili. Unaendeleaje?",
      "Mambo! Naitwa Edward. Ningependa kujifunza zaidi kupitia mazungumzo yetu.",
      "Hujambo! Mimi ni Edward. Niambie kitu kimoja kuhusu Tanzania."
    ]
  }

];


/* =========================================================
   5. NORMALIZE KISWAHILI
   ========================================================= */

function cleanText(text) {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   6. KEYWORD HELPER
   ========================================================= */

function containsAny(text, words) {

  return words.some(word => text.includes(word));

}


/* =========================================================
   7. CREATE NEW CONVERSATION
   ========================================================= */

function createConversation(partner) {

  return {

    partnerId: partner.id,

    userName: null,

    location: null,

    occupation: null,

    business: null,

    hobby: null,

    music: null,

    food: null,

    lastIntent: null,

    lastQuestion: null,

    topic: "opening",

    messageCount: 0,

    usedOpening: false,

    usedReplies: [],

    partner: partner

  };

}


/* =========================================================
   8. RESET CONVERSATION
   ========================================================= */

function resetConversation(partner) {

  conversation =
    createConversation(partner);

}


/* =========================================================
   9. DETECT INTENT
   ========================================================= */

function detectIntent(rawText) {

  const text = cleanText(rawText);


  /* NAME */

  if (
    containsAny(text, [
      "naitwa",
      "jina langu",
      "jina ni",
      "mimi ni"
    ])
  ) {

    return "name";

  }


  /* GREETING */

  if (
    containsAny(text, [
      "habari",
      "hujambo",
      "mambo",
      "mambo vipi",
      "shikamoo",
      "za leo",
      "hello",
      "hi",
      "hey"
    ])
  ) {

    return "greeting";

  }


  /* HOW ARE YOU */

  if (
    containsAny(text, [
      "unaendeleaje",
      "unaendelea vipi",
      "ukoje",
      "hali yako",
      "mambo yako",
      "vipi hali"
    ])
  ) {

    return "how_are_you";

  }


  /* GOOD */

  if (
    containsAny(text, [
      "niko vizuri",
      "nipo vizuri",
      "niko poa",
      "nipo poa",
      "niko salama",
      "nipo salama",
      "uko salama",
      "salama kabisa",
      "salama",
      "poa",
      "poa sana",
      "fresh",
      "freshi",
      "mzima",
      "niko mzima",
      "sijambo",
      "sijambo kabisa",
      "mambo safi",
      "safi kabisa"
    ])
  ) {

    return "good";

  }


  /* BAD */

  if (
    containsAny(text, [
      "siko vizuri",
      "sipo vizuri",
      "sijisikii vizuri",
      "nimechoka",
      "nina huzuni",
      "sina furaha",
      "nimekasirika"
    ])
  ) {

    return "bad";

  }


  /* LOCATION */

  if (
    containsAny(text, [
      "ninaishi",
      "naishi",
      "ninatoka",
      "natokea",
      "nipo arusha",
      "nipo dar",
      "nipo mwanza",
      "nipo dodoma",
      "nipo moshi",
      "nipo zanzibar",
      "nipo tanga",
      "nipo mbeya",
      "nipo tanzania"
    ])
  ) {

    return "location";

  }


  /* WORK */

  if (
    containsAny(text, [
      "nafanya kazi",
      "nipo kazini",
      "kazi yangu",
      "nafanya",
      "nimeajiriwa",
      "mimi ni developer",
      "mimi ni programmer",
      "mimi ni mwalimu",
      "mimi ni dereva",
      "mimi ni mwanafunzi"
    ])
  ) {

    return "work";

  }


  /* BUSINESS */

  if (
    containsAny(text, [
      "biashara",
      "nina biashara",
      "nafanya biashara",
      "ninauza",
      "nauza",
      "duka langu",
      "shop yangu",
      "mfanyabiashara"
    ])
  ) {

    return "business";

  }


  /* SCHOOL */

  if (
    containsAny(text, [
      "nasoma",
      "ninasoma",
      "mwanafunzi",
      "chuo",
      "shule",
      "kozi",
      "course",
      "masomo"
    ])
  ) {

    return "school";

  }


  /* FOOD */

  if (
    containsAny(text, [
      "chakula",
      "kula",
      "ugali",
      "wali",
      "pilau",
      "nyama",
      "samaki",
      "chipsi",
      "kupika"
    ])
  ) {

    return "food";

  }


  /* MUSIC */

  if (
    containsAny(text, [
      "muziki",
      "wimbo",
      "nyimbo",
      "bongo flava",
      "msanii",
      "kuimba"
    ])
  ) {

    return "music";

  }


  /* TRAVEL */

  if (
    containsAny(text, [
      "safari",
      "kusafiri",
      "nimesafiri",
      "kutembelea",
      "nitatembelea",
      "likizo",
      "zanzibar",
      "kilimanjaro"
    ])
  ) {

    return "travel";

  }


  /* HOBBY */

  if (
    containsAny(text, [
      "hobby",
      "burudani",
      "muda wa ziada",
      "wakati wa ziada",
      "napenda kufanya",
      "hufanya nini",
      "nifanye nini"
    ])
  ) {

    return "hobby";

  }


  /* FAMILY */

  if (
    containsAny(text, [
      "familia",
      "mama",
      "baba",
      "ndugu",
      "dada",
      "kaka",
      "watoto"
    ])
  ) {

    return "family";

  }


  /* THANKS */

  if (
    containsAny(text, [
      "asante",
      "nashukuru",
      "shukrani",
      "ahsante"
    ])
  ) {

    return "thanks";

  }


  /* GOODBYE */

  if (
    containsAny(text, [
      "kwaheri",
      "tutaonana",
      "baadaye",
      "bye",
      "naondoka"
    ])
  ) {

    return "goodbye";

  }


  /* RECIPROCAL */

  if (
    containsAny(text, [
      "wewe je",
      "na wewe",
      "vipi wewe"
    ])
  ) {

    return "reciprocal";

  }


  /* YES */

  if (
    [
      "ndio",
      "ndiyo",
      "naam",
      "sawa",
      "ok",
      "okay"
    ].includes(text)
  ) {

    return "yes";

  }


  /* NO */

  if (
    [
      "hapana",
      "sio",
      "si kweli"
    ].includes(text)
  ) {

    return "no";

  }


  return "general";

}


/* =========================================================
   10. EXTRACT NAME
   ========================================================= */

function extractName(text) {

  const match = text.match(
    /(?:naitwa|jina langu ni|jina ni|mimi ni)\s+([a-zA-ZÀ-ÿ]+)/
  );


  if (!match) {

    return null;

  }


  return (
    match[1].charAt(0).toUpperCase() +
    match[1].slice(1)
  );

}


/* =========================================================
   11. EXTRACT LOCATION
   ========================================================= */

function extractLocation(text) {

  const match = text.match(
    /(?:ninaishi|naishi|ninatoka|natokea)\s+(.+)/i
  );


  if (match) {

    return match[1].trim();

  }


  const cities = [
    "arusha",
    "dar es salaam",
    "dar",
    "mwanza",
    "dodoma",
    "moshi",
    "zanzibar",
    "tanga",
    "mbeya",
    "morogoro",
    "tabora",
    "ir inga"
  ];


  for (const city of cities) {

    if (
      cleanText(text).includes(city)
    ) {

      return city
        .replace(/\b\w/g, c => c.toUpperCase());

    }

  }


  return null;

}


/* =========================================================
   12. REMEMBER INFORMATION
   ========================================================= */

function rememberInformation(text, intent) {

  const name =
    extractName(text);


  if (
    name &&
    (
      conversation.lastQuestion === "name" ||
      intent === "name"
    )
  ) {

    conversation.userName =
      name;

  }


  const location =
    extractLocation(text);


  if (location) {

    conversation.location =
      location;

  }


  if (intent === "work") {

    conversation.occupation =
      text;

  }


  if (intent === "business") {

    conversation.business =
      text;

  }


  if (intent === "food") {

    conversation.food =
      text;

  }


  if (intent === "music") {

    conversation.music =
      text;

  }


  if (intent === "hobby") {

    conversation.hobby =
      text;

  }

}


/* =========================================================
   13. SHORT NAME RESPONSE
   ========================================================= */

function isPossibleNameAnswer(text) {

  const clean =
    cleanText(text);


  if (
    clean.split(" ").length === 1 &&
    /^[a-zA-ZÀ-ÿ]+$/.test(text.trim())
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   14. CONTEXT RESPONSE ENGINE
   ========================================================= */

function generateReply(rawText) {

  const text =
    cleanText(rawText);


  let intent =
    detectIntent(rawText);


  /* -----------------------------------------
     NAME CONTEXT
     ----------------------------------------- */

  if (
    conversation.lastQuestion === "name" &&
    (
      intent === "general" ||
      isPossibleNameAnswer(rawText)
    )
  ) {

    const possibleName =
      extractName(rawText);


    if (possibleName) {

      conversation.userName =
        possibleName;

    }
    else if (
      isPossibleNameAnswer(rawText)
    ) {

      conversation.userName =
        rawText.trim()
          .charAt(0)
          .toUpperCase() +
        rawText.trim().slice(1);

    }


    conversation.lastQuestion =
      "location";


    conversation.topic =
      "getting_to_know";


    return choose([
      `Nafurahi kukufahamu${conversation.userName ? " " + conversation.userName : ""}  Unaishi wapi?`,
      `Nice kukufahamu${conversation.userName ? " " + conversation.userName : ""}  Unatokea mji gani?`,
      `Nimefurahi kukufahamu  Wewe unaishi sehemu gani?`
    ]);

  }


  /* -----------------------------------------
     LOCATION CONTEXT
     ----------------------------------------- */

  if (
    conversation.lastQuestion === "location" &&
    intent === "general"
  ) {

    const location =
      extractLocation(rawText);


    if (location) {

      conversation.location =
        location;

      intent =
        "location";

    }

  }


  /* -----------------------------------------
     GOOD MOOD
     ----------------------------------------- */

  if (intent === "good") {

    conversation.lastQuestion =
      "day";


    return choose([
      "Nimefurahi kusikia hivyo  Leo siku yako imekuwaje?",
      "Vizuri sana!  Umefanya nini leo?",
      "Safi kabisa  Leo umejishughulisha na nini?",
      "Nimefurahi uko salama. Leo mambo yako yameendaje?"
    ]);

  }


  /* -----------------------------------------
     GREETING
     ----------------------------------------- */

  if (intent === "greeting") {

    conversation.lastQuestion =
      "how_are_you";


    return choose([
      "Salama kabisa  Na wewe unaendeleaje?",
      "Poa kabisa!  Wewe ukoje?",
      "Niko vizuri, asante  Na upande wako ukoje?",
      "Nipo salama kabisa. Wewe unaendeleaje leo?"
    ]);

  }


  /* -----------------------------------------
     HOW ARE YOU
     ----------------------------------------- */

  if (intent === "how_are_you") {

    conversation.lastQuestion =
      "how_are_you";


    return choose([
      "Niko salama kabisa  Na wewe je?",
      "Mimi niko vizuri sana, asante. Wewe unaendeleaje?",
      "Niko poa kabisa  Leo nimefurahi kupata nafasi ya kuongea nawe."
    ]);

  }


  /* -----------------------------------------
     NAME
     ----------------------------------------- */

  if (intent === "name") {

    const name =
      extractName(rawText);


    if (name) {

      conversation.userName =
        name;

    }


    conversation.lastQuestion =
      "location";


    return choose([
      `Nafurahi kukufahamu${name ? " " + name : ""}  Unaishi wapi?`,
      `Nice kukufahamu${name ? " " + name : ""}! Unaishi mji gani?`,
      `Nimefurahi kukufahamu  Unatokea wapi?`
    ]);

  }


  /* -----------------------------------------
     LOCATION
     ----------------------------------------- */

  if (intent === "location") {

    const location =
      extractLocation(rawText);


    if (location) {

      conversation.location =
        location;

    }


    conversation.lastQuestion =
      "work";


    return choose([
      `Oooh, ${conversation.location || "huko"}  Unaifanya kazi gani?`,
      `Aah, nimekupata. ${conversation.location || "Huko"} kunaonekana pazuri. Unafanya kazi au unasoma?`,
      `Nice!  Wewe ni mtu wa kazi gani au unasoma?`
    ]);

  }


  /* -----------------------------------------
     WORK
     ----------------------------------------- */

  if (intent === "work") {

    conversation.occupation =
      rawText;


    conversation.lastQuestion =
      "work_followup";


    return choose([
      "Aah, hiyo ni interesting  Umeanza kufanya kazi hiyo muda gani?",
      "Vizuri sana! Unaifurahia kazi yako?",
      "Nice  Ni kitu gani unapenda zaidi kwenye kazi yako?",
      "Hiyo ni kazi nzuri. Kawaida siku yako ya kazi huwa inakuwaje?"
    ]);

  }


  /* -----------------------------------------
     BUSINESS
     ----------------------------------------- */

  if (intent === "business") {

    conversation.business =
      rawText;


    conversation.lastQuestion =
      "business_followup";


    return choose([
      "Oooh, una biashara  Unauza bidhaa au huduma gani?",
      "Hiyo ni nzuri sana. Uliianza biashara yako lini?",
      "Nice!  Biashara yako iko online au una duka?",
      "Hongera  Unafanya biashara hiyo mwenyewe au una watu wanaokusaidia?"
    ]);

  }


  /* -----------------------------------------
     SCHOOL
     ----------------------------------------- */

  if (intent === "school") {

    conversation.lastQuestion =
      "school_followup";


    return choose([
      "Vizuri  Unasoma kozi gani?",
      "Aah, mwanafunzi. Unafurahia masomo yako?",
      "Nice! Unasoma mwaka wa ngapi?",
      "Ni somo gani unalolipenda zaidi?"
    ]);

  }


  /* -----------------------------------------
     FOOD
     ----------------------------------------- */

  if (intent === "food") {

    conversation.food =
      rawText;


    conversation.lastQuestion =
      "food_followup";


    return choose([
      "Mmmh  Chakula ni topic nzuri! Wewe unapenda kula nini zaidi?",
      "Nice! Unapendelea chakula cha nyumbani au kula hotelini?",
      "Mimi ningependa kujua  Ni chakula gani huwezi kukataa?",
      "Kama ungechagua chakula kimoja leo, ungechagua nini?"
    ]);

  }


  /* -----------------------------------------
     MUSIC
     ----------------------------------------- */

  if (intent === "music") {

    conversation.music =
      rawText;


    conversation.lastQuestion =
      "music_followup";


    return choose([
      "Oh nice! 🎵 Unapenda msanii gani zaidi?",
      "Muziki ni topic nzuri  Unapenda Bongo Flava au aina nyingine?",
      "Nice 🎵 Kuna wimbo unaousikiliza sana siku hizi?",
      "Unapenda kusikiliza muziki ukiwa unafanya nini?"
    ]);

  }


  /* -----------------------------------------
     TRAVEL
     ----------------------------------------- */

  if (intent === "travel") {

    conversation.topic =
      "travel";


    conversation.lastQuestion =
      "travel_followup";


    return choose([
      "Safari ni nzuri sana  Ni sehemu gani ungependa kutembelea zaidi?",
      "Nice! Umewahi kutembelea sehemu gani iliyokuvutia sana?",
      "Kama ungepewa nafasi ya kusafiri leo, ungeenda wapi?",
      "Unapenda zaidi safari za mjini au sehemu za asili?"
    ]);

  }


  /* -----------------------------------------
     HOBBY
     ----------------------------------------- */

  if (intent === "hobby") {

    conversation.hobby =
      rawText;


    conversation.lastQuestion =
      "hobby_followup";


    return choose([
      "Nice  Ukiwa free unapenda kufanya nini zaidi?",
      "Hiyo ni nzuri. Burudani yako kubwa ni ipi?",
      "Unapenda michezo, muziki au kitu kingine?",
      "Ni kitu gani huwa kinakufurahisha ukiwa na muda wa ziada?"
    ]);

  }


  /* -----------------------------------------
     FAMILY
     ----------------------------------------- */

  if (intent === "family") {

    conversation.topic =
      "family";


    conversation.lastQuestion =
      "family_followup";


    return choose([
      "Familia ni muhimu sana  Una ndugu wengi?",
      "Aah, nimekupata. Unaishi na familia yako?",
      "Nice  Familia yako inaishi karibu nawe?",
      "Unaishi na familia au unaishi peke yako?"
    ]);

  }


  /* -----------------------------------------
     THANKS
     ----------------------------------------- */

  if (intent === "thanks") {

    return choose([
      "Karibu sana 😊 Nimefurahia mazungumzo yetu.",
      "Usijali kabisa!  Nami nafurahia kuongea nawe.",
      "Karibu  Ni vizuri kuzungumza pamoja."
    ]);

  }


  /* -----------------------------------------
     GOODBYE
     ----------------------------------------- */

  if (intent === "goodbye") {

    conversation.lastQuestion =
      null;


    return choose([
      "Sawa  Tutaongea tena baadaye.",
      "Kwaheri kwa sasa! Nimefurahia kuzungumza nawe.",
      "Sawa rafiki yangu  Tutaonana tena."
    ]);

  }


  /* -----------------------------------------
     RECIPROCAL
     ----------------------------------------- */

  if (intent === "reciprocal") {

    return choose([
      "Mimi niko salama kabisa  Nimefurahia kuongea nawe.",
      "Mimi niko vizuri  Asante kwa kuuliza.",
      "Niko poa kabisa. Leo nimefurahi kupata mazungumzo mazuri."
    ]);

  }


  /* -----------------------------------------
     YES
     ----------------------------------------- */

  if (intent === "yes") {

    return choose([
      "Vizuri  Endelea kuniambia zaidi.",
      "Sawa kabisa  Nimekupata.",
      "Nice! Hebu tuendelee na hilo."
    ]);

  }


  /* -----------------------------------------
     NO
     ----------------------------------------- */

  if (intent === "no") {

    return choose([
      "Sawa  Hakuna shida. Tuongee kuhusu jambo lingine.",
      "Nimeelewa. Hebu tubadilishe topic kidogo ",
      "Sawa kabisa. Kuna jambo lingine ungependa tuzungumzia?"
    ]);

  }


  /* -----------------------------------------
     GENERAL - CONTEXT BASED
     ----------------------------------------- */

  if (
    conversation.lastQuestion === "day"
  ) {

    conversation.lastQuestion =
      "activity";


    return choose([
      "Nice  Umefanya nini leo?",
      "Siku nzuri basi. Umejishughulisha na nini?",
      "Vizuri sana. Leo umekuwa busy na nini?"
    ]);

  }


  if (
    conversation.lastQuestion === "work_followup"
  ) {

    conversation.lastQuestion =
      "hobby";


    return choose([
      "Nimekupata  Ukiwa umeondoka kazini unapenda kufanya nini?",
      "Nice. Na ukiwa free baada ya kazi huwa unapenda kufanya nini?",
      "Kazi ni sehemu moja ya maisha  Vipi kuhusu burudani yako?"
    ]);

  }


  if (
    conversation.lastQuestion === "business_followup"
  ) {

    conversation.lastQuestion =
      "business_next";


    return choose([
      "Hiyo ni nzuri  Wateja wako wengi wanapatikana wapi?",
      "Interesting! Unafurahia zaidi kuuza online au ana kwa ana?",
      "Biashara hiyo inaonekana interesting. Changamoto kubwa unayokutana nayo ni ipi?"
    ]);

  }


  if (
    conversation.lastQuestion === "school_followup"
  ) {

    return choose([
      "Nice  Ungependa kufanya kazi gani baada ya kumaliza?",
      "Vizuri sana. Unapenda zaidi theory au practical?",
      "Masomo ni muhimu  Una mpango gani baada ya kumaliza?"
    ]);

  }


  if (
    conversation.lastQuestion === "food_followup"
  ) {

    return choose([
      "Mmmh  Hicho kinaonekana kitamu. Unapenda kupika pia?",
      "Nice! Unakula zaidi nyumbani au hotelini?",
      "Sasa nimepata picha ya chakula unachopenda "
    ]);

  }


  if (
    conversation.lastQuestion === "music_followup"
  ) {

    return choose([
      "Nice 🎵 Unasikiliza muziki mara nyingi?",
      "Huyo ni msanii mzuri. Kuna wimbo wake unaoupenda zaidi?",
      "Muziki una nafasi kubwa kwenye maisha yako au ni burudani tu?"
    ]);

  }


  if (
    conversation.lastQuestion === "travel_followup"
  ) {

    return choose([
      "Hiyo sehemu lazima iwe nzuri  Ungependa kwenda na nani?",
      "Nice! Ukienda huko ungependa kufanya nini kwanza?",
      "Safari nzuri huwa inaacha kumbukumbu. Umeshawahi kuwa na safari ya kukumbuka?"
    ]);

  }


  if (
    conversation.lastQuestion === "hobby_followup"
  ) {

    return choose([
      "Nice  Umeanza hobby hiyo lini?",
      "Hiyo ni nzuri. Unafanya mara nyingi?",
      "Interesting  Kuna hobby nyingine ungependa kujifunza?"
    ]);

  }


  if (
    conversation.lastQuestion === "family_followup"
  ) {

    return choose([
      "Familia kubwa huwa na stories nyingi  Wewe unaishi karibu nao?",
      "Nice  Huwa mnatumia muda pamoja mara nyingi?",
      "Familia ni muhimu. Ni kitu gani unapenda zaidi kuhusu familia yako?"
    ]);

  }


  /* -----------------------------------------
     PERSONALITY BASED GENERAL REPLIES
     ----------------------------------------- */

  const personalityReplies = {

    music: [
      "Interesting  Mimi napenda sana kusikia watu wanavyopenda muziki. Wewe unasikiliza nini siku hizi?",
      "Hiyo ni topic nzuri 🎵 Hebu niambie zaidi."
    ],

    travel: [
      "Interesting  Mimi napenda sana kusikia kuhusu sehemu ambazo watu wamewahi kutembelea. Wewe unapenda safari?",
      "Hilo linanivutia 😄 Ni sehemu gani ungependa kutembelea?"
    ],

    business: [
      "Aah, nimekupata  Biashara ni topic interesting. Uliianzaje?",
      "Nice!  Inaonekana una uzoefu kwenye hilo. Unalifurahia?"
    ],

    technology: [
      "Oh, technology! 💻 Hilo linanivutia. Unafanya nini zaidi kwenye technology?",
      "Nice  Wewe unapenda technology kwa sababu gani?"
    ],

    food: [
      "Mmmh 😄 Sasa tumeingia kwenye topic nzuri. Wewe unapenda chakula gani?",
      "Chakula ni topic yangu nzuri pia  Unapenda kupika?"
    ],

    culture: [
      "Hilo ni jambo zuri  Ningependa kujua zaidi kuhusu mtazamo wako.",
      "Interesting sana. Wewe unaipenda zaidi sehemu gani ya utamaduni?"
    ],

    academic: [
      "Interesting  Napenda sana mazungumzo ya kujifunza. Wewe unapenda kujifunza kuhusu nini?",
      "Hilo ni jambo zuri. Ungependa kujifunza kitu gani kipya?"
    ],

    wildlife: [
      "Wow  Mimi pia ningependa kujua zaidi kuhusu safari za wildlife. Umewahi kwenda safari?",
      "Nature ni nzuri sana 😊 Unapenda wanyama gani?"
    ]

  };


  const style =
    conversation.partner.style;


  if (
    personalityReplies[style]
  ) {

    return choose(
      personalityReplies[style]
    );

  }


  /* -----------------------------------------
     SMART FALLBACK
     ----------------------------------------- */

  const fallbackReplies = [

    "Aah, nimekupata  Hebu niambie zaidi kuhusu hilo.",
    "Interesting!  Hilo limefanya nitake kujua zaidi.",
    "Nimekusikia  Unaweza kunieleza zaidi?",
    "Sawa, nimeelewa. Na wewe unaonaje kuhusu hilo?",
    "Aah okay 😊 Endelea, nakusikiliza.",
    "Hilo ni interesting. Ni muda gani umehusika na hilo?",
    "Nimekupata  Na kwa upande wako, unalipendeaje?"
  ];


  return choose(
    fallbackReplies
  );

}


/* =========================================================
   15. CHOOSE WITHOUT IMMEDIATE REPETITION
   ========================================================= */

function choose(options) {

  if (
    !Array.isArray(options) ||
    options.length === 0
  ) {

    return "";

  }


  const available =
    options.filter(
      item =>
        !conversation.usedReplies.includes(item)
    );


  let selected;


  if (
    available.length === 0
  ) {

    conversation.usedReplies =
      [];

    selected =
      options[
        Math.floor(
          Math.random() * options.length
        )
      ];

  }
  else {

    selected =
      available[
        Math.floor(
          Math.random() * available.length
        )
      ];

  }


  conversation.usedReplies.push(
    selected
  );


  /* Keep memory from becoming huge */

  if (
    conversation.usedReplies.length > 20
  ) {

    conversation.usedReplies.shift();

  }


  return selected;

}


/* =========================================================
   16. UPDATE BALANCE
   ========================================================= */

function updateSalioUI() {

  const salioDisplay =
    document.getElementById(
      "salioDisplay"
    );

  const withdrawnDisplay =
    document.getElementById(
      "totalWithdrawnDisplay"
    );

  const modalBalance =
    document.getElementById(
      "modalSalioText"
    );


  const netProfitDisplay = document.getElementById("netProfitDisplay");

  if (salioDisplay) {
    salioDisplay.innerText = `TZS ${salio.toLocaleString()}`;
  }

  if (netProfitDisplay) {
    netProfitDisplay.innerText = `TZS ${(salio + totalWithdrawn).toLocaleString()}`;
  }


  if (withdrawnDisplay) {

    withdrawnDisplay.innerText =
      `TZS ${totalWithdrawn.toLocaleString()}`;

  }


  if (modalBalance) {

    modalBalance.innerText =
      `Salio: TZS ${salio.toLocaleString()}`;

  }


  localStorage.setItem(
    "user_salio",
    salio
  );


  localStorage.setItem(
    "user_withdrawn",
    totalWithdrawn
  );

}


/* =========================================================
   17. RENDER WAZUNGU
   ========================================================= */

const partnerPresence = new Map();

// 60 total profiles exist; only 30 are shown at once. Every 3 notifications,
// the visible roster switches to a different batch.
const PARTNERS_PER_ROSTER = 30;
let activePartnerRoster = [];
let partnerRosterCycle = 0;
let notificationCountSinceRosterChange = 0;

function seededRosterShuffle(list, seed) {
  const items = [...list];
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const random = () => {
    hash += 0x6D2B79F5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildPartnerRoster(cycle = 0) {
  const shuffled = seededRosterShuffle(wazunguData, `blogchat-roster-${cycle}`);
  const start = (cycle * PARTNERS_PER_ROSTER) % shuffled.length;
  return shuffled.slice(start, start + PARTNERS_PER_ROSTER).concat(
    shuffled.slice(0, Math.max(0, PARTNERS_PER_ROSTER - Math.max(0, shuffled.length - start)))
  );
}

function seedPartnerPresence(force = false) {
  if (partnerPresence.size && !force) return;
  partnerPresence.clear();
  const roster = activePartnerRoster.length ? activePartnerRoster : wazunguData;
  const shuffled = [...roster].sort(() => Math.random() - 0.5);
  const onlineCount = Math.max(22, Math.min(25, 22 + Math.floor(Math.random() * 4)));
  roster.forEach(partner => partnerPresence.set(partner.id, "offline"));
  shuffled.slice(0, onlineCount).forEach(partner => partnerPresence.set(partner.id, "online"));
}

function getPartnerPresence(id) {
  seedPartnerPresence();
  return partnerPresence.get(id) || "offline";
}

function rotatePartnerPresence() {
  seedPartnerPresence(true);
  renderWazungu();
}

function rotatePartnerRoster() {
  partnerRosterCycle += 1;
  activePartnerRoster = buildPartnerRoster(partnerRosterCycle);
  seedPartnerPresence(true);

  const container = document.getElementById("wazunguListContainer");
  if (!container) {
    renderWazungu();
    return;
  }

  container.classList.add("roster-changing");
  window.setTimeout(() => {
    renderWazungu();
    window.requestAnimationFrame(() => container.classList.remove("roster-changing"));
  }, 260);
}

function togglePartnerBlock(id) {
  const key = `blocked_partner_${id}`;
  if (localStorage.getItem(key)) localStorage.removeItem(key);
  else localStorage.setItem(key, "1");
  renderWazungu();
}

function updateLiveDateTime() {
  const el = document.getElementById("liveDateTime");
  if (!el) return;
  const now = new Date();
  const days = ["Jumapili","Jumatatu","Jumanne","Jumatano","Alhamisi","Ijumaa","Jumamosi"];
  const months = ["Januari","Februari","Machi","Aprili","Mei","Juni","Julai","Agosti","Septemba","Oktoba","Novemba","Desemba"];
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} • ${h}:${m}`;
}

function renderWazungu() {

  const container = document.getElementById("wazunguListContainer");
  if (!container) return;

  container.innerHTML = "";

  const roster = activePartnerRoster.length ? activePartnerRoster : wazunguData;

  roster.forEach(partner => {
    const state = getPartnerPresence(partner.id);
    const blocked = !!localStorage.getItem(`blocked_partner_${partner.id}`);
    const canChat = state === "online" && !blocked;

    const card = document.createElement("article");
    card.className = `mzungu-card ${state === "offline" ? "is-offline" : "is-online"} ${blocked ? "is-blocked" : ""}`;

    card.innerHTML = `
      <div class="mzungu-header">
        <div class="avatar-wrap">
          <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" class="avatar sprite-avatar" style="background-position: ${((partner.id - 1) % 10) * 100 / 9}% ${Math.floor((partner.id - 1) / 10) * 20}%;" alt="${partner.name}">
          <span class="presence-dot ${state}" aria-label="${state}"></span>
        </div>
        <div class="mzungu-info">
          <h4>${partner.name}, ${partner.age}</h4>
          <div class="meta">${partner.flag} ${partner.country}</div>
          <div class="status-line ${state}"><span class="status-dot"></span>${blocked ? "Blocked" : state === "online" ? "Online sasa" : "Offline"}</div>
        </div>
        <div class="partner-rate" title="Kiwango cha malipo: TZS 8,500 hadi TZS 180,000">TZS 8,500 – 180,000</div>
      </div>

      <div class="mzungu-bio">${partner.bio}</div>

      <div class="partner-actions">
        <button class="btn-chat ${!canChat ? "disabled-action" : ""}" onclick="openTimeSelectModal(${partner.id})" ${!canChat ? "disabled" : ""}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.1-.9L3 20l1.2-4.3A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg> Chat
        </button>
        <button class="btn-voice" type="button" disabled aria-disabled="true" title="Voice call">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.9.7 2.9.8A2 2 0 0 1 22 16.9Z"/></svg> Voice
        </button>
        <button class="btn-video" type="button" disabled aria-disabled="true" title="Video call">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3Z"/></svg> Video
        </button>
      </div>

      <button class="block-partner-btn ${blocked ? "blocked" : ""}" type="button" onclick="togglePartnerBlock(${partner.id})">${blocked ? "Unblock" : "Block"}</button>
    `;

    container.appendChild(card);
  });
}


/* =========================================================
   18. OPEN TIME MODAL
   ========================================================= */

function openTimeSelectModal(id) {

  currentSelectedMzungu =
    wazunguData.find(
      person =>
        person.id === id
    );


  if (!currentSelectedMzungu || getPartnerPresence(id) !== "online" || localStorage.getItem(`blocked_partner_${id}`)) {
    return;
  }


  const name =
    document.getElementById(
      "modalProfileName"
    );


  const country =
    document.getElementById(
      "modalProfileCountry"
    );


  const avatar =
    document.getElementById(
      "modalAvatar"
    );


  if (name) {

    name.innerText =
      `${currentSelectedMzungu.name}, ${currentSelectedMzungu.age}`;

  }


  if (country) {

    country.innerText =
      `${currentSelectedMzungu.flag} ${currentSelectedMzungu.country}`;

  }


  if (avatar) {

    avatar.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    setSpriteAvatar(avatar, currentSelectedMzungu.id);

  }


  const modal =
    document.getElementById(
      "timeSelectModal"
    );


  if (modal) {

    modal.style.display =
      "flex";

  }

}


/* =========================================================
   19. START CHAT
   ========================================================= */

function confirmStartChat(
  minutes,
  rewardAmount,
  labelText
) {

  if (
    !currentSelectedMzungu
  ) {

    return;

  }


  currentDurationMinutes =
    minutes;


  currentRewardAmount =
    rewardAmount;


  resetConversation(
    currentSelectedMzungu
  );


  closeModal(
    "timeSelectModal"
  );


  /* Chat header */

  const chatName =
    document.getElementById(
      "chatName"
    );


  const chatAvatar =
    document.getElementById(
      "chatAvatar"
    );


  if (chatName) {

    chatName.innerText =
      `${currentSelectedMzungu.flag} ${currentSelectedMzungu.name}`;

  }


  if (chatAvatar) {

    chatAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    setSpriteAvatar(chatAvatar, currentSelectedMzungu.id);

  }


  /* Messages */

  const messagesBox =
    document.getElementById(
      "chatMessages"
    );


  if (messagesBox) {

    messagesBox.innerHTML = "";

  }


  /* Open chat */

  const chatModal =
    document.getElementById(
      "chatRoomModal"
    );


  if (chatModal) {

    chatModal.style.display =
      "flex";

    document.body.classList.add("chat-active");

  }

  /* Timer inaendana na muda na malipo ambayo mtumiaji amechagua. */
  startChatTimer(currentDurationMinutes, currentRewardAmount);


  /* Opening */

  const openingList =
    currentSelectedMzungu.openings;


  const opening =
    openingList[
      Math.floor(
        Math.random() *
        openingList.length
      )
    ];


  conversation.lastQuestion =
    guessQuestionFromOpening(
      opening
    );


  // On opening, show a real WhatsApp/Instagram-style typing state first.
  // Keep it visible for at least 2 seconds so the user can actually see it.
  setChatTyping(true);
  setTimeout(() => {
    if (!currentSelectedMzungu) return;
    addBotMessage(opening);
    setChatTyping(false);
  }, 2200);

}


/* =========================================================
   20. CHAT SESSION TIMER + LIVE EARNINGS
   ========================================================= */
function startChatTimer(durationMinutes, rewardAmount) {
  if (chatTimerInterval) clearInterval(chatTimerInterval);

  chatTotalSeconds = Math.max(1, Number(durationMinutes || 1) * 60);
  chatTimerSeconds = chatTotalSeconds;
  updateChatTimerUI();

  const input = document.getElementById("chatInput");
  if (input) {
    input.disabled = false;
    input.placeholder = "Andika ujumbe wako hapa...";
  }

  chatTimerInterval = setInterval(() => {
    chatTimerSeconds -= 1;
    updateChatTimerUI();

    if (chatTimerSeconds <= 0) {
      clearInterval(chatTimerInterval);
      chatTimerInterval = null;
      finishChatSession(rewardAmount);
    }
  }, 1000);
}

function updateChatTimerUI() {
  const countdown = document.getElementById("chatCountdown");
  const bar = document.getElementById("chatProgressBar");
  const earned = document.getElementById("chatEarnedAmount");

  const remaining = Math.max(0, chatTimerSeconds);
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");

  if (countdown) countdown.textContent = `${m}:${s}`;

  const elapsed = Math.max(0, chatTotalSeconds - remaining);
  const percentage = chatTotalSeconds > 0 ? (elapsed / chatTotalSeconds) * 100 : 0;
  if (bar) {
    bar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    bar.parentElement?.setAttribute("aria-valuenow", String(Math.round(percentage)));
  }

  const earnedAmount = Math.min(
    Number(currentRewardAmount || 0),
    Math.floor((elapsed / Math.max(1, chatTotalSeconds)) * Number(currentRewardAmount || 0))
  );
  if (earned) earned.textContent = `TZS ${earnedAmount.toLocaleString("en-US")}`;
}

function finishChatSession(rewardAmount) {
  const input = document.getElementById("chatInput");
  if (input) { input.disabled = true; input.placeholder = "Muda wa chat umeisha"; }
  if (chatTimerInterval) { clearInterval(chatTimerInterval); chatTimerInterval = null; }

  chatTimerSeconds = 0;
  updateChatTimerUI();
  closeModal("chatRoomModal");

  const rewardText = document.getElementById("rewardSubTitle");
  if (rewardText) rewardText.textContent = `Hongera! Umepokea malipo ya TZS ${Number(rewardAmount || 0).toLocaleString("en-US")}.`;
  const rewardModal = document.getElementById("rewardModal");
  if (rewardModal) rewardModal.style.display = "flex";
}

/* =========================================================
   20. GUESS OPENING QUESTION
   ========================================================= */

function guessQuestionFromOpening(text) {

  const clean =
    cleanText(text);


  if (
    clean.includes("unaitwa nani")
  ) {

    return "name";

  }


  if (
    clean.includes("unaishi")
  ) {

    return "location";

  }


  if (
    clean.includes("unatokea")
  ) {

    return "location";

  }


  if (
    clean.includes("unaendeleaje")
  ) {

    return "how_are_you";

  }


  if (
    clean.includes("ukoje")
  ) {

    return "how_are_you";

  }


  if (
    clean.includes("unafanya kazi")
  ) {

    return "work";

  }


  if (
    clean.includes("unapenda muziki")
  ) {

    return "music";

  }


  if (
    clean.includes("unapenda chakula")
  ) {

    return "food";

  }


  if (
    clean.includes("unapenda kusafiri")
  ) {

    return "travel";

  }


  if (
    clean.includes("unasoma")
  ) {

    return "school";

  }


  if (
    clean.includes("unafanya nini")
  ) {

    return "hobby";

  }


  return null;

}


/* =========================================================
   21. ADD USER MESSAGE
   ========================================================= */

function addUserMessage(text) {

  const box =
    document.getElementById(
      "chatMessages"
    );


  if (!box) return;


  const message =
    document.createElement(
      "div"
    );


  message.className =
    "msg sent";


  message.innerText =
    text;


  box.appendChild(
    message
  );


  box.scrollTop =
    box.scrollHeight;

}


/* =========================================================
   22. ADD BOT MESSAGE
   ========================================================= */

function addBotMessage(text) {

  const box =
    document.getElementById(
      "chatMessages"
    );


  if (!box) return;


  const message =
    document.createElement(
      "div"
    );


  message.className =
    "msg received";


  message.innerText =
    text;


  box.appendChild(
    message
  );


  box.scrollTop =
    box.scrollHeight;

}


/* =========================================================
   22B. WHATSAPP-STYLE TYPING INDICATOR
   ========================================================= */

function setChatTyping(isTyping) {

  const status = document.getElementById("chatStatus");
  if (!status) return;

  if (isTyping) {
    status.classList.add("is-typing");
    status.innerHTML = `
      <span class="typing-label">typing</span>
      <span class="typing-dots" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>
    `;
  } else {
    status.classList.remove("is-typing");
    const online = currentSelectedMzungu && getPartnerPresence(currentSelectedMzungu.id) === "online";
    status.textContent = online ? "● Online" : "● Offline";
    status.classList.toggle("offline-status", !online);
  }
}


/* =========================================================
   23. SEND MESSAGE
   ========================================================= */

function sendMessage() {

  const input = document.getElementById("chatInput");

  if (!input || !conversation) return;

  const text = input.value.trim();

  if (!text) return;

  // The visitor gets two free messages. On the next attempt,
  // show the registration popup instead of sending the message.
  if (conversation.messageCount >= MAX_FREE_CHAT_MESSAGES) {
    showChatRegisterWall();
    return;
  }

  /* Show user message */
  addUserMessage(text);

  /* Clear input */
  input.value = "";

  /* Count */
  conversation.messageCount++;

  /* Understand */
  const intent = detectIntent(text);

  /* Remember */
  rememberInformation(text, intent);

  conversation.lastIntent = intent;

  /* Generate intelligent reply */
  const reply = generateReply(text);

  /* WhatsApp-style typing indicator */
  setChatTyping(true);

  /* Human-like delay */
  const delay = 2000 + Math.floor(Math.random() * 900);

  setTimeout(() => {
    addBotMessage(reply);
    setChatTyping(false);

    /*
       Visitor anaruhusiwa ujumbe mmoja tu wa kuanzia.
       Mara tu mgeni akishapata reply ya kwanza, registration wall
       inaonekana na kuzuia ujumbe unaofuata.
    */
    if (conversation.messageCount >= MAX_FREE_CHAT_MESSAGES) {
      showChatRegisterWall();
    }
  }, delay);
}


/* =========================================================
   23B. REGISTRATION WALL
   ========================================================= */

function showChatRegisterWall() {
  const wall = document.getElementById("chatRegisterWall");
  if (!wall) return;

  wall.hidden = false;
  wall.setAttribute("aria-hidden", "false");

  // Keep the chat input completely normal behind the popup.
  // The popup overlay is what prevents another message from being sent.
  const closeButton = wall.querySelector(".chat-register-close");
  if (closeButton) closeButton.focus();
}

function closeChatRegisterWall() {
  const wall = document.getElementById("chatRegisterWall");
  if (!wall) return;

  wall.hidden = true;
  wall.setAttribute("aria-hidden", "true");
}


/* =========================================================
   24. ENTER KEY
   ========================================================= */

function handleKeyPress(e) {

  if (
    e.key === "Enter"
  ) {

    e.preventDefault();

    sendMessage();

  }

}


/* =========================================================
   26. CHAT SESSION
   =========================================================
   Chat sessions no longer expire automatically.
   The only visitor restriction is the registration wall after
   the configured number of free messages.
   ========================================================= */

/* =========================================================
   27. MODALS
   ========================================================= */

function closeModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (modal) {

    modal.style.display =
      "none";

  }

  if (id === "chatRoomModal") {
    document.body.classList.remove("chat-active");
  }

  if (id === "chatRoomModal" && chatTimerInterval) {
    clearInterval(chatTimerInterval);
    chatTimerInterval = null;
  }

}


/* =========================================================
   28. WITHDRAW
   ========================================================= */

function openWithdrawModal() {

  const modal =
    document.getElementById(
      "withdrawModal"
    );


  if (modal) {

    modal.style.display =
      "flex";

  }

}


function handleWithdrawSubmit(e) {

  e.preventDefault();


  const amountInput =
    document.getElementById(
      "withdrawAmount"
    );


  if (!amountInput) {

    return;

  }


  const amount =
    parseInt(
      amountInput.value
    );


  if (
    isNaN(amount) ||
    amount <= 0
  ) {

    alert(
      "Tafadhali weka kiasi sahihi."
    );

    return;

  }


  if (
    amount > salio
  ) {

    alert(
      "Kiasi hiki kinazidi salio lako la sasa."
    );

    return;

  }


  closeModal(
    "withdrawModal"
  );


  const errorModal =
    document.getElementById(
      "errorModal"
    );


  if (errorModal) {

    errorModal.style.display =
      "flex";

  }

}


/* =========================================================
   29. WHATSAPP
   ========================================================= */

function openWhatsAppSupport() {

  window.open(
    "https://wa.me/255725310967",
    "_blank"
  );

}


/*
   HTML yako inatumia openWhatsAppDirect()
   kwenye Customer Care button.
*/

function openWhatsAppDirect() {
  window.open(
    "https://wa.me/255725310967",
    "_blank"
  );
}


/* =========================================================
   30. PAYMENT NOTIFICATIONS
   ========================================================= */

const notificationsData = [

  {
    name: "Salma A. — Zanzibar",
    amount: "TZS 185,000",
    network: "HaloPesa"
  },

  {
    name: "Juma K. — Dar es Salaam",
    amount: "TZS 50,000",
    network: "M-Pesa"
  },

  {
    name: "Aisha M. — Arusha",
    amount: "TZS 300,000",
    network: "Tigo Pesa"
  },

  {
    name: "Baraka J. — Mwanza",
    amount: "TZS 120,000",
    network: "Airtel Money"
  },

  {
    name: "Zuhura H. — Tanga",
    amount: "TZS 75,000",
    network: "HaloPesa"
  },

  {
    name: "Kelvin P. — Mbeya",
    amount: "TZS 250,000",
    network: "M-Pesa"
  },

  {
    name: "Neema S. — Dodoma",
    amount: "TZS 95,000",
    network: "Tigo Pesa"
  }

];


let currentNotificationIndex =
  0;


/* =========================================================
   31. NOTIFICATION SOUND
   ========================================================= */

/* =========================================================
   31. LUGHAPAY NOTIFICATION SOUND
   ========================================================= */

function playNotificationSound() {

  if (localStorage.getItem("blogchat_notification_sound") === "off") return;

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audio = new AudioContext();

    /*
       Kama browser imezuia audio mpaka user interaction,
       jaribu kuendelea baada ya interaction.
    */
    if (audio.state === "suspended") {
      audio.resume();
    }

    /* TONE YA KWANZA */
    const oscillator1 =
      audio.createOscillator();

    const gain1 =
      audio.createGain();

    oscillator1.type = "sine";

    oscillator1.frequency.setValueAtTime(
      660,
      audio.currentTime
    );

    oscillator1.frequency.exponentialRampToValueAtTime(
      880,
      audio.currentTime + 0.10
    );

    gain1.gain.setValueAtTime(
      0.16,
      audio.currentTime
    );

    gain1.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.35
    );

    oscillator1.connect(gain1);
    gain1.connect(audio.destination);

    oscillator1.start();

    oscillator1.stop(
      audio.currentTime + 0.35
    );


    /* TONE YA PILI - INAFANYA IWE KAMA NOTIFICATION */
    const oscillator2 =
      audio.createOscillator();

    const gain2 =
      audio.createGain();

    oscillator2.type = "sine";

    oscillator2.frequency.setValueAtTime(
      880,
      audio.currentTime + 0.08
    );

    oscillator2.frequency.exponentialRampToValueAtTime(
      1174.66,
      audio.currentTime + 0.18
    );

    gain2.gain.setValueAtTime(
      0.001,
      audio.currentTime
    );

    gain2.gain.linearRampToValueAtTime(
      0.13,
      audio.currentTime + 0.10
    );

    gain2.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.50
    );

    oscillator2.connect(gain2);
    gain2.connect(audio.destination);

    oscillator2.start(
      audio.currentTime + 0.08
    );

    oscillator2.stop(
      audio.currentTime + 0.50
    );


    /* Funga AudioContext baada ya sound */
    setTimeout(() => {

      if (audio.state !== "closed") {
        audio.close();
      }

    }, 700);

  }

  catch (error) {

    console.log(
      "Notification sound haijapatikana."
    );

  }

}


/* =========================================================
   32. SHOW NOTIFICATION
   ========================================================= */

function updateNotificationSoundButton() {
  const btn = document.getElementById("notifSoundToggle");
  if (!btn) return;
  const muted = localStorage.getItem("blogchat_notification_sound") === "off";
  btn.textContent = muted ? "🔇" : "🔊";
  btn.setAttribute("aria-pressed", String(!muted));
  btn.title = muted ? "Washa notification sound" : "Zima notification sound";
}

function toggleNotificationSound() {
  const muted = localStorage.getItem("blogchat_notification_sound") === "off";
  localStorage.setItem("blogchat_notification_sound", muted ? "on" : "off");
  updateNotificationSoundButton();
}

function showNextNotification() {

  const notification =
    document.getElementById(
      "floatingNotif"
    );


  const title =
    document.getElementById(
      "notifTitle"
    );


  const description =
    document.getElementById(
      "notifDesc"
    );


  if (
    !notification ||
    !title ||
    !description
  ) {

    return;

  }


  const current =
    notificationsData[
      currentNotificationIndex
    ];


  title.textContent =
    current.name;


  description.innerHTML =
    `Ametoa <span>${current.amount}</span> kupitia ${current.network}`;


  notification.classList.add(
    "show"
  );


  playNotificationSound();


  setTimeout(() => {

    notification.classList.remove(
      "show"
    );

  }, 4000);


  currentNotificationIndex =
    (currentNotificationIndex + 1) % notificationsData.length;

  notificationCountSinceRosterChange += 1;

  if (notificationCountSinceRosterChange >= 3) {
    notificationCountSinceRosterChange = 0;
    rotatePartnerRoster();
  } else {
    rotatePartnerPresence();
  }

  updateNotificationSoundButton();

}


/* =========================================================
   33. CLOSE NOTIFICATION
   ========================================================= */

function closeNotification() {

  const notification =
    document.getElementById(
      "floatingNotif"
    );


  if (notification) {

    notification.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   34. INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateSalioUI();
    activePartnerRoster = buildPartnerRoster(0);
    seedPartnerPresence(true);
    renderWazungu();
    updateLiveDateTime();
    updateNotificationSoundButton();
    setInterval(updateLiveDateTime, 1000);

    /* First notification */

    setTimeout(() => {

      showNextNotification();


      setInterval(
        showNextNotification,
        6000
      );

    }, 2000);

  }
);

// CUSTOMER CARE: HEADER + FLOATING BUTTONS
document.addEventListener('DOMContentLoaded', () => {
  const customerCareWhatsAppUrl = 'https://wa.me/255725310967';
  const customerCareBtns = document.querySelectorAll('.btn-customer-care');
  customerCareBtns.forEach(btn => {
    btn.setAttribute('href', customerCareWhatsAppUrl);
  });

  const customerBtn = document.getElementById('customerAssistanceBtn');
  if (customerBtn) customerBtn.setAttribute('href', customerCareWhatsAppUrl);
});
