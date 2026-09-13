from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'outputs' / 'dog-jeopardy.html'
s = path.read_text(encoding='utf-8')

marker = 'PHONE_FOLLOW_SCROLL_FIX_V8'
if marker in s:
    raise SystemExit('v8 already applied')

css = r'''

/* PHONE_FOLLOW_SCROLL_FIX_V8
   Keep the phone header fixed while the active question area owns touch scrolling.
   Extra bottom room ensures the fourth follow-up option and revealed answer can
   always be brought fully above the mobile browser chrome/safe area. */
body.remote-phone-mode .controller-preview{
  align-items:stretch!important;
  overflow:hidden!important;
}
body.remote-phone-mode .phone-shell{
  display:flex!important;
  flex-direction:column!important;
  height:100%!important;
  max-height:100%!important;
  min-height:0!important;
  overflow:hidden!important;
}
body.remote-phone-mode #phoneQuestionView{
  flex:1 1 auto!important;
  min-height:0!important;
  max-height:none!important;
  overflow-y:scroll!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  touch-action:pan-y!important;
  padding-bottom:calc(132px + var(--safe-bottom))!important;
  scrollbar-gutter:stable;
}
body.remote-phone-mode #phoneQuestionView>.phone-section{
  min-height:max-content!important;
  padding-bottom:24px!important;
}
body.remote-phone-mode #phoneFollowView{
  overflow:visible!important;
  padding-bottom:28px!important;
}
body.remote-phone-mode #phoneFollowAnswer{
  margin-bottom:48px!important;
  overflow-wrap:anywhere!important;
}
body.remote-phone-mode .phone-follow-choices{
  overflow:visible!important;
}
body.remote-phone-mode .phone-follow-choices .phone-action,
body.remote-phone-mode .phone-choice-btn{
  width:100%!important;
  height:auto!important;
  min-height:62px!important;
  max-height:none!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:normal!important;
  line-height:1.22!important;
  padding:12px 14px!important;
}
'''

if '</style>' not in s:
    raise RuntimeError('style close not found')
s = s.replace('</style>', css + '\n</style>', 1)

old = '''      document.getElementById("phoneFollowAnswer").style.display=Number.isInteger(current.followChoice)||document.getElementById("followAnswer")?.classList.contains("visible")?"block":"none";\n      renderPhoneFollowupChoices();'''
new = '''      const followAnswerEl=document.getElementById("phoneFollowAnswer");\n      followAnswerEl.style.display=Number.isInteger(current.followChoice)||document.getElementById("followAnswer")?.classList.contains("visible")?"block":"none";\n      renderPhoneFollowupChoices();\n      if(remotePhoneMode && Number.isInteger(current.followChoice)){\n        requestAnimationFrame(()=>followAnswerEl?.scrollIntoView({behavior:"smooth",block:"nearest"}));\n      }'''
if s.count(old) != 1:
    raise RuntimeError(f'follow answer sync target count={s.count(old)}')
s = s.replace(old, new, 1)

path.write_text(s, encoding='utf-8')
print('phone follow-up scrolling v8 applied')
