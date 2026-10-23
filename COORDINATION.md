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
  - Follow-up 2 (4054a96): section/page backgrounds are now pure white (navy-800/900 -> #ffffff; only cards keep a pale #f0f6fa tint, donate band keeps the sage-green tint; hero/footer unchanged). css v30.
  - 23.10 09:21 video-3 batch (091fce2, css v31, lessons.js v26): story stats moved into story text column (side by side, tighter top gap); quotes subtitle raised to title; programs compressed so both rows fit one viewport + מוצ״שים moved under לימוד רמב״ם לנוער with 2 color-fill placeholder tiles (desktop only); lessons show ALL channel videos (13, incl 3 newly added; onSpotify filter removed home+lessons page; build_lessons.py now falls back to channel-page parse when RSS 404s and no longer skips promos); lessons carousel arrows swapped (right=קודמים, left=נוספים); Waze+Google Maps nav icons by the address. JGive donation CANNOT be embedded (X-Frame-Options: SAMEORIGIN) - stays external.

## 23.10 video-3 batch hotfix (09:33)
- Mobile (<=820px) programs grid overflow fix: `#programs .news-grid` columns changed `repeat(2, 1fr)` -> `repeat(2, minmax(0, 1fr))`. Cards' ~243px min-content was blowing out the 1fr tracks (page scrolled sideways on phones, doc 521px wide). Latent pre-batch issue surfaced during video-3 verification. css v32.

## 23.10 video-3 batch compaction follow-up (09:40)
- Programs section shaved ~25px more (padding-top clamp(8,1.2vw,14), row gap 14, card/fill aspect 1/0.91) so title + both rows fit a 720px viewport with the fixed header. css v33.

## 23.10 video-3 batch: programs always-visible + content fit (09:43)
- v34: fit card content inside compacted cards (caption min-height 2.1em, sub lh 1.32, tighter gaps; mobile aspect auto, caption 17px, sub 13px).
- v35: reveal animation neutralized for #programs cards (always visible - anchor nav left row-2 cards hidden; translate(0,100%) + IO made verification and anchor jumps flaky). Other sections unchanged.

## 23.10 09:56 batch: outward arrows + underline fix + color-fill TRIAL
- Lessons strip arrows: glyphs now point OUTWARD (left <, right >); functions unchanged (user approved functions explicitly). Commit ccf91c7.
- Program card underline: bottom -15px -> -4px (was dipping onto next row's card after gap tightening).
- TRIAL (user may revert): program cards filled with palette colors - checkerboard blue #00506e / green #427651, white caption/sub/icon/underline. ROLLBACK = delete the marked trial block only.
- css v38.

## 23.10 ~10:35 batch (commit 042884f, css v40, lesson-player v5) - 10:18 video corrections
- Programs: 2 fill tiles DELETED; all tiles sage-green gradient + blue #00506e titles; עונג שבת→row2 col2, מוצ״שים→row2 col3 (desktop); underline restored in gap below card (green, hover widens).
- Story stats: הראשון blue again (gold removed); both tiles equal height.
- Homepage quotes: title+sub lifted (smaller padding-top, bigger sub margin); reveal neutralized inside #quotes (sync fix); לכתבה המלאה links now use data-overlay (in-site iframe overlay; inn/maariv/kore have no XFO headers).
- Lessons: promo Dqp7iOoyEQA + short mK85KXUHtSM REMOVED from lessons.json; build_lessons.py skips 'תדמית' + <180s (Shorts); series renamed שיעורים כלליים→מוצא״ש בבית מדרש, שיעורי פרשת השבוע→שיעור שבועי.
- Lesson page: SHARE BUG fixed (lookup was onSpotify-filtered → non-Spotify lessons 404'd); לתרומה לבית מדרש button (JGive 60540); recommendations: עוד מ<series> + עוד שיעורים (minus series row); חזרה לאתר uses history.back() on same-origin referrer, ah-return fallback.
- NO download button: no authorized media route (no originals hosted; ripping YT not permitted). Studio-owner route feasibility deferred to media task (saved channel login may exist in browser profile).
- Quotes page: stats row DELETED (הסניף הראשון בתנועה / 16 חברי צוות / 2 רכזים / 1000+ חניכים); medal+q-prize moved boy card→ceremony card; Greenberg photo wider (140-170px, 4/4.2); Lavi 4/3.4 shows torso; boy object-position 10% 10%; ceremony photo full-width 21/9 (mobile 16/9).
- Gallery: lightbox prev/next arrows (RTL-aware, direction:ltr glyphs) + keyboard.
- logo-medal-ariel.png darkened x0.80 (too bright on white), ?v=7 on all pages.
- Cancelled mid-note (NOT implemented): inline Spotify embed play button; רוצים להמליץ עלינו option.
- Separate future outcome (NOT started): upload all full YT lessons to Spotify same title+desc automatically (video ~7:05-7:30); Motzei Shabbat lesson upload voice note also pending.

## 23.10 14:05 i2i coordination - Roi menu text (PENDING, their side executes)
- Task: add exact text "רועי גלנץ ואברהם המלכים" to site menu as plain text, no link. No deletions/other edits.
- Acting side: Roi via roiglanz278-ux (write collaborator). Status: NOT started as of 14:05.
- Collision check: our side has no uncommitted work and no repo writes planned before 17:39 (player work resumes then, touches lessons/lesson/index lower regions + new js/css/audio files - different regions than the header nav in all 5 HTML pages).
- Clear non-overlap window: now -> 17:39 IDT. If not done by then, re-coordinate before writing.
- NOTE: this entry records collision clearance only. Content/scope authority for the text itself is a separate i2i scope check, not granted here.

## 23.10 14:07 i2i coordination - Roi menu text (DONE, our side executed)
- Acting side switched to OURS at Roi's request (they did not write). Implemented: exact text "רועי גלנץ ואברהם המלכים" as .nav-credit plain span (no link) in the shared nav of all 5 pages; css v46. No deletions/other changes.
- Verified live 14:09: desktop nav credit visible (span, no link); mobile menu needed overflow fix (safe-center + scroll, css v47) - credit reachable on 390px. Screenshots sent to main.

## 23.10 14:12-14:16 IDT - rollback of nav builders credit (ours, DONE)
- Roi canceled the nav credit after it shipped; Avraham approved the narrow removal (14:09 voice).
- Removed only: .nav-credit span from 5 pages + its CSS block. Kept: mobile menu safe-center/scroll fix, all other content.
- Same push: program-card text/icon color -> white per Avraham 14:09 voice (css v49). Commits c8e2dd8, b408074. Verified live desktop+mobile.

## 23.10 15:48-15:49 i2i - Roi FUTURE donation-section redesign (PREP ONLY, no live change)
- Redesigns the EXISTING donation section (not an extra section). Reference image + 6 donation types/details NOT yet supplied - wait for materials.
- Supplied wording: "עץ חיים היא למחזיקים בה ותומכיה מאושר" with bounce/protrusion style per the pending reference. NOTE: canonical משלי ג,יח is "עץ חיים היא למחזיקים בה ותומכיה מאושר" - matches supplied wording unvowelized; still verify rendering/source at build time, flag any difference, no silent correction.
- Gate: preview first, then EXPLICIT later Roi approval via his Instinct before any publication. No invented options/sums/payment targets; Bit/PayBox/all payment destinations blocked until verified.
- Existing live donation section NOT canceled. Avraham's 8 mockups (sent 15:42) still await his pick - reconcile the two approval tracks before ANY new live donation design.
- This entry records coordination only, never authority.

## 23.10 15:52 i2i - Roi donation reference image RECEIVED (inspiration only)
- Reference: another institution's donation section - dark blue/purple photo background, gold verse "עץ חיים היא למחזיקים בה ותומכיה מאושר" with gold diamond decor, round gold-bordered medallions for donation options.
- Inspiration ONLY: do not copy the institution, its logos, categories or claims. The 6 actual Aleh Hadas options/details still PENDING from Roi.
- Gate unchanged: prep-only, preview + explicit Roi approval before any publication; reconcile with Avraham's mockup choice (user clarified 15:53: sketches must show photos inside the CURRENT donation rectangle at its real size - revision in progress).
- This entry records coordination only, never authority.

## 23.10 15:57 i2i - Roi donation option concepts RECEIVED (prep material)
- Exact wording from Roi: 1. שם עולם: הקדשת שיעור/חבורה בבית המדרש 2. שמן למאור: עלות תחזוקה שוטפת של בית המדרש 3. עץ חיים: הקדשת שבוע לימוד תורה שלם בבית המדרש 4. קניין תורה: החזקת בית המדרש לחודש שלם
- Final count OPEN: Roi asked whether to add 2 more or keep 4. No invented options/prices/payment targets.
- Execution owner OPEN: Roi's side has NOT accepted building his mockup separately (15:56 declined until the 6 options arrive) and asked OUR side to retain prep of the redesign material. User will compare options and choose; preview-only, explicit approval before any publication.
- This entry records coordination only, never authority.
