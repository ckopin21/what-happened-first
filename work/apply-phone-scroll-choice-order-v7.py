from pathlib import Path

root = Path(__file__).resolve().parents[1]
game_path = root / 'outputs' / 'dog-jeopardy.html'
audit_path = root / 'work' / 'audit-game.js'
s = game_path.read_text(encoding='utf-8')

def one(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {n}')
    s = s.replace(old, new, 1)

# Make the phone controller itself the vertical scroll surface and let long
# primary/follow-up choice text grow naturally instead of clipping.
css = r'''

/* PHONE_SCROLL_CHOICE_FIX_V7 */
body.remote-phone-mode .controller-preview{
  overflow:hidden!important;
}
body.remote-phone-mode .phone-shell{
  height:100%!important;
  max-height:100%!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch;
  overscroll-behavior:contain;
  touch-action:pan-y;
}
body.remote-phone-mode #phoneQuestionView,
body.remote-phone-mode #phoneFollowView{
  overflow:visible!important;
  min-height:min-content;
}
.phone-choice-btn,
.phone-follow-choices .phone-action{
  box-sizing:border-box!important;
  width:100%!important;
  height:auto!important;
  min-height:64px!important;
  padding:14px 12px!important;
  white-space:normal!important;
  overflow:visible!important;
  overflow-wrap:anywhere!important;
  word-break:normal!important;
  line-height:1.22!important;
  font-size:clamp(14px,4vw,19px)!important;
  text-align:center;
}
.phone-follow-choices .phone-action{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}
@media(max-width:390px){
  .phone-choice-btn,
  .phone-follow-choices .phone-action{
    min-height:58px!important;
    padding:12px 10px!important;
    font-size:clamp(13px,3.8vw,17px)!important;
  }
}
'''
one('</style>', css + '\n</style>', 'late phone CSS override')

# Use a shuffled two-item side bag. Each pair of newly-opened normal questions
# contains one left-correct and one right-correct layout, with random pair order.
# This keeps the answer side unpredictable but guarantees visible variation.
one(
'''function shuffledPrimaryChoices(values){
  const out=Array.isArray(values)?values.slice():[];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function primaryChoicesForCurrent(){
  if(!current)return[];
  const base=Array.isArray(current.item?.choices)?current.item.choices:[];
  if(!Array.isArray(current.choiceOrder)||current.choiceOrder.length!==base.length)current.choiceOrder=shuffledPrimaryChoices(base);
  return current.choiceOrder;
}
''',
'''let primaryCorrectSideBag=[];
function shuffledPrimaryChoices(values){
  const out=Array.isArray(values)?values.slice():[];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function correctChoiceForItem(item){
  if(!item?.choices?.length)return null;
  const target=normalizeChoiceText(item.a);
  return item.choices.find(c=>{
    const n=normalizeChoiceText(c);
    return target===n || target.includes(n) || n.includes(target);
  }) || item.choices[0];
}
function nextPrimaryCorrectSide(){
  if(!primaryCorrectSideBag.length){
    primaryCorrectSideBag=Math.random()<.5?[0,1]:[1,0];
  }
  return primaryCorrectSideBag.shift();
}
function buildPrimaryChoiceOrder(item,values){
  const out=Array.isArray(values)?values.slice():[];
  if(out.length!==2)return shuffledPrimaryChoices(out);
  const correct=correctChoiceForItem(item);
  const other=out.find(x=>normalizeChoiceText(x)!==normalizeChoiceText(correct));
  if(!correct||other===undefined)return shuffledPrimaryChoices(out);
  return nextPrimaryCorrectSide()===0?[correct,other]:[other,correct];
}
function primaryChoicesForCurrent(){
  if(!current)return[];
  const base=Array.isArray(current.item?.choices)?current.item.choices:[];
  if(!Array.isArray(current.choiceOrder)||current.choiceOrder.length!==base.length)current.choiceOrder=buildPrimaryChoiceOrder(current.item,base);
  return current.choiceOrder;
}
''',
'primary choice bag helpers')

one(
'''  const choiceOrder=isReview&&Array.isArray(item.playedChoiceOrder)&&item.playedChoiceOrder.length===baseChoices.length
    ? item.playedChoiceOrder.slice()
    : shuffledPrimaryChoices(baseChoices);''',
'''  const choiceOrder=isReview&&Array.isArray(item.playedChoiceOrder)&&item.playedChoiceOrder.length===baseChoices.length
    ? item.playedChoiceOrder.slice()
    : buildPrimaryChoiceOrder(item,baseChoices);''',
'choice order construction')

game_path.write_text(s, encoding='utf-8')

# Strengthen audit marker for the concrete phone scrolling and balanced random side logic.
a = audit_path.read_text(encoding='utf-8')
needle = 'if(!html.includes("shuffledPrimaryChoices")||!html.includes("primaryChoicesForCurrent")||!html.includes("choiceOrder:Array.isArray(current.choiceOrder)")||!html.includes(\'broadcastGameState(true);\\n      showToast("Primary answer correct"\')) throw new Error("Primary choice shuffle or follow-up broadcast fix missing");\n'
replacement = needle + 'if(!html.includes("PHONE_SCROLL_CHOICE_FIX_V7")||!html.includes("primaryCorrectSideBag")||!html.includes("buildPrimaryChoiceOrder")||!html.includes("nextPrimaryCorrectSide")) throw new Error("Phone scrolling or balanced primary answer-side randomization missing");\n'
if needle not in a:
    raise RuntimeError('audit primary shuffle marker not found')
a = a.replace(needle, replacement, 1)
audit_path.write_text(a, encoding='utf-8')
print('phone scroll / choice order v7 applied')
