/* Shared, touch-friendly profile editor for both game modes. */
(function(){
  if(window.WHF_PROFILE_EDITOR)return;
  const style=document.createElement("style");
  style.textContent=`
    .whf-profile-editor{display:none;position:fixed;inset:0;z-index:40000;align-items:center;justify-content:center;padding:18px;background:rgba(1,7,12,.9);backdrop-filter:blur(8px)}
    .whf-profile-editor.showing{display:flex;animation:whfProfileFade .18s ease}
    .whf-profile-card{width:min(520px,96vw);max-height:92dvh;overflow:auto;background:linear-gradient(160deg,#176b9e,#0b304b);border:4px solid rgba(255,255,255,.92);border-radius:24px;padding:22px;box-shadow:0 30px 70px rgba(0,0,0,.55);text-align:left}
    .whf-profile-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.whf-profile-head h2{margin:0;color:#ffd166;font-size:clamp(25px,6vw,34px)}.whf-profile-head p{margin:5px 0 0;color:#cfe6f5;font-size:13px;font-weight:800}.whf-profile-close{margin:0!important;padding:5px 11px!important;background:#fff;color:#173047;border-radius:999px;font-size:20px;line-height:1}
    .whf-profile-label{display:block;margin:17px 0 7px;color:#dcecf7;font-size:13px;font-weight:1000}.whf-profile-name{width:100%;margin:0!important;border:2px solid rgba(255,255,255,.22);background:#102b4c;color:#fff;padding:13px;border-radius:13px;font-size:18px}
    .whf-profile-avatars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}.whf-profile-avatar{width:100%;aspect-ratio:1;margin:0!important;padding:5px!important;border-radius:50%;background:#17375d;border:3px solid transparent;display:flex;align-items:center;justify-content:center}.whf-profile-avatar img{display:block;width:100%;height:100%;object-fit:contain}.whf-profile-avatar.selected{border-color:#ffd166;box-shadow:0 0 0 4px rgba(255,209,102,.18),0 0 20px rgba(255,209,102,.3)}.whf-profile-error{min-height:19px;margin-top:9px;color:#ffd1d1;font-size:12px;font-weight:900}.whf-profile-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:5px}.whf-profile-actions button{min-width:92px}
    @keyframes whfProfileFade{from{opacity:0}to{opacity:1}}
    @media(max-width:390px){.whf-profile-card{padding:17px}.whf-profile-avatars{gap:7px}}
  `;
  document.head.appendChild(style);
  let overlay=null,active=null;
  function close(){if(!overlay)return;overlay.classList.remove("showing");active=null}
  function showError(message){const el=overlay?.querySelector(".whf-profile-error");if(el)el.textContent=message||""}
  function open(options={}){
    const avatars=Array.isArray(options.avatars)?options.avatars:[];
    if(!overlay){
      overlay=document.createElement("div");overlay.className="whf-profile-editor";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
      overlay.innerHTML='<div class="whf-profile-card"><div class="whf-profile-head"><div><h2 class="whf-profile-title">Edit Profile</h2><p class="whf-profile-subtitle">Change your name or profile picture.</p></div><button type="button" class="whf-profile-close" aria-label="Close">×</button></div><label class="whf-profile-label" for="whfProfileName">Player name</label><input id="whfProfileName" class="whf-profile-name" maxlength="24" autocomplete="off"><div class="whf-profile-label">Choose an avatar</div><div class="whf-profile-avatars"></div><div class="whf-profile-error" role="alert" aria-live="polite"></div><div class="whf-profile-actions"><button type="button" class="white whf-profile-cancel">Cancel</button><button type="button" class="gold whf-profile-save">Save Changes</button></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector(".whf-profile-close").onclick=close;
      overlay.querySelector(".whf-profile-cancel").onclick=close;
      overlay.addEventListener("click",event=>{if(event.target===overlay)close()});
      document.addEventListener("keydown",event=>{if(event.key==="Escape"&&active)close()});
    }
    active={...options,avatars};
    overlay.querySelector(".whf-profile-title").textContent=options.title||"Edit Profile";
    overlay.querySelector(".whf-profile-subtitle").textContent=options.subtitle||"Change your name or profile picture.";
    const input=overlay.querySelector(".whf-profile-name");input.value=String(options.name||"");
    const selected=Math.max(0,Math.min(Math.max(0,avatars.length-1),Number.isInteger(options.avatarIndex)?options.avatarIndex:0));
    const grid=overlay.querySelector(".whf-profile-avatars");grid.innerHTML="";
    avatars.forEach((avatar,index)=>{const button=document.createElement("button");button.type="button";button.className="whf-profile-avatar"+(index===selected?" selected":"");button.title=avatar?.name||`Avatar ${index+1}`;button.setAttribute("aria-label",button.title);const image=document.createElement("img");image.src=avatar?.src||"";image.alt=avatar?.name||`Avatar ${index+1}`;button.appendChild(image);button.onclick=()=>{grid.querySelectorAll(".whf-profile-avatar").forEach(item=>item.classList.remove("selected"));button.classList.add("selected");active.avatarIndex=index};grid.appendChild(button)});
    active.avatarIndex=selected;showError("");overlay.classList.add("showing");setTimeout(()=>input.focus(),30);
    overlay.querySelector(".whf-profile-save").onclick=()=>{
      const name=input.value.trim();
      if(!name){showError("Enter a player name.");input.focus();return}
      if(typeof active.validateName==="function"){
        const result=active.validateName(name);
        if(result!==true&&result!==undefined&&result!==null&&result!==""){showError(typeof result==="string"?result:"Choose a unique player name.");return}
        if(result===false){showError("Choose a unique player name.");return}
      }
      const callback=active.onSave;const payload={name,avatarIndex:active.avatarIndex};close();if(typeof callback==="function")callback(payload);
    };
  }
  window.WHF_PROFILE_EDITOR=Object.freeze({open,close});
})();
