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
- RESOLVED: lessons.yml added via GitHub web UI (89ed5c9); manual run #1 Success; daily 06:15 IL active

## סטטוס סנכרון עם רועי (00:31)
- (א) שחזור תצוגת המודעות (פליירים) - מתנגש עם החלטת המשתמש להסיר את "שיעורים קרובים" - לא משחזרים.
- (ב) תוכן לכרטיסי/עמודי התכניות - ממתין להחלטת המשתמש.
- (ג) העברת גישות - חסום על המשתמש.

## 2026-10-23 00:39 - Avraham's agent: video-2 batch + fixes (DONE, live)
- Homepage: story kicker deleted; stats strip removed; kept 2 tiles (הסניף הראשון / +1,000 חניכים) as centered .story-stats-duo inside הסיפור שלנו above the video; story photo preload; video raised.
- Quotes page: kicker + "אמרו עלינו" heading + subtitle deleted; 16/2 stat squares removed (strip kept with the 2 remaining tiles - הסיפור שלנו exists only on homepage); Greenberg card full width (q-card wide). HELD: subtitle "רבנים, אנשי ציבור ותקשורת..." per user.
- Series wired to real playlists with exact names: "שיעור פרשת שבוע שבועי הרב חיים גוטסדינר" (PLJNguypfQibs), "מוצ״ש בבית המדרש" (PLWynLIr8qI2Q). Series lines link to playlists (lessons grid, lessons.html sections, lesson page).
- Strip arrows: SVG chevrons pointing outward (prev right-edge >, next left-edge <), bidi-proof.
- Back-restore: card click saves {url,y} to sessionStorage ah-return; restore after render, scrollRestoration=manual. Verified: back from lesson.html returns to y=7806 at the strip.
- Fix: countUp observer retargeted (.story-stats -> .story-stats,.story-stats-duo) after strip removal; verified "+1,000" animates.
- Commits: 141ba33, c58a351, a65d143, 8df69d1, b773f21.

## 2026-10-23 00:46 - Avraham's agent: FULL REVERT of 00:40 batch per user (00:43)
- User: "תבטל את העדכון הזה ותחזיר למה שהיה". Reverted (git revert, no history rewrite): 141ba33, c58a351, a65d143, 8df69d1, b773f21. Revert commits: f312009 + 38850e9 (a65d143 needed its own revert - it predates c58a351).
- Restored: stats strip with "16 חברי צוות" + "2 רכזים", story kicker, quotes kicker/"אמרו עלינו"/subtitle, text-glyph arrows (‹ ›), series label "שיעורים כלליים" (JSON + pipeline), no playlist links, no back-restore.
- KEPT: daily lessons workflow (lessons.yml), marathon prize photo (6f3781e), virtual midrash build, שיעורים קרובים removal, Roi sync status above.
- Cache bumped: css v26, lessons.js v24, main.js v18, lesson-player.js v3.
- NOTE: none of the reverted changes may be re-applied until the user says so.
