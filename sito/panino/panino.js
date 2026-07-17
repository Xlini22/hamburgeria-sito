const products={
  bourclassic:{name:'Bourclassic',image:'bourClassic.jpg',price:'€ 12,00',description:'Il nostro grande classico: semplice, deciso e preparato al momento con ingredienti selezionati.',ingredients:['Pane artigianale','Hamburger di manzo','Cheddar','Insalata','Salsa Bourmet']},
  bourcheese:{name:'Bourcheese',image:'bourCheese.jpg',price:'€ 13,00',description:'Una cascata di formaggio filante incontra il nostro hamburger di manzo alla griglia.',ingredients:['Pane artigianale','Doppio manzo','Doppio cheddar','Pomodoro','Salsa cheese']},
  boursqua:{name:'Boursqua',image:'bourcountry.jpg',price:'€ 13,50',description:'Il panino dal carattere rustico, ricco di sapori intensi e consistenze irresistibili.',ingredients:['Pane rustico','Manzo','Formaggio','Verdure','Salsa affumicata']},
  bourcrispy:{name:'Bourcrispy',image:'bourPig.jpg',price:'€ 14,00',description:'Croccante fuori, succoso dentro: una combinazione costruita per lasciare il segno.',ingredients:['Pane artigianale','Manzo','Bacon crispy','Cipolla','Salsa barbecue']},
  bouritaly:{name:'Bouritaly',image:'bourChick.jpg',price:'€ 12,50',description:'Sapori italiani e ingredienti freschi racchiusi nel nostro morbido pane artigianale.',ingredients:['Pane artigianale','Pollo','Mozzarella','Pomodoro','Basilico']},
  bourpig:{name:'Bourpig',image:'bourbuffalo.png',price:'€ 14,00',description:'Gusto intenso, cottura lenta e una salsa leggermente piccante per veri intenditori.',ingredients:['Pane brioche','Maiale sfilacciato','Cheddar','Cipolla','Salsa spicy']},
  bourvegan:{name:'Bourvegan',image:'bourVegan.jpg',price:'€ 12,00',description:'La nostra alternativa vegetale, colorata, generosa e piena di gusto.',ingredients:['Pane vegan','Burger vegetale','Verdure','Insalata','Salsa vegan']},
  bouregg:{name:'Bouregg',image:'bour rossini.png',price:'€ 14,50',description:'Un panino ricco e avvolgente con uovo, manzo e la firma inconfondibile Bourmet.',ingredients:['Pane artigianale','Manzo','Uovo','Formaggio','Salsa Bourmet']}
};

const key=new URLSearchParams(location.search).get('panino')||'bourclassic';
const product=products[key]||products.bourclassic;
document.title=`${product.name} | Bourmet`;
const image=document.querySelector('#product-image');
image.src=`../../images/Panini/${product.image}`;
image.alt=product.name;
document.querySelector('#product-name').textContent=product.name;
document.querySelector('#product-description').textContent=product.description;
document.querySelector('#product-price').textContent=product.price;
document.querySelector('#product-ingredients').innerHTML=product.ingredients.map(item=>`<li>${item}</li>`).join('');

const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.nav');
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
