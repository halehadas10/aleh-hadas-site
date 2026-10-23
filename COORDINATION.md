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

## 2026-10-23 01:12 - Avraham's agent: corrections batch (video 01:04), live (0ef88d2)
- Real durations from YouTube watch pages (durationSec in lessons.json + pipeline keeps them); badge format MM:SS / H:MM:SS, word "דקות" dropped.
- Thumbnails switched to hq720.jpg (true 16:9) in JSON + pipeline; no letterbox.
- Lesson page: native YouTube controls (controls=1: captions + speed menu); custom transport bar removed; audio-only bar = Spotify embed (legal audio-only, no ripping); playback stopped on pagehide/beforeunload; mini-player removed.
- "עוד מהשיעורים" -> "עוד שיעורים", shows ALL remaining lessons ordered from nearest date after the current lesson forward (wraps to earlier ones).
- Back-restore re-applied per explicit re-request (sessionStorage ah-return; חזרה לאתר honors it).
- Buttons verified correct (צפייה->watch page, האזנה בספוטיפיי->Spotify) - never swapped in code; user confusion likely from auto-resume audio (now removed).
- HELD: lessons count text (both-platforms question pending), הסיפור שלנו buttons comment, all other deletions until the next video is analyzed.
- Cache: css v27, lessons.js v25, lesson-player.js v4.

## 2026-10-23 01:25 - Avraham's agent: video-2 corrections batch, live (05300b5 + stat fix)
- Nav: בית מדרש וירטואלי moved to after עקבו אחרינו, before זמנים ומקום (all 5 pages).
- Home: story kicker deleted; 16/2 stat cards deleted (strip now 2 centered tiles: הסניף הראשון בתנועה green, +1,000 חניכים); story photo+text reveal together; reveal is now one-shot globally (no re-animation); promo video autoplays on section entry (threshold 0); #quotes title/sub spacing raised; JGive note trimmed; virtual subtitle trimmed.
- Quotes page: kicker/subtitle/אמרו עלינו/ציטוטים מקוריים deleted; content raised (84px); strip KEPT with 4 tiles (per item 9) with הראשון green/בתנועה; Greenberg photo spaced+scaled; prize-ceremony photo shrunk (max 230px); marathon-boy crop (object-position 25% 15%) + ידידיה מאיר source line deleted.
- Programs: one icon size (96px), orange titles fixed 2-line height, descriptions aligned, one-shot reveal.
- In-site overlay (js/ext-overlay.js, all pages): article links with data-overlay open in an iframe modal, חזרה לאתר top-right, exact scroll spot kept, new-tab fallback in bar. Wired: inn.co.il, kore, maariv, kav-itonut PDF. BLOCKED (kept new tab): JGive (XFO SAMEORIGIN), ynet (DENY), YouTube/Spotify/socials.
- HELD: A stat cards position, B rabbi photo shift, C quotes card order, D programs grid, gallery captions (style prep), lessons count text.
- Cache: css v28, main.js v19, ext-overlay.js v1.

## 2026-10-23 08:52 - Avraham's agent: light palette batch (user request 23.10 08:43 WhatsApp)
- Site background now WHITE/light; primary color = blue from the ORIGINAL Aleh Hadas logo (#00506e, sampled from the untouched original transparent logo from the user's PC); secondary = Ariel Dresinover medal green (#427651 dark green of the portrait/ring text, sage #a0c8a0 as light tints). No content or structure changes.
- :root vars remapped in place (css/style.css): navy-* = light surfaces (#ffffff/#f2f7fa/#e9f1f7/#dce8f1), text #14293a / dim #50667a, blue-light #17729d, green/green-soft = logo blue #00506e/#0f6e95 (LEGACY NAMES - now BLUE), gold/teal-soft = Ariel green #427651 (LEGACY NAME - now GREEN). Future editors: --green is blue, --gold is green; new code should use the hex values or add semantic vars.
- Header white with dark original logo: new asset assets/logo-aleh-hadas-original.png (user's untouched original transparent logo) replaces logo-wordmark-light.png in the header of all 5 pages. Hero/footer keep the light logos (hero on photo, footer is now a deep-blue #00506e band with light text).
- Program cards: white cards, blue icons #00506e, green captions/underline #427651 (was #F17909 orange / #2B90A3 teal). Donate band: green tint. Quote marks/badges/prize border: green. Cards/chips/lessons borders: blue tints. Shadows softened for light theme.
- Hero overlay blue-tinted, fades to page white at bottom; hero text kept white on the photo. Contact/donate section: white veil over the photo, white cards.
- Cache: css v29 (all 5 pages).
  - Follow-up (09a0fd7): הראשון stat tiles (home + quotes strips) now carry class stat-num.gold so they render in the Ariel green secondary, preserving the video-2 green emphasis under the new palette.
