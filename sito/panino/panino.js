const products = {
  bourclassic: {
    name: "Bourclassic",
    image: "bourClassic.jpg",
    price: "€ 12,00",
    description:
      "Il nostro grande classico: semplice, deciso e preparato al momento con ingredienti selezionati.",
    ingredients: [
      "Pane artigianale",
      "Hamburger di manzo",
      "Cheddar",
      "Insalata",
      "Salsa Bourmet",
    ],
    allergens: ["Glutine", "Latte", "Uova"],
  },
  bourcheese: {
    name: "Bourcheese",
    image: "bourCheese.jpg",
    price: "€ 13,00",
    description:
      "Una cascata di formaggio filante incontra il nostro hamburger di manzo alla griglia.",
    ingredients: [
      "Pane artigianale",
      "Doppio manzo",
      "Doppio cheddar",
      "Pomodoro",
      "Salsa cheese",
    ],
    allergens: ["Glutine", "Latte", "Uova", "Senape"],
  },
  boursqua: {
    name: "Boursqua",
    image: "bourcountry.jpg",
    price: "€ 13,50",
    description:
      "Il panino dal carattere rustico, ricco di sapori intensi e consistenze irresistibili.",
    ingredients: [
      "Pane rustico",
      "Manzo",
      "Formaggio",
      "Verdure",
      "Salsa affumicata",
    ],
    allergens: ["Glutine", "Latte", "Senape"],
  },
  bourcrispy: {
    name: "Bourcrispy",
    image: "bourPig.jpg",
    price: "€ 14,00",
    description:
      "Croccante fuori, succoso dentro: una combinazione costruita per lasciare il segno.",
    ingredients: [
      "Pane artigianale",
      "Manzo",
      "Bacon crispy",
      "Cipolla",
      "Salsa barbecue",
    ],
    allergens: ["Glutine", "Latte", "Uova", "Senape"],
  },
  bouritaly: {
    name: "Bouritaly",
    image: "bourChick.jpg",
    price: "€ 12,50",
    description:
      "Sapori italiani e ingredienti freschi racchiusi nel nostro morbido pane artigianale.",
    ingredients: [
      "Pane artigianale",
      "Pollo",
      "Mozzarella",
      "Pomodoro",
      "Basilico",
    ],
    allergens: ["Glutine", "Latte"],
  },
  bourpig: {
    name: "Bourpig",
    image: "bourbuffalo.png",
    price: "€ 14,00",
    description:
      "Gusto intenso, cottura lenta e una salsa leggermente piccante per veri intenditori.",
    ingredients: [
      "Pane brioche",
      "Maiale sfilacciato",
      "Cheddar",
      "Cipolla",
      "Salsa spicy",
    ],
    allergens: ["Glutine", "Latte", "Uova", "Senape"],
  },
  bourvegan: {
    name: "Bourvegan",
    image: "bourVegan.jpg",
    price: "€ 12,00",
    description:
      "La nostra alternativa vegetale, colorata, generosa e piena di gusto.",
    ingredients: [
      "Pane vegan",
      "Burger vegetale",
      "Verdure",
      "Insalata",
      "Salsa vegan",
    ],
    allergens: ["Glutine", "Soia", "Sesamo"],
  },
  bouregg: {
    name: "Bouregg",
    image: "bour rossini.png",
    price: "€ 14,50",
    description:
      "Un panino ricco e avvolgente con uovo, manzo e la firma inconfondibile Bourmet.",
    ingredients: [
      "Pane artigianale",
      "Manzo",
      "Uovo",
      "Formaggio",
      "Salsa Bourmet",
    ],
    allergens: ["Glutine", "Latte", "Uova", "Senape"],
  },
  onionrings: {
    name: "Onion rings",
    folder: "fritti, insalatone e dolci",
    image: "37e4643aaa9cc758591badcd45ae75c6.jpg",
    price: "€ 6,00",
    theme: "sides",
    label: "Fritti selection",
    description:
      "Anelli di cipolla dorati e croccanti, serviti caldi con la nostra salsa.",
    ingredients: ["Cipolla", "Pastella croccante", "Salsa Bourmet"],
    allergens: ["Glutine", "Uova"],
  },
  fiorifritti: {
    name: "Fiori fritti",
    folder: "fritti, insalatone e dolci",
    image: "Fiori-di-zucca-fritti.jpeg",
    price: "€ 7,00",
    theme: "sides",
    label: "Fritti selection",
    description:
      "Fiori di zucca avvolti in una pastella leggera e fritti al momento.",
    ingredients: ["Fiori di zucca", "Pastella", "Olio di semi"],
    allergens: ["Glutine"],
  },
  salviacrunch: {
    name: "Salvia crunch",
    folder: "fritti, insalatone e dolci",
    image: "R.jpg",
    price: "€ 6,50",
    theme: "sides",
    label: "Fritti selection",
    description:
      "Foglie di salvia croccanti, profumate e perfette da condividere.",
    ingredients: ["Salvia", "Pastella", "Sale"],
    allergens: ["Glutine"],
  },
  chicksalad: {
    name: "Chick salad",
    folder: "fritti, insalatone e dolci",
    image: "Chick.jpg",
    price: "€ 10,00",
    theme: "sides",
    label: "Insalatone",
    description:
      "Un’insalata fresca e completa con pollo, verdure e condimento della casa.",
    ingredients: ["Pollo", "Insalata", "Verdure", "Salsa Bourmet"],
    allergens: ["Uova", "Senape"],
  },
  veggiemix: {
    name: "Veggie mix",
    folder: "fritti, insalatone e dolci",
    image: "WhatsApp Image 2026-04-21 at 2.16.50 PM.jpeg",
    price: "€ 7,50",
    theme: "sides",
    label: "Fritti selection",
    description: "Una selezione di verdure croccanti preparate al momento.",
    ingredients: ["Verdure di stagione", "Pastella", "Olio di semi"],
    allergens: ["Glutine"],
  },
  frittobourmet: {
    name: "Fritto Bourmet",
    folder: "fritti, insalatone e dolci",
    image: "WhatsApp Image 2026-04-21 at 2.16.50 PM (6).jpeg",
    price: "€ 9,00",
    theme: "sides",
    label: "Fritti selection",
    description:
      "Il nostro fritto misto: sfizioso, abbondante e ideale da condividere.",
    ingredients: ["Selezione di fritti", "Verdure", "Salse della casa"],
    allergens: ["Glutine", "Latte", "Uova"],
  },
  amarenacake: {
    name: "Amarena cake",
    folder: "fritti, insalatone e dolci",
    image: "cheescake amarene.jpg",
    price: "€ 6,00",
    theme: "desserts",
    label: "Dessert selection",
    description:
      "Cheesecake cremosa con amarene, dolce e piacevolmente acidula.",
    ingredients: ["Crema al formaggio", "Biscotto", "Amarene"],
    allergens: ["Glutine", "Latte", "Uova"],
  },
  chococake: {
    name: "Choco cake",
    folder: "fritti, insalatone e dolci",
    image: "cheescake nutella.jpg",
    price: "€ 6,00",
    theme: "desserts",
    label: "Dessert selection",
    description:
      "Una cheesecake golosa ricoperta da una generosa crema al cioccolato.",
    ingredients: ["Crema al formaggio", "Biscotto", "Crema al cioccolato"],
    allergens: ["Glutine", "Latte", "Uova", "Frutta a guscio"],
  },
  pistacchiocake: {
    name: "Pistacchio cake",
    folder: "fritti, insalatone e dolci",
    image: "cheescake pistacchio.jpg",
    price: "€ 6,50",
    theme: "desserts",
    label: "Dessert selection",
    description: "Cheesecake vellutata con crema e granella di pistacchio.",
    ingredients: ["Crema al formaggio", "Biscotto", "Pistacchio"],
    allergens: ["Glutine", "Latte", "Uova", "Frutta a guscio"],
  },
  pistacchiopop: {
    name: "Pistacchio pop",
    folder: "Sliding Panini",
    image: "card-10.jpg",
    price: "€ 6,50",
    theme: "desserts",
    label: "Dessert selection",
    description:
      "Un dessert al pistacchio dal cuore morbido e dal gusto intenso.",
    ingredients: ["Pistacchio", "Crema", "Base soffice"],
    allergens: ["Glutine", "Latte", "Uova", "Frutta a guscio"],
  },
};

const key = new URLSearchParams(location.search).get("panino") || "bourclassic";
const product = products[key] || products.bourclassic;
document.body.classList.add(`product-theme-${product.theme || "burgers"}`);
document.title = `${product.name} | Bourmet`;
const image = document.querySelector("#product-image");
image.src = `../../images/${product.folder || "Panini"}/${product.image}`;
image.alt = product.name;
document.querySelector("#product-label").textContent =
  product.label || "Bourmet selection";
document.querySelector("#product-name").textContent = product.name;
document.querySelector("#product-description").textContent =
  product.description;
document.querySelector("#product-price").textContent = product.price;
document.querySelector("#product-ingredients").innerHTML = product.ingredients
  .map((item) => `<li>${item}</li>`)
  .join("");
document.querySelector("#product-allergens").innerHTML = product.allergens
  .map((item) => `<li>${item}</li>`)
  .join("");

const themeContent = {
  burgers: {
    serving: "Servito con patatine",
    title:
      "Carne selezionata.<br>Pane artigianale.<br><em>Gusto senza compromessi.</em>",
    copy: "Preparato espresso ogni giorno nella nostra cucina.",
  },
  sides: {
    serving: "Preparato al momento",
    title: "Dorato.<br>Croccante.<br><em>Tutto da condividere.</em>",
    copy: "Fritti e insalatone preparati al momento con ingredienti selezionati.",
  },
  desserts: {
    serving: "Fatto in casa",
    title: "Cremoso.<br>Goloso.<br><em>Irresistibile.</em>",
    copy: "Il finale perfetto, preparato con tutta la cura della nostra cucina.",
  },
};
const content = themeContent[product.theme || "burgers"];
document.querySelector("#product-serving").textContent = content.serving;
document.querySelector("#product-note-title").innerHTML = content.title;
document.querySelector("#product-note-copy").textContent = content.copy;

const toggle = document.querySelector(".nav-toggle"),
  nav = document.querySelector(".nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }),
);
