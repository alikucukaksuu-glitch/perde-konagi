(()=>{
 'use strict';
 const staticSlugs=new Set(['bambu-bej-zebra-perde','bambu-beyaz-zebra-perde','bambu-gri-zebra-perde','bambu-kahve-zebra-perde','bambu-siyah-gecisli-zebra-perde','bambu-siyah-zebra-perde','mat-stor-antrasit','mat-stor-gri','mat-stor-kahve','mat-stor-kirik-beyaz','mat-stor-krem','mat-stor-mavi','mat-stor-siyah','mat-stor-turuncu']);
 const pages=new Map([['plise','plise-perde.html'],['ahsap-jaluzi','ahsap-jaluzi.html'],['wood-blind','ahsap-jaluzi.html'],['tul','tul-perde.html']]);
 window.pkProductPageUrl=(slug,collection)=>{
  if(staticSlugs.has(slug))return slug+'.html';
  return (pages.get(collection)||'urun.html')+'?slug='+encodeURIComponent(slug);
 };
})();
