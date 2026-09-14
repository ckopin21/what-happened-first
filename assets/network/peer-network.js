(function(){
  "use strict";
  const events=[];
  const configuredTurn=Array.isArray(window.WHF_TURN_ICE_SERVERS)?window.WHF_TURN_ICE_SERVERS:[];
  const forceRelay=configuredTurn.length>0&&new URLSearchParams(location.search).get("networkRelay")==="1";
  const iceServers=[{urls:["stun:stun.cloudflare.com:3478","stun:stun.l.google.com:19302"]},...configuredTurn];
  function record(scope,event,detail){const item={time:new Date().toISOString(),scope,event,detail:detail||""};events.push(item);if(events.length>250)events.shift();console[/error|failed/i.test(event)?"error":"info"](`[network:${scope}] ${event}`,detail||"")}
  function errorText(error){if(!error)return"unknown error";const type=String(error.type||error.name||"error"),message=String(error.message||error).replace(/^Error:\s*/,"");return message&&message!==type?`${type}: ${message}`:type}
  function peerOptions(){return{debug:1,config:{iceServers,iceCandidatePoolSize:4,...(forceRelay?{iceTransportPolicy:"relay"}:{})}}}
  function watchPeer(peer,scope){if(!peer||peer.__whfWatched)return peer;peer.__whfWatched=true;["open","connection","disconnected","close"].forEach(event=>peer.on(event,value=>record(scope,event,event==="open"?String(value||peer.id||""):event==="connection"?String(value?.peer||""):"")));peer.on("error",error=>record(scope,"error",errorText(error)));return peer}
  function watchConnection(conn,scope){
    if(!conn||conn.__whfWatched)return conn;conn.__whfWatched=true;record(scope,"connect-attempt",String(conn.peer||""));conn.on("open",()=>record(scope,"open",String(conn.peer||"")));conn.on("error",error=>record(scope,"error",errorText(error)));conn.on("close",()=>record(scope,"close",String(conn.peer||"")));
    let attempts=0;const attach=()=>{const pc=conn.peerConnection||conn._negotiator?.connection;if(!pc){if(attempts++<100)setTimeout(attach,50);return}if(pc.__whfWatched)return;pc.__whfWatched=true;const bind=(property,event)=>{const log=()=>record(scope,property,String(pc[property]||""));log();pc.addEventListener(event,log)};bind("iceConnectionState","iceconnectionstatechange");bind("iceGatheringState","icegatheringstatechange");bind("signalingState","signalingstatechange");bind("connectionState","connectionstatechange");pc.addEventListener("icecandidateerror",event=>record(scope,"icecandidateerror",`${event.url||"ICE server"}: ${event.errorCode||""} ${event.errorText||""}`.trim()))};attach();return conn
  }
  function connectionStage(conn){const pc=conn?.peerConnection||conn?._negotiator?.connection;if(!pc)return"waiting for WebRTC negotiation";if(pc.iceConnectionState==="failed")return"ICE negotiation failed (relay unavailable or network blocked)";if(pc.connectionState==="failed")return"WebRTC connection failed";if(pc.iceGatheringState!=="complete")return`gathering ICE candidates (${pc.iceGatheringState})`;return`opening data channel (ICE ${pc.iceConnectionState}, signaling ${pc.signalingState})`}
  function peerOpenTimeout(peer,scope,onTimeout,ms=10000){const timer=setTimeout(()=>{if(!peer?.open&&!peer?.destroyed){const detail=peer?.disconnected?"signaling disconnected":"signaling registration timed out";record(scope,"timeout",detail);onTimeout?.(detail)}},ms);peer?.on("open",()=>clearTimeout(timer));peer?.on("close",()=>clearTimeout(timer));return()=>clearTimeout(timer)}
  function connectionTimeout(conn,scope,onTimeout,ms=15000){const timer=setTimeout(()=>{if(!conn?.open){const stage=connectionStage(conn);record(scope,"timeout",stage);onTimeout?.(stage)}},ms);conn?.on("open",()=>clearTimeout(timer));conn?.on("close",()=>clearTimeout(timer));return()=>clearTimeout(timer)}
  window.WHF_NETWORK={events,iceServers,forceRelay,peerOptions,watchPeer,watchConnection,connectionStage,peerOpenTimeout,connectionTimeout,errorText,record};
})();
