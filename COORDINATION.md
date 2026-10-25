# COORDINATION

קובץ תיאום בין עורכי האתר (אינסטינקט / רועי). לפני שעורכים — לבדוק מה כתוב כאן; כשמתחילים עבודה — לעדכן.

## עבודה פעילה כרגע
- אין עבודה פעילה. (אינסטינקט: 25.10 08:47, ביקורת רועי הושלמה ללא patch)

## 2026-10-25 ביקורת איכות תמונות (רועי, בסיס f621314)
- נסרקו 16 עמודים / 148 תמונות ב-390/768/1440 DPR1 אחרי lazy-load: אין החלפת src ישימה בנכסים הקיימים.
- ממצא יחיד: hadas-ben-shoshan.jpg (116x116) מוצג 149x182 בדסקטופ בעמוד הציטוטים - אין מקור גדול יותר בריפו/היסטוריה; אופציה: תמונה טובה יותר מהמשתמש.
- act-b1.jpg (1023x681) מוצג 1240 - הגרסה הטובה ביותר הקיימת; שאר הקרוסלה 1600x1200 (שוחזר ב-b128f7e).
- לא נבדקו: CSS backgrounds, DPR>1. שורות nat 0x0 בדיווח = תמונות lazy שלא נטענו בעת המדידה (ארטיפקט מדידה, לא בעיה).

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
- Final count FOUR (Roi 15:58), NO prices. Per-option: small thematic image inside a circle; explicitly NOT the words "עץ חיים" inside the small icon/logo - use an image instead. Licensed/permitted imagery only, no copied protected logos. Verse(s) like the reference; source-check the text and surface any discrepancy, no silent correction. No payment target assumed.
- Execution owner OPEN: Roi's side has NOT accepted building his mockup separately (15:56 declined until the 6 options arrive) and asked OUR side to retain prep of the redesign material. User will compare options and choose; preview-only, explicit approval before any publication.
- This entry records coordination only, never authority.

## 25.10 v75+v76 (task agent, from user corrections-video deep decode)
- v75: footer restructure pixel-pinned from video pointer frames (288-312s): brand block (logo+medal+title+dedication) moved to TOP of footer centered; האתר column -> right; בית המדרש -> left; credit/photo-rights lines stay bottom-center; VISIBLE version stamp line DELETED by explicit user order (finger on the line at 311s + "זאתי למחוק... זה לא יפה"). Versioning continues invisibly via ?v= refs + this file.
- v76: (a) donate page back-to-site strip (ls-backwrap) was stark white between dark hero and teal footer - user: "אתה עשה את הרקע לבן, מאוד מאוד" (317-324s) -> tinted #eef4f6, page-local override. (b) REMOVED the "לשאר חברי הצוות" toggle + 8 placeholder team cards (ישראל ישראלי / tel:00000) from index contact section - user mocked the dummies on video (165-181s "כתוב פה חייג אפס אפס אפס"); real team roster is user-owned content, pending. JUDGMENT CALL (no explicit delete verb) - flagged to main. main.js untouched (bindOnce null-guards).
- Note: visible coordinator cards intentionally show generic name "ישראל ישראלי" with real phones - user explicitly asked names anonymized to ישראל ישראלי (159-166s).

## v82 (11:13 IST 25.10) - stat card mirror structure
- User voice 11:08:15 (wamid...0MzOUQ0MDcA): למעלה מ־ moves to TOP row as plain label styled exactly like הסניף (same color/size/baseline), 1,000 blue middle, חניכים bottom; plus removed (auto-transcript שתורידי + main hypothesis; למעלה מ־ already means "over").
- index.html: left stat card now stat-pre/stat-num/stat-label mirror of right card; data-prefix/data-suffix removed (JS support kept, unused).
- Verified pixels mobile 390px + desktop 1280px on live site (both top labels same baseline, number blue, no plus).

## v83+v84 (11:17 IST 25.10) - quote photos + plus restore
- v83 (d51047c): home quote-card photos per user video 58-79.6s (too big + תוריד למטה): clamp 92-130px (was 120-170), overlap -36px desktop/-34px mobile (was -64/-56). Scope: home cards only. Verified mobile 98x127 + desktop 137x176 px.
- v84 (e164e5e): plus suffix restored on 1,000 per explicit user text 11:15:30 (wamid...0M0FCzhEMkFBMzAzOTNCMTg5NTYA). v82 top-label structure kept. Mobile-verified final countup state 1,000+ with RTL placement matching v80 rendering.

## v85 (11:27 IST 25.10) - player in-flow, floating bar removed
- User video 213-280s decode: "הוא צף, זה לא משהו שביקשתי"; reference = shaveihevron.org lessons (in-flow player; corner circle proven = Elementor Ally accessibility widget, NOT audio FAB - no FAB built).
- js/ah-player.js: bar mounts in-flow inside #lpAudio on lesson page (ahp-inflow, position:static); on pages without the mount it stays hidden even on snapshot restore. reshow() re-mounts when returning to the lesson page in-shell. Continue-on-leave unchanged: audio element lives in shell context, bar dies with <main> swap.
- js/lesson-player.js: one-line reshow hook in ahInit. YT normal+fallback paths untouched.
- refs: all css/js refs normalized to ?v=93 on all pages incl. programs/ (v91).
- Verified: in-flow bar pixels (time/±30/15/speed/volume/close all render); lessons.html with snapshot = bar hidden; YT fallback intact. NOT runtime-verified: reshow on in-shell return (headless autoplay blocked; code-reviewed only).

## v86+v87 (11:33 IST 25.10) - player lifecycle fixes + FULL real-gesture verification
- v86 (84ce79e): bar must be SIBLING after #lpAudio (init rewrites #lpAudio innerHTML, child bar destroyed on in-shell return).
- v87 (9e1a69b): relocation condition fix - body-mounted restored bar moves in-flow when lesson page mounts.
- REAL-GESTURE LIFECYCLE VERIFIED (cloud browser, trusted clicks, in-shell links): play -> playing+in-flow+visible; leave to quotes in-shell -> bar destroyed, audio continues (27s->31s); return via lessons -> bar reshows in-flow, time 4:03/45:16 preserved, still playing. Fresh-load restore also verified (v7 served, in-flow, paused snapshot).

## v88 (11:37 IST 25.10) - reshow meta fix + MOBILE PASS COMPLETE
- v88 (df45f15): reshow() re-populates title/rabbi/cover (mobile return showed blank meta on rebuilt bar).
- Mobile 390px real-gesture pass: play (trusted click) -> in-flow bar 359px/390 not clipped, playing; +30 skip 1s->33s; speed cycles x1.25; volume slider set 0.3; leave in-shell -> bar destroyed, audio continues (65s->69s); return -> bar reshows in-flow with title/rabbi/cover/time 2:52/45:16, speed+volume preserved.

## v89 (11:40 IST 25.10) - mobile player bar layout fix (main pixel review)
- Legacy max-560px rule HID time+rabbi and single-row flex squeezed meta to zero + half-clipped X. Fixed: two-row layout (cover+title+rabbi+time row, controls row space-between), 34px buttons, 64px vol slider. Pixel-verified 390px: time "0:02 / 45:16" visible, title+rabbi visible, X at x26-60 fully inside, overflowX false, playing.

## A2 root-cause correction (11:45 IST 25.10) - duplicate lessons CLOSED
- True root cause: lessons.js renders were NOT idempotent at filming time (fe70e1a) - shell re-init appended the full catalog per visit; his 2 visits = exactly 2x cards. Data never contained dups (5 historical states checked).
- Fix: 76bd652 (02:56 IST) host.innerHTML='' in both render fns. Runtime-proven 25.10 11:44: 3 in-shell visits -> 12 cards each.
- YouTube bot-variant (empty metadata) is a separate data-integrity issue, NOT the dup cause.
- A3 (428-442s): grounded as shaveihevron DONATE-page reference (named option cards + payment methods). Option names/amounts for us = user-owned. No change made.

## v90-v94 (14:31 IST 25.10) - Motzash batch: nav home item, carousel arrows, donation medallion, player-in-frame + main-review correctness
- v90 (25f34c9): ראשי item in mobile hamburger menu only (user 14:05:58 wamid...0FBMTQ5ODdBQ0M3Mzg1OTFDRkEA), first item, scrolls to top; desktop nav unchanged. Verified mobile+desktop DOM+pixels.
- v91 (9b40e3f): (a) home activities-carousel prev/next arrows hidden MOBILE ONLY (user 14:07:10 wamid...0FCNkE0NUVERjM0NUFCMEFCRTIA) - dots/swipe/desktop kept; (b) program-page donation entry as rounded-square medallion panel per donate-page design (user 14:08:05 wamid...0EyOTBFNTU2MUVEMTkwQzE5OTkA), href/words preserved, both viewports; (c) player mounted INSIDE lesson audio frame, visible paused from load, one Play starts (user 14:10:52 wamid...0EzRTcxRUU4MDM2MEMxRjRBQ0YA) - no separate launch button; no-autoplay/background-continuity/leave-return preserved; (d) all css/js refs ?v=91 on ALL pages (v90 missed style.css bump).
- v92 (20b03f7): live-bind meta repopulation fix (returning in-shell to playing lesson rebuilt an empty bar).
- v93 (4785d48): main pixel review 14:21 - preview-mode controls gated: only Play acts (loads displayed lesson); skip/seek/speed/volume inert via inPreview(); X always hidden in preview (can never stop a different playing lesson under this label); stop() resets audio source so 0:00 preview is truthful.
- v94 (a3dd2a5): preview bar immune to playing lesson's syncUI - while previewing B with A playing, A's timeupdate no longer rewrites B's static 0:00 time/progress/play-icon (was showing A's live clock under B's title, implying B playing); mediaSession still tracks real audio.
- FULL A->B trusted-click verification on live v94: play A -> open B in-shell -> B preview static 0:00/29:38, X hidden, A keeps playing (289->302), +30/-15/speed inert (299->299, x1 unchanged) -> trusted Play switches to B (pos from 0, X restored, no navigation) -> X at pos 9 reverts to preview 0:00 -> replay starts 0:02 (true reset, not resume). Mobile/desktop pixel proofs captured for all four items.

## v95 (16:45 IST 25.10) - nav 404 from program pages fixed (Roi report)
- Roi report 25.10 16:41 (via his Instinct): https://halehadas10.github.io/aleh-hadas-site/programs/index.html#programs -> GitHub Pages 404.
- Root cause: header/footer chrome persists across shell swaps while the URL moves into programs/. Its root-relative './...' links (and goHomeIndex's './index.html'+hash) then resolved against the subdirectory -> /programs/index.html#programs. Affected class: every './' header/footer link (תכניות/גלריה/שיעורים/ציטוטים/תרומה/logo) clicked from any program page, desktop+mobile.
- Fix: js/ah-shell.js + js/main.js compute AH_ROOT from their own script URL (never location.href); ah-shell re-points .site-header/.site-footer './' links to root-absolute once at init; goHomeIndex targets new URL('index.html'+hash, AH_ROOT). Swapped-in <main> relative links untouched.
- refs: all css/js refs normalized to ?v=95 on ALL pages incl. programs/.
- Executor: Avraham's side (this Instinct). No design change, behavior repair only.

## v96 (16:50 IST 25.10) - closing gershayim on every quote card (user 16:48:45)
- User text 16:48:45: add quotation marks at the BOTTOM-RIGHT corner of every quote, home #quotes and the quotes/articles page. Executed under his direct ask (his own site change).
- index.html .qp-card::after + quotes.html .q-card::after: "״" glyph, bottom:6px right:22px, same 3.2rem gold serif as the existing top-left ::before. Top marks, texts, photos untouched.
- refs: all css/js refs normalized to ?v=96 on ALL pages.
- SEPARATE approval-gated item: Shmuel Eliyahu card blank-space shrink = MOCKUP ONLY until his explicit yes (same message). Not in this commit.
- Executor: Avraham's side (this Instinct).

## v97 (16:54 IST 25.10) - closing-mark clearance fix (main pixel review 16:53)
- v96's bottom-right " could sit on the source row/date on narrow cards (390px Rimon card). Reserved space instead of moving the mark: .qp-src/.q-src get padding-inline-start:56px (inline-start = right in RTL), so no text ever enters the mark's corner strip. No card-height change, no layout change elsewhere. Mark color unchanged = same var(--gold) as the existing top mark (renders green).
- refs: all css/js refs normalized to ?v=97 on ALL pages.
- Shmuel Eliyahu shrink remains approval-gated, NOT in this commit.
- Executor: Avraham's side (this Instinct).

## v98 (16:56 IST 25.10) - corner clearance widened
- 56px read tight against long dates at 390px; widened to 72px. Same rule, both pages.

## v99 (16:59 IST 25.10) - quotes "חזרה לאתר" returns to last homepage section (Roi 25.10 16:50:46 + clarification 16:50:58)
- Grounded current behavior: quotes.html backHome href is plain ./index.html; the legacy inline handler only history.back()s when document.referrer is the homepage, which never holds for in-shell visits -> in the real flow it landed on the homepage TOP. Not the lessons ah-return system (separate, untouched).
- js/main.js: scroll spy now persists the current homepage section id to sessionStorage['ah-home-section'] on change (spyPairs exist only on the homepage); hero reads as 'home' when no section passes the read line.
- quotes.html backHome: if a saved section exists, navigate to ./index.html#<section> via AHShell.go (shell swap + existing hash landing) or location.href; legacy referrer/history.back fallback kept for direct visits with no saved section. Scope: quotes page only (Roi's request); gallery/lessons/donate/lesson back buttons unchanged.
- refs: all css/js refs normalized to ?v=99 on ALL pages. Preserves v95 root-resolution.
- Executor: Avraham's side (this Instinct).

## v100 (17:00 IST 25.10) - closing mark moved to END OF QUOTE TEXT (user correction 16:59:14, supersedes v96-v98 placement)
- User reply to the Eliyahu sketch: "לא טוב, תעביר את הגרשיים... לסוף הציטוט של הרב ולא לז החלון שלו". The closing gershayim now sits inline right after the last word of the quote text (.qp-text::after / .q-text::after, same green var(--gold) serif as the opening mark, text size). Corner ::after and the 72px reserved strip removed. Applied to every quote card, home + quotes page. Card heights unchanged (Eliyahu shrink still approval-gated, NOT included).
- refs: all css/js refs normalized to ?v=100 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v101 (17:02 IST 25.10) - program donation icon swap (Roi) + green story text (user approval)
- Roi 25.10 16:59:20 (via his Instinct): on individual program pages, the bottom donation link's heart icon -> the beit-midrash logo. programs/program-1..9.html (program-10 stub has no donation link): heart SVG replaced with assets/logo-aleh-hadas-light.png (the light wordmark variant already used on the dark footer; dark variants would vanish on the dark-red medallion). Medallion, link target ../donate.html, label לתרומה לבית המדרש, hover behavior all preserved.
- User approval 17:00:28 "תחיל את הכיתוב הירוק באתר" to the full-section preview: .story-text now 21px@1280 (clamp 1.02rem, 1.64vw, 1.3125rem; mobile unchanged), line-height 1.75, color #427651. Copy/title/blue stats untouched. This approval does NOT cover the Eliyahu card shrink (still gated).
- refs: all css/js refs normalized to ?v=101 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v102 (17:03 IST 25.10) - recovery for stale bad literal URLs (Roi 17:01:36 re-hit + "שלא יקרה יותר")
- Roi re-hit /programs/index.html#programs AFTER v95 (fresh click vs stale tab unconfirmed, peer checking). v95 stopped generating that URL; this adds recovery for the literal URL class itself: redirect stubs programs/{index,donate,gallery,quotes,lessons,lesson}.html -> ../<same> preserving hash (JS location.replace + meta-refresh + visible link fallback). No real page shadowed (these files never existed). Old tabs with pre-v95 cached JS now recover instead of landing on a hard 404.
- Executor: Avraham's side (this Instinct).

## v103 (17:08 IST 25.10) - LAYOUT RESTORATION + donation CTA removal
- ROOT CAUSE of the widespread layout regression (user 17:04 screenshots: huge quote photos, story photo/video gap gone, stat boxes gone/wrong colors/widths): v100's closing-mark rule in index.html (.qp-text::after) and quotes.html (.q-text::after) was missing its closing brace, so the CSS parser swallowed every following rule in those inline blocks (42 rules on the homepage: .qp-photo sizing, .story-grid, .story-photo, .stat-card boxes/widths, .stat-pre/.stat-label colors...). Added the missing `}` in both files -> all original rules restored exactly; approved green story text and end-of-text closing marks preserved. Not another writer, not cache, not deploy: my v100 edit. No layout rule itself was edited.
- User 17:07:11+17:07:16 (supersedes Roi 16:59:20 icon swap): REMOVED the bottom donation medallion CTA from ALL program pages. User 17:07:49: added the existing homepage donation section (contact-donate-solo pattern, as on quotes/lessons/gallery/lesson) at the very bottom of ALL program pages 1-10, above the footer, linking ../donate.html. לכל התכניות/דברו איתנו buttons kept; no payment/target change; no asset files deleted.
- Executor: Avraham's side (this Instinct).

## v105 (17:15 IST 25.10) - donation section containment fix on program pages
- v103 placed the donation section INSIDE main.prog-wrap (max-width 980): the inner .container (min(1200,92vw)) overflowed the wrap, panel bled off-viewport left (main pixel review 17:13 FAIL). Restructured all 10 program pages: main now plain, program content in inner .prog-wrap/.stub-inner div, donation section a full-width sibling at the end of main - same geometry as quotes/lessons/gallery, shell-swap safe (stays inside main). No visual change to the program content itself.
- Executor: Avraham's side (this Instinct).

## v106 (17:17 IST 25.10) - shell fetch revalidation
- ah-shell fetchPage now uses cache:'no-cache' (ETag revalidate): shell navigation picks up deployed HTML changes instead of serving session-cached/HTTP-cached stale page HTML (found while verifying v105: a shell swap rendered the pre-fix program page structure from cache while direct loads were correct). 304s keep it cheap; no behavior change otherwise.
- Executor: Avraham's side (this Instinct).

## v107 (17:20 IST 25.10) - TEMP placeholder photo on all program pages (user 17:09:33)
- User: "בכל התמונות בדפי התוכניות תבחר תמונה רנדומאלית שהעליתי לך של בנים ותשים אותה בהכל, בהמשך אתן לך תמונות ותשים אותם". Chose assets/image-0cc9df18-PVXUTW4T.jpg (his Oct 23/25 WhatsApp upload batch, verified visually: boys learning in the beit midrash) and set ALL 44 carousel slides across program-1..9 to it (program-10 stub has no photos). Original gallery assets kept on disk untouched. Placeholder until he supplies replacements.
- Executor: Avraham's side (this Instinct).

## v108 (17:32 IST 25.10) - program rename + specials deletion + back-control visibility + bottom section tracking
- User 17:27: program "ערב שבת לשמיניסטים" renamed to "ערב שבת בבית המדרש", description (his exact words) "שיעור המתרחש מידי ערב שבת בבית המדרש המיועד לכלל הנוער ומתעסק בפרשת השבוע לאחר השיעור מתקיים לימוד עצמי." Applied to the home program card (caption + sub) and programs/program-9.html (title, h1, carousel alts, prog-desc replacing the בלה בלה placeholder, talk-modal program line).
- User 17:27:44+17:27:47: "התוכנית של ספישלים ואת הדף הפנימי שלו מתחק" / "מחק" - ספיישלים card removed from the home programs grid and programs/program-8.html deleted. No other page linked to it (checked). Unrelated asset files kept.
- User 17:29 (annotated screenshot): on program pages the top back control sat UNDER the fixed site header (76px) when reached through in-site navigation - the shell keeps the home header, and .prog-wrap/.stub-inner had only 34/40px top padding. Top padding now calc(var(--header-h) + 18px) on program pages 1-10; back control visible and clickable; target ../index.html#programs unchanged.
- Roi 25.10 bottom case (original quotes-return scope): the scroll spy's 35%-viewport read line never reaches the last homepage block (תרומה has no nav pair), so at the page bottom it recorded 'times' while the donation area filled the screen. main.js now records the actual last homepage section at page bottom, so quotes "חזרה לאתר" returns to it. No other page's back button touched.
- refs: all css/js refs normalized to ?v=108 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v109 (17:33 IST 25.10) - inert "קישור לקבוצה" button on program pages
- User 17:31:17: 'תוסיף בכל דפי התוכנית לחצן בשם"קישור לקבוצה" בנתיים שלא יעשה כלום,בהמשך אשלח לך קישורים ושכל לחצן יפנה אל הקישורים האלו'. Added an inert <button> labeled קישור לקבוצה (no handler, no href) to the CTA row of program pages 1-7 and 9 (program-8 deleted in v108; program-10 is a placeholder stub with no CTA row - excluded, easy to add when it becomes a real page). Awaits his links.
- refs: all css/js refs normalized to ?v=109 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v110 (17:34 IST 25.10) - program subpage descriptions (Roi 17:30:26-30 batch)
- Roi's exact descriptions (wording/typos preserved) replace the בלה בלה בלה placeholders: item1->program-1 (ט'-יב'), item2->program-2 (ה'-ו'), item3->program-3 (רמב"ם), item4->program-4 (חבורות), item5->program-7 (נערות ז'-ח', הרבנית רינת פסטליך), item6->program-6 (מוצ"שים), item7->program-5 (עונג שבת הרב יוני לביא). Item 8 (ערב שבת) HELD: conflicts with Avraham's explicit 17:27 wording; his text stays pending Roi reconciliation. Home card subs unchanged (batch named subpage descriptions).
- refs: all css/js refs normalized to ?v=110 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v111 (17:35 IST 25.10) - uniform program photo swap (Roi's selection, owner-approved)
- Roi selected a photo for uniform program-subpage use (17:30 batch, reply 17:31:47). Owner was shown the actual image and asked "להחליף לזו שרועי בחר?" - answered כן (17:32:38 + confirmed כן 17:32:58). All program-page carousel slides (40 refs = 8 pages x 5, program-1..7+9; program-8 deleted in v108) now use assets/program-uniform-roi.jpg (his original file preserved byte-for-byte). The previous temporary placeholder (assets/image-0cc9df18-PVXUTW4T.jpg, owner's own upload) stays on disk untouched. No home-card or other-page image scope.
- refs: all css/js refs normalized to ?v=111 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v112 (17:36 IST 25.10) - evening page inner description (Roi item8, placement resolved)
- Owner 17:33:51: his 17:27 text is the OUTER (home card) description; Roi's item8 text is the INNER program-page description. No conflict: program-9 .prog-desc now carries Roi's exact item8 text; the home card sub keeps Avraham's exact 17:27 wording. Title ערב שבת בבית המדרש unchanged everywhere.
- refs: all css/js refs normalized to ?v=112 on ALL pages.
- Executor: Avraham's side (this Instinct).

## v113 (25.10.2026 ~17:46)
- ah-shell.js: stale-while-revalidate page cache (keyed by path, background no-cache revalidation) + prefetch of whole-document internal links on load and after swaps. Restores instant inner-page tab-click response (v106 plain no-cache added ~1.7s network wait before any scroll response; user 25.10 17:41: "ועוד הפעם ביטלת את הגלילה המהירה"). Deploy propagation kept via revalidation.
- main.js: scroll-spy sessionStorage write ('ah-home-section') gated to homepage only - in-shell inner pages keep the home header, whose bare '#quotes' nav link paired with the quotes page's own id="quotes" element and clobbered the saved home section (broke quotes "חזרה לאתר" bottom-case return).
- refs ?v=113 on all pages.
Executor: Avraham's side (this Instinct).

## v114 (25.10.2026 ~17:49)
- ah-shell.js: hash-landing after an in-shell swap now waits up to ~2s for main.js's AHScrollToId (fast eased scroller) before the native scrollIntoView fallback. Root cause of the user-reported lost fast scroll (25.10 17:41): direct landings on inner pages (quotes.html etc.) do not load main.js, so swap landings fell back to the slow native CSS-smooth scrollIntoView. Verified live pre-fix: quotes->home tab click = native glide, no AHScrollToId.
- refs ?v=114 on all pages.
Executor: Avraham's side (this Instinct).

## v115 (25.10.2026 ~17:56)
- ah-shell.js: shell swaps now ADOPT site header/footer when the session started on a chrome-less page (program pages ship main-only). Fixes: refresh/direct-load on a program page then "חזרה לתכניות" landed on a headerless homepage - no nav/tab bar at all (found during the 17:41 fast-scroll investigation).
- Talk modal (programs 1-7,9): ONE placeholder contact card - ישראל ישראלי / בלה בלה בלה / חייג · 000000000 (user 25.10 17:37:54). Real contacts (דוד גרינפלד, נועה מועלם) and their tel/wa.me targets removed from these modals. Roi's דניאל פפר removal (17:40:19): zero textual references existed site-wide (grep-verified).
- lesson.html: donation heart now opens the EXISTING 3-method picker (JGive/PayBox/Bit, same destinations as donate page) instead of linking straight to JGive (user 25.10 17:35:01). Heart icon retained.
- index.html עקבו אחרינו: Instagram card split like the YouTube/Spotify pair; new WhatsApp card opposite it with description קבוצות הוואצפ של ביהמ"ד (user 25.10 17:40:49). Click opens a small window with ONE column of FIVE placeholder groups - no links yet (owner supplies them later).
- style.css: #programs bottom padding clamp(30px,4vw,52px) - narrows the programs<->contact gap (Roi 25.10 17:37:35; measured 115.2px+51.2px before).
- program-10 stub: same inert קישור לקבוצה placeholder button as the other program pages.
- donate.html: blue hero background REMOVED (user 25.10 17:46:28); gallery photo with the most learners that does NOT appear on the homepage (assets/gallery/side-3.jpg, all act-* are on the homepage) as background at high transparency (opacity .16, cover = aspect preserved, no stretch); hero text recolored for readability on light background.
- refs ?v=115 on all pages.
Executor: Avraham's side (this Instinct).

## v116 (25.10.2026 ~18:01)
- style.css: .wa-groups-title color literal #14323f (--navy-800 resolves to #ffffff in this site's inverted scale - title was white-on-white).
- refs ?v=116 on all pages.
Executor: Avraham's side (this Instinct).

## v117 (user 25.10 18:13): WhatsApp icon beside each of the 5 placeholder rows in the homepage follow-us groups window (index.html + css/style.css). No links/destinations added; placeholders unchanged. Owner reply to the delivered modal image: "יופי רק לייד שים אייקון של וואצפ בכל שורה". Executor: Avraham's side (this Instinct).

## v118 (user 25.10): fast tab-scroll robustness - one native smooth scroll per click replaces rAF-stepped scroller that froze/teleported on busy machines (18:19 video: "אתה כל הזמן מבטל את זה"); promo video pauses offscreen; page prefetch moved to idle-after-load. Talk modal: single card spans full width (18:20 voice - lone card hugged half the window). Follow-us: Instagram full middle row, TikTok half beside WhatsApp (18:21 voice). Donate: photo reframed to learners (position 72%), extended through the back-button strip to the blue footer, same transparency, aspect preserved (18:22 voice). Executor: Avraham's side (this Instinct).

## v119 (Roi 25.10 20:15 conditional approval via i2i, verified +972556869913, wamid ...OEE5MTBBNEIA; owner 18:19 deprioritized-not-cancelled this batch): program-4 (חבורות) קישור לקבוצה button now opens a six-row WhatsApp groups window. Wording per Roi's condition: "קבוצת וואצפ חבורה · עולים לכיתה ה׳-י׳" (preserves ה-י mapping + עולים לכיתה context from the source poster). Six exact supplied chat.whatsapp.com invites; no poster (contains revoked name), no new names, other programs keep the inert button. Executor: Avraham's side (this Instinct).

## v120 (owner 25.10 20:22 WhatsApp correction to v119 modal, replying to mobile screenshot: "כמעט, תרד שורה בכולם אחרי המילה חבורה ותגיד לרועי שצריך למחוק את המילה עולים"): chavurot modal rows now break after חבורה and drop עולים - "קבוצת וואצפ חבורה" / "לכיתה ה׳-י׳". Six links and grade mappings unchanged; all other design unchanged. Owner wording outranks Roi's approved v119 wording. Executor: Avraham's side (this Instinct).

## v121 (Roi 25.10 20:39:02 explicit v2 design approval desktop+mobile "כןכן מאשר גם דסקטופ גם טלפון" wamid ...MDQ4MDVCRDYA + 20:39:31 same-tab choice "אותה לשונית" wamid ...OTc3QUVEMzUA, both via i2i verified +972556869913; owner standing grant for Roi website requests): chavurot modal replaced by standalone page programs/chavurot-groups.html - cleaned poster (revoked דניאל פפר removed from כיתה ט׳, רועי גלנץ kept; original poster never published), six byte-exact WhatsApp invites BELOW the poster, two-line labels "קבוצת וואצפ חבורה / לכיתה ה׳-י׳" (owner 20:22 wording, Roi agreed). program-4 button now same-tab link to the page; modal markup/JS removed. WhatsApp links open new tab. Executor: Avraham's side (this Instinct).

## v122 (owner 25.10 20:53 WhatsApp "תבטל את הקטע שאם לוחצים קישור לקבוצה זה מעביר לדף חדש"; owner controls over Roi's page approval): program-4 restored to the v120 in-page modal (button opens six-group modal, two-line labels קבוצת וואצפ חבורה / לכיתה ה׳-י׳, no עולים, six byte-exact links). Standalone chavurot-groups.html + cleaned poster remain in repo but are no longer linked from the button. Executor: Avraham's side (this Instinct).

## v122 (continued, owner 25.10 20:53 "ואת הפלאייר תוסיף לקרוסלה"): cleaned chavurot flyer (poster-chavurot-clean.png, דניאל פפר removed) added as 6th carousel slide on program-4, object-fit contain so the whole flyer shows unstretched/uncropped; existing 5 images preserved. Carousel dots auto-generate. Executor: Avraham's side (this Instinct).

## v127 (25.10, night)
- Fix: nav תרומה pill (.nav-link.nav-donate) label back to white - the v123 .nav-link override had turned it green-on-green and invisible. Caught on main's pixel review.

## v126 (25.10, night)
- Follow-up: "לכל השיעורים" back button (.btn-back, dark text on light gradient) also to story green. Homepage sweep now shows only intentional leftovers: icons/glyphs (carousel arrows, ✕) and white/light text on dark backgrounds (hero, program cards, footer, buttons).

## v125 (25.10, night)
- Follow-up on v123/v124: full computed-color sweep of the homepage found remaining non-green text - lesson carousel (.ls-topic/.ls-meta/.ls-desc/.ls-act), contact roles, donate note, WhatsApp-groups modal (.wa-groups-*). All switched to story green. Icons/glyphs and explicit white-on-dark text still untouched.

## v124 (25.10, night)
- Follow-up on v123: quote-card "לכתבה המלאה" link (.qp-src a) also switched to story green so no non-green writing remains on the homepage. Same owner instruction.

## v123 (25.10, night)
- Source: owner WhatsApp 25.10 23:30:59 (wamid.HBgMOTcyNTQ5OTE3MzcyFQIAEhgUM0E1NzZEN0NFRjlGNzIxNDA2NzIA): "תהפוך את כל הכיתוב בדף הראשי באתר לצבע הירוק ששמת במלל של הסיפור שלנו" — all homepage writing in the approved story green #427651.
- Change: index.html body gets class home-green-text; scoped color overrides appended to css/style.css (v123 block). Explicit white text on photo/colored backgrounds (hero, program cards, buttons, player bar, footer) unchanged. Other pages untouched.
- Executor: Avraham's side (this Instinct).

## v128 (26.10, midnight)
- Source: owner WhatsApp 26.10 00:10:10 (wamid.HBgMOTcyNTQ5OTE3MzcyFQIAEhgWM0VCMDUwODA3Qjk3N0JBOTg3MEUzNQA=): "תחזיר את האתר לאיך שהיה עם הצבעים (את כל הירוק תחזיר ללבן)" — rollback of the homepage green-text change.
- Change: removed the home-green-text class from index.html body and deleted the appended v123-v127 override blocks from css/style.css. Verified byte-identical to v122 except ?v= refs. Colors are exactly the pre-change state (story text keeps its original approved green, nav pill green with white label, section titles blue again).
- Executor: Avraham's side (this Instinct).

## v129 (26.10, midnight)
- Source: owner WhatsApp 26.10 00:10:36 + 00:10:40 (wamid...NUUxRTU4OUYxRQA, wamid...N0NEQUJGRjJBQwA): "משום מה ביטלת את הגלילה המהירה בעת לחיצה על שורת הטאבים" / "תחזיר דחוף".
- Root cause: v118 had replaced the fast custom eased scroller (~620ms easeInOutCubic) with a single native CSS-smooth scroll; from the owner's device that reads as "fast scroll cancelled".
- Change (js/main.js only): restored the fast rAF-stepped easeInOutCubic glide (dur = min(620, max(260, dist*0.22))), kept behavior:'instant' steps (24.10 retarget-fight lesson), added an in-flight cancellation token (new gesture cancels the old animation - the other teleport source), kept prefers-reduced-motion instant path and all v118 busyness mitigations (offscreen video pause, idle prefetch).
- Executor: Avraham's side (this Instinct).

## v130 (26.10, midnight)
- Source 1: owner WhatsApp 26.10 00:12:21 (wamid.HBgMOTcyNTQ5OTE3MzcyFQIAEhgWM0VCMEY0NTdDMkVGMjc3NTY3NTBBNgA=): "תסיר את התמונה ברקע של החלון תרומה" - remove the background photo behind the donation window.
- Change 1: donate.html - deleted the .dn-bgwrap::before rule (the side-3.jpg photo layer behind the donation hero through the back strip). Asset file assets/gallery/side-3.jpg NOT deleted; still used elsewhere. The wrap keeps its plain #f4f7f8 background.
- Source 2: owner WhatsApp 26.10 00:12:46 + voice 00:13:19 "כן כן" (wamid.HBgMOTcyNTQ5OTE3MzcyFQIAEhgUM0EyQjQ2NTdDOEU2N0QwRURDNjcA) confirming main's clarifier - restore the 3 payment windows (JGive / PayBox / Bit) opening when a donation route is clicked.
- Finding 2: the picker was never removed in code - donate.html still binds every [data-dn] medal to open #dnPayOverlay with the three provider links (destinations unchanged). Verified working on the live site with real pointer clicks, desktop and mobile (title follows the clicked route). No code change required; the ?v=130 refs ship a fully fresh page+assets to cached browsers.
- No amounts or payment settings changed.
- Executor: Avraham's side (this Instinct).

## v131 (26.10, midnight)
- Source: owner WhatsApp 26.10 00:25:43 (wamid.HBgMOTcyNTQ5OTE3MzcyFQIAEhgWM0VCMDdFODA0RDQ2RTlGRkJDQjdBNgA=): remove the separate donation page; clicking the donation button opens the mini window with the 3 payment options; the tab-bar donation link fast-scrolls to the donation section on the homepage.
- Change: donate.html page content removed and replaced with a redirect stub to ./index.html#donate (old shared links keep working). The 3-provider payment overlay (JGive / PayBox / Bit, destinations unchanged, no amounts) moved into index.html and opens from the "תרמו עכשיו" button. index nav + footer donation links now anchor to #donate (nav click uses the fast eased scroller; #donate offset already existed in AHScrollToId). All donation links on lessons/gallery/quotes/lesson/program pages retargeted to index.html#donate; programs/donate.html stub retargeted too.
- Wording consequence: the donate-section note "לחיצה תעביר אתכם לדף התרומות של בית המדרש" was false after the page removal, minimally updated to "לחיצה תפתח את אפשרויות התשלום לתרומה" (flagged to owner via main).
- Executor: Avraham's side (this Instinct).

## v132 (26.10, midnight)
- Source: same owner request as v131 (00:25:43) - the nav donation click must actually LAND at the homepage donation section after the fast scroll.
- Problem found in verification: first nav tap glided toward the click-time target, but lazy images/iframes below the fold load and claim height as the glide passes, so the page grows mid-animation and the scroll settled thousands of px short (donate is the last section).
- Fix (js/main.js AHScrollToId): after the glide ends (~780ms), recompute the target from the live layout and run ONE corrective re-glide when the landing is off by more than 150px; skipped if a newer gesture took over (token). No continuous retargeting (24.10 lesson). Applies to all section anchors.
- Executor: Avraham's side (this Instinct).
