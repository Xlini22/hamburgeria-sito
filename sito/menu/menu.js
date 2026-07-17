const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.nav');toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));document.querySelectorAll('.category-toggle').forEach(button=>button.addEventListener('click',()=>{const category=button.closest('.menu-category'),open=!category.classList.contains('open');category.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}));

const productGroups=[
  ['.category-burgers',['bourclassic','bourcheese','boursqua','bourcrispy','bouritaly','bourpig','bourvegan','bouregg']],
  ['.category-sides',['onionrings','fiorifritti','salviacrunch','chicksalad','veggiemix','frittobourmet']],
  ['.category-desserts',['amarenacake','chococake','pistacchiocake','pistacchiopop']]
];
productGroups.forEach(([selector,slugs])=>document.querySelectorAll(`${selector} .menu-product`).forEach((card,index)=>{
  card.tabIndex=0;
  card.setAttribute('role','link');
  const openProduct=()=>location.href=`../panino/panino.html?panino=${slugs[index]}`;
  card.addEventListener('click',openProduct);
  card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct()}});
}));
