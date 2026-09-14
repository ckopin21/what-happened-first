/* Shared player identity helpers. A playerId belongs to the player, never to
   their visual seat. Session tokens remain reconnect credentials only. */
(function(){
  function id(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`}
  function player(fields={}){return {playerId:fields.playerId||id(),name:String(fields.name||"Player").trim().slice(0,24)||"Player",avatarId:String(fields.avatarId||"corgi"),score:Number(fields.score)||0,sessionToken:String(fields.sessionToken||fields.token||""),connected:!!fields.connected,streak:Number(fields.streak||fields.correctStreak)||0,lossStreak:Number(fields.lossStreak||fields.wrongStreak)||0,...fields}}
  function uniqueName(players,name,exceptId=""){const normalized=String(name||"").trim().toLocaleLowerCase();return !!normalized&&!players.some(player=>player.playerId!==exceptId&&String(player.name||"").trim().toLocaleLowerCase()===normalized)}
  window.JEOPARDY_PLAYERS=Object.freeze({id,player,uniqueName});
})();
