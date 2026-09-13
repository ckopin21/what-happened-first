const fs=require('fs');
const path='outputs/dog-jeopardy.html';
let s=fs.readFileSync(path,'utf8');
const old=`  const offer=document.getElementById("phoneFollowOffer");
  if(offer) offer.style.display=document.getElementById("followOffer")?.classList.contains("visible") ? "block" : "none";

  const follow=document.getElementById("phoneFollowView");
  if(follow){
    const visible=document.getElementById("followBox")?.classList.contains("visible");
    follow.style.display=visible ? "block" : "none";
    if(visible){`;
const repl=`  const offer=document.getElementById("phoneFollowOffer");
  if(offer){
    const offerVisible=!!document.getElementById("followOffer")?.classList.contains("visible");
    const offerWasVisible=offer.style.display==="block";
    offer.style.display=offerVisible ? "block" : "none";
    if(remotePhoneMode && offerVisible && !offerWasVisible){
      requestAnimationFrame(()=>requestAnimationFrame(()=>offer.scrollIntoView({behavior:"smooth",block:"center"})));
    }
  }

  const follow=document.getElementById("phoneFollowView");
  if(follow){
    const visible=document.getElementById("followBox")?.classList.contains("visible");
    const followWasVisible=follow.style.display==="block";
    follow.style.display=visible ? "block" : "none";
    if(visible){
      if(remotePhoneMode && !followWasVisible){
        requestAnimationFrame(()=>requestAnimationFrame(()=>follow.scrollIntoView({behavior:"smooth",block:"start"})));
      }`;
if(!s.includes(old)) throw new Error('target snippet not found');
s=s.replace(old,repl);
fs.writeFileSync(path,s);
console.log('Added phone auto-scroll for two-part offer and follow-up section');
