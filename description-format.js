(()=>{'use strict';
/* Render admin-approved Markdown as safe structured HTML. No external script required. */
const tags=new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE']);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sanitize(html){
 const doc=new DOMParser().parseFromString('<div>'+String(html||'')+'</div>','text/html');
 function walk(node){
  if(node.nodeType===3)return esc(node.textContent);
  if(node.nodeType!==1)return '';
  const inner=[...node.childNodes].map(walk).join('');
  if(node.tagName==='DIV')return inner?'<p>'+inner+'</p>':'';
  if(!tags.has(node.tagName))return inner;
  const tag=node.tagName.toLowerCase();
  return '<'+tag+'>'+inner+'</'+tag+'>';
 }
 return [...(doc.body.firstElementChild?.childNodes||[])].map(walk).join('');
}
function textToLines(src){
 const root=new DOMParser().parseFromString('<div>'+String(src||'')+'</div>','text/html').body.firstElementChild;
 const lines=[];
 function append(text){const pieces=String(text).split(/\r?\n/);for(let i=0;i<pieces.length;i++){if(i)lines.push('');lines.push(pieces[i])}}
 function walk(node){
  if(node.nodeType===3){append(node.nodeValue);return}
  if(node.nodeType!==1)return;
  if(node.tagName==='BR'){lines.push('');return}
  if(['P','DIV','H2','H3','H4','LI','UL','OL','BLOCKQUOTE'].includes(node.tagName)){
   if(lines.length&&lines[lines.length-1]!=='')lines.push('');
   if(node.tagName==='H2'||node.tagName==='H3'||node.tagName==='H4')lines.push('#'.repeat(Number(node.tagName[1]))+' ');
   if(node.tagName==='LI')lines.push('- ');
  }
  for(const child of node.childNodes)walk(child);
  if(['P','DIV','H2','H3','H4','LI','UL','OL','BLOCKQUOTE'].includes(node.tagName))lines.push('');
 }
 for(const child of root?.childNodes||[])walk(child);
 return lines.join('\n').replace(/\n{3,}/g,'\n\n');
}
function inline(text){
 let s=esc(text);
 s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
 s=s.replace(/__(.+?)__/g,'<strong>$1</strong>');
 s=s.replace(/\*(?!\s)([^*\n]+)\*/g,'<em>$1</em>');
 s=s.replace(/_(?!\s)([^_\n]+)_/g,'<em>$1</em>');
 return s;
}
function fromMarkdown(source){
 const lines=String(source||'').replace(/\r\n/g,'\n').split('\n');
 const out=[];let list=null;let para=[];
 function paragraph(){if(!para.length)return;out.push('<p>'+inline(para.join(' ').trim())+'</p>');para=[]}
 function endList(){if(list){out.push('</'+list+'>');list=null}}
 for(const raw of lines){
  const line=raw.trim();
  if(!line){paragraph();endList();continue}
  const heading=line.match(/^(#{1,4})\s+(.+)$/);
  const unordered=line.match(/^[-*•]\s+(.+)$/);
  const ordered=line.match(/^\d+[.)]\s+(.+)$/);
  if(heading){paragraph();endList();out.push('<h'+Math.max(2,Math.min(4,heading[1].length+1))+'>'+inline(heading[2])+'</h'+Math.max(2,Math.min(4,heading[1].length+1)) +'>');continue}
  if(unordered||ordered){paragraph();const kind=unordered?'ul':'ol';if(list!==kind){endList();out.push('<'+kind+'>');list=kind}out.push('<li>'+inline((unordered||ordered)[1])+'</li>');continue}
  endList();para.push(line)
 }
 paragraph();endList();
 return out.join('');
}
function normalize(source){
 const str=String(source||'');
 if(!str.trim())return '';
 // Convert pasted HTML paragraphs containing literal Markdown markers, keeping sensible line breaks.
 if(/<(?:p|div|br|h[2-4]|ul|ol|li)\b/i.test(str)){
  const parser=new DOMParser().parseFromString('<div>'+str+'</div>','text/html');
  const paragraphs=[...parser.body.firstElementChild.querySelectorAll('p,h2,h3,h4,li,div')];
  const hasMarkdown=paragraphs.some(p=>/^\s*(?:#{1,4}\s+|[-*•]\s+|\d+[.)]\s+|\*\*.+\*\*)/.test(p.textContent||''));
  if(hasMarkdown || /^\s*#\s+/.test(parser.body.firstElementChild.textContent||'')){
   // Source came from a plain-text Markdown paste; paragraph gaps are formatting, not content.
   const text=parser.body.firstElementChild.innerText; // not consistently available in parsed DOM
   const lineTexts=[];
   const walk=(node)=>{
    if(node.nodeType===3){lineTexts.push(node.nodeValue);return}
    if(node.nodeType!==1)return;
    if(node.tagName==='BR'){lineTexts.push('\n');return}
    if(['P','DIV','H2','H3','H4','LI'].includes(node.tagName)){lineTexts.push('\n');for(const child of node.childNodes)walk(child);lineTexts.push('\n');return}
    for(const child of node.childNodes)walk(child);
   };
   for(const child of parser.body.firstElementChild.childNodes)walk(child);
   return fromMarkdown(lineTexts.join('').replace(/\n{3,}/g,'\n\n'));
  }
  return sanitize(str);
 }
 return fromMarkdown(str);
}
window.PKDescriptionFormat={normalize,sanitize};
})();