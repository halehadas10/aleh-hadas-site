# COORDINATION

קובץ תיאום בין עורכי האתר (אינסטינקט / רועי). לפני שעורכים — לבדוק מה כתוב כאן; כשמתחילים עבודה — לעדכן.

## עבודה פעילה כרגע
- אין עבודה פעילה. (אינסטינקט: 23:58, באצ' C הועלה - commit 4c797d0)

## באצ'ים שהועלו
- 22.10 23:15 — סדר עמוד, סיפור אמיתי, 6 תכניות, תמונות ציטוטים, כרטיסי רשתות (1db24e0, b5a7f5c, 6ede4e4)
- 22.10 23:58 — סדר לשוניות, אנימציית "הסניף הראשון", חיתוך תמונות, שורת זכויות, כפתור חזרה, לייטבוקס בגלריה, עיצוב תכניות, כרטיס צוות 13, טקסט תרומה, כרטיסי רשתות אחידים, מדליה לכרטיס הפרס (4c797d0)

## 2026-10-23 בית מדרש וירטואלי (user approved "הופ לעבודה")
- Data pipeline: scripts/build_lessons.py (YouTube RSS + watch pages, Spotify latest via embed, Hebcal dates) -> data/lessons.json
- Daily refresh: .github/workflows/lessons.yml (06:15 IL)
- Both-platforms rule: lesson shows only with Spotify match in data/spotify-map.json
- Pages: lessons.html (series grid), lesson.html?v= (custom player: volume+speed, share/copy, YouTube/Spotify links, mini-player resume inside lessons pages)
- Homepage: "בית מדרש וירטואלי" section after שיעורים קרובים + nav link (all pages)
- Skipped per user/parent: file downloads, cross-page persistence beyond mini-player

## 2026-10-23 follow-up (user voice 00:18)
- עקבו אחרינו: latest-content cards DELETED; virtual-midrash lessons strip lives there now (social links row kept)
- שיעורים קרובים section + nav item DELETED everywhere (flyer images kept in /assets, unreferenced)
- Carousel: hidden scrollbar, ‹ › arrow buttons
- Cards: צפייה / האזנה בספוטיפיי actions; shaveihevron lessons-UX as the model (series, rabbi, Hebrew date, counts)
- Marathon prize card: user's photo (boy with glasses) cropped 4:5.3
- PENDING INFRA: .github/workflows/lessons.yml cannot be pushed (PAT lacks workflow scope) - must be added via GitHub web UI; file lives in repo workspace, content shared with Roi
