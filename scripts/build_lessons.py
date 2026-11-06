#!/usr/bin/env python3
"""Build data/lessons.json for the virtual midrash.
Sources: YouTube channel RSS + channel page ytInitialData (catalog), watch pages (details
when reachable), Spotify show embed (latest episode, both-platforms verification map)."""
import json, re, sys, time, html, urllib.request, datetime, os

CH_ID = "UCFkN6V5jTallY0UPD0Z4qMA"
SHOW_ID = "6t4UTEzvBWhBWbpb82krkd"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace")

def balanced(s, start):
    depth, i = 0, start
    instr = False
    while i < len(s):
        c = s[i]
        if instr:
            if c == '\\': i += 1
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0: return s[start:i+1]
        i += 1
    return None

def norm(t):
    t = html.unescape(t)
    t = t.replace('״','"').replace('׳',"'").replace('”','"').replace('“','"').replace('’',"'")
    return re.sub(r'\s+', ' ', t).strip().strip('"').lower()

def hebrew_date(dt):
    try:
        j = json.loads(get(f"https://www.hebcal.com/converter?cfg=json&gy={dt.year}&gm={dt.month}&gd={dt.day}&g2h=1"))
        return j.get("hebrew", "")
    except Exception as e:
        print("hebcal err", e); return ""

# --- 06.11: helpers for the channel-page fallback -------------------------------
# Why: the channel RSS feed started returning a hard 404 (verified 22.10 OK -> 25.10 404,
# still 404), and watch pages served to datacenter IPs are a bot-variant
# (playabilityStatus LOGIN_REQUIRED) with no publish date, so new lessons were skipped.
# The channel /videos page still renders fully there, including ytInitialData with
# lockupViewModel entries (YouTube's current grid renderer) carrying title, relative
# publish text and duration badges. We now harvest that page properly.

def parse_initial_data(page):
    m = re.search(r'ytInitialData\s*=\s*', page)
    if not m: return None
    s = page.find('{', m.end() - 1)
    raw = balanced(page, s)
    if not raw: return None
    try: return json.loads(raw)
    except Exception: return None

def _dur_from_text(txt):
    p = [int(x) for x in txt.split(':') if x.isdigit()]
    if not p: return 0
    return p[-1] + 60 * (p[-2] if len(p) > 1 else 0) + 3600 * (p[0] if len(p) > 2 else 0)

def channel_videos(page):
    """{videoId: {'title','rel','dur'}} from the channel /videos page."""
    out = {}
    d = parse_initial_data(page)
    if d:
        def walk(o):
            if isinstance(o, dict):
                lv = o.get('lockupViewModel')
                if isinstance(lv, dict) and re.fullmatch(r'[A-Za-z0-9_-]{11}', str(lv.get('contentId', ''))):
                    vid = lv['contentId']
                    md = lv.get('metadata', {}).get('lockupMetadataViewModel', {})
                    title = md.get('title', {}).get('content', '')
                    rel = ''
                    for row in md.get('metadata', {}).get('contentMetadataViewModel', {}).get('metadataRows', []):
                        for part in row.get('metadataParts', []):
                            txt = part.get('text', {}).get('content', '')
                            if re.search(r'\bago\b|לפני', txt): rel = txt
                    out.setdefault(vid, {'title': title, 'rel': rel, 'dur': 0})
                vr = o.get('videoRenderer') or o.get('gridVideoRenderer')
                if isinstance(vr, dict) and vr.get('videoId'):
                    vid = vr['videoId']
                    title = ''.join(r.get('text', '') for r in vr.get('title', {}).get('runs', [])) or vr.get('title', {}).get('simpleText', '')
                    rel = vr.get('publishedTimeText', {}).get('simpleText', '')
                    dur = _dur_from_text(vr.get('lengthText', {}).get('simpleText', ''))
                    out.setdefault(vid, {'title': title, 'rel': rel, 'dur': dur})
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(d)
    # duration badges live outside the lockup metadata, keyed by the video id
    for bm in re.finditer(r'"thumbnailBadgeViewModel":\{"text":"(\d+:\d+(?::\d+)?)"[^}]*?"animationActivationTargetId":"([A-Za-z0-9_-]{11})"', page):
        dur, vid = _dur_from_text(bm.group(1)), bm.group(2)
        if vid in out and dur: out[vid]['dur'] = dur
    return out

try:
    from zoneinfo import ZoneInfo
    IL_TZ = ZoneInfo("Asia/Jerusalem")
except Exception:  # runner without tzdata: Israel standard time as fallback
    IL_TZ = datetime.timezone(datetime.timedelta(hours=2))

def resolve_rel_date(rel, now):
    """Resolve YouTube's own relative publish text ('12h ago', '2w ago', 'לפני יומיים')
    to a representative instant - but ONLY when the whole rounding interval maps to a
    single civil date in Asia/Jerusalem, the convention hebrew_date() then displays.
    YouTube rounds the relative text (observed: 12h24m elapsed shown as '12h ago'), so
    the true publish time sits somewhere in an interval; if that interval touches a day
    boundary we return None and the caller skips honestly instead of guessing a date.
    Approximation of YouTube's data, never an invented date."""
    n, unit = None, None
    m = re.search(r'(\d+)\s*(sec|min|mo|h|d|w|y)\s*ago', rel)
    if m:
        n = int(m.group(1))
        unit = {'sec': 'seconds', 'min': 'minutes', 'h': 'hours', 'd': 'days', 'w': 'weeks', 'mo': 'months', 'y': 'years'}[m.group(2)]
    else:
        m = re.search(r'(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago', rel)
        if m:
            n = int(m.group(1))
            unit = m.group(2) + 's'
        else:
            m = re.search(r'לפני\s+(?:(\d+)\s+)?(שעה|שעות|שע׳|דקה|דקות|דק׳|יום|יומיים|ימים|שבוע|שבועיים|שבועות|חודש|חודשיים|שנה|שנתיים)', rel)
            if not m: return None
            n = int(m.group(1)) if m.group(1) else 1
            w = m.group(2)
            if w in ('יומיים', 'שבועיים', 'חודשיים', 'שנתיים'): n = 2
            unit = {'דקה': 'minutes', 'דקות': 'minutes', 'דק׳': 'minutes', 'שע׳': 'hours', 'שעה': 'hours', 'שעות': 'hours',
                    'יום': 'days', 'ימים': 'days', 'יומיים': 'days',
                    'שבוע': 'weeks', 'שבועות': 'weeks', 'שבועיים': 'weeks',
                    'חודש': 'months', 'חודשיים': 'months', 'שנה': 'years', 'שנתיים': 'years'}[w]
    # conservative elapsed interval [lo, hi] behind "n <unit> ago": half a unit below
    # n (round-to-nearest) through one full unit above (floor behavior)
    sec = {'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400, 'weeks': 604800}
    if unit == 'months':
        lo_s, hi_s = 28 * n * 86400.0, 31 * (n + 1) * 86400.0
    elif unit == 'years':
        lo_s, hi_s = 365 * n * 86400.0, 366 * (n + 1) * 86400.0
    else:
        s = sec[unit]; lo_s, hi_s = max(0.0, (n - 0.5) * s), (n + 1) * s
    earliest = now - datetime.timedelta(seconds=hi_s)
    latest = now - datetime.timedelta(seconds=lo_s)
    if earliest.astimezone(IL_TZ).date() != latest.astimezone(IL_TZ).date():
        return None
    mid = now - datetime.timedelta(seconds=(lo_s + hi_s) / 2)
    return mid.astimezone(IL_TZ)

def main():
    rss = None
    for attempt in range(3):
        try:
            rss = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={CH_ID}")
            break
        except Exception as e:
            print(f"rss attempt {attempt+1} err:", e)
            time.sleep(2 * (attempt + 1))
    # 06.11: vids entries are dicts {vid,title,pub,rel,dur}; rel/dur are channel-page
    # fallbacks used only when the watch page is unreachable/bot-walled.
    vids = []
    if rss is not None:
        try:
            entries = re.findall(r'<entry>(.*?)</entry>', rss, re.S)
            for e in entries:
                vid = re.search(r'<yt:videoId>(.*?)</yt:videoId>', e).group(1)
                title = html.unescape(re.search(r'<title>(.*?)</title>', e).group(1))
                pub = re.search(r'<published>(.*?)</published>', e).group(1)
                vids.append({'vid': vid, 'title': title, 'pub': pub, 'rel': '', 'dur': 0})
            print("rss videos:", len(vids))
        except Exception as e:
            print("rss parse err, falling back to channel page:", e)
            vids = []
    if not vids:
        if rss is None:
            print("rss err, falling back to channel page: rss unavailable after retries")
        ch = get("https://www.youtube.com/@%D7%A2%D7%9C%D7%94_%D7%94%D7%93%D7%A1/videos?hl=en")
        meta = channel_videos(ch)
        for vid, m in meta.items():
            vids.append({'vid': vid, 'title': m['title'], 'pub': '', 'rel': m['rel'], 'dur': m['dur']})
        print("channel-page videos:", len(vids))
        if not vids:
            # last resort: bare id scrape, no titles (kept from the pre-06.11 script)
            seen = set()
            for vid in dict.fromkeys(re.findall(r'watch\?v=([A-Za-z0-9_-]{11})', ch)):
                seen.add(vid); vids.append({'vid': vid, 'title': '', 'pub': '', 'rel': '', 'dur': 0})
            print("channel-page regex-only videos:", len(vids))

    # Spotify latest episode -> update verification map
    map_path = os.path.join(ROOT, "data", "spotify-map.json")
    smap = {}
    if os.path.exists(map_path):
        smap = json.load(open(map_path, encoding="utf-8"))
    try:
        sp = get(f"https://open.spotify.com/embed/show/{SHOW_ID}")
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', sp, re.S)
        ent = json.loads(m.group(1))["props"]["pageProps"]["state"]["data"]["entity"]
        sp_name, sp_id = norm(ent["name"]), ent["id"]
        print("spotify latest:", sp_name)
        for v in vids:
            nt = norm(v['title'])
            if nt and (nt in sp_name or sp_name in nt):
                if smap.get(v['vid']) != sp_id:
                    smap[v['vid']] = sp_id; print("mapped:", v['vid'], "->", sp_id)
    except Exception as e:
        print("spotify err", e)
    json.dump(smap, open(map_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # carry over archive.org audio URLs from the existing file (script rebuilds
    # from scratch and must not wipe the manually wired audio player sources)
    prev_path = os.path.join(ROOT, "data", "lessons.json")
    prev_audio, prev_lessons = {}, {}
    if os.path.exists(prev_path):
        try:
            for l in json.load(open(prev_path, encoding="utf-8")).get("lessons", []):
                prev_lessons[l["id"]] = l
                if l.get("audioUrl"):
                    prev_audio[l["id"]] = l["audioUrl"]
        except Exception as e:
            print("prev lessons read err", e)

    lessons = []
    for v in vids:
        vid, title, pub = v['vid'], v['title'], v['pub']
        badge_dur = v.get('dur') or 0
        desc, dur = "", 0
        try:
            w = get(f"https://www.youtube.com/watch?v={vid}")
            i = w.find("ytInitialPlayerResponse")
            j = w.find('{', i) if i >= 0 else -1
            raw = balanced(w, j) if j >= 0 else None
            pr = json.loads(raw) if raw else {}
            vd = pr.get("videoDetails", {})
            if vd.get("videoId"):  # bot-variant pages carry no videoDetails - ignore them
                desc = vd.get("shortDescription", "")
                dur = int(vd.get("lengthSeconds", 0) or 0) or dur
                title = vd.get("title", title) or title
                mf = pr.get("microformat", {}).get("playerMicroformatRenderer", {})
                pub = mf.get("publishDate") or mf.get("uploadDate") or pub
        except Exception as e:
            print("watch err", vid, e)
        # 23.10: user - full lessons only, no promos/shorts.
        # Exclusions must be source-backed, never duration alone:
        #  a) explicit known IDs (promo + Short the user named);
        #  b) 'תדמית' in title = promo by naming;
        #  c) <=3min videos are checked against YouTube's own Shorts player
        #     (/shorts/<id> returns 200 only for real Shorts); short FULL
        #     lessons pass the check and stay in the list.
        EXCLUDE_IDS = {"Dqp7iOoyEQA", "mK85KXUHtSM", "66qw88EqjI8"}
        class _NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **k):
                return None
        _opener = urllib.request.build_opener(_NoRedirect)
        def is_short(v):
            try:
                req = urllib.request.Request(f"https://www.youtube.com/shorts/{v}", headers={"User-Agent": "Mozilla/5.0"})
                r = _opener.open(req, timeout=10)
                return r.status == 200
            except urllib.error.HTTPError as e:
                return False  # 3xx redirect = not a Short
            except Exception:
                return False  # undetermined -> keep the lesson, flagged in log
        if vid in EXCLUDE_IDS or 'תדמית' in title:
            print("skip promo (explicit):", vid, title); continue
        if dur and dur <= 180:
            if is_short(vid):
                print("skip short (verified via /shorts/):", vid, title, dur); continue
            else:
                print("KEEP short-duration full lesson (not a YouTube Short):", vid, title, dur)
        prev = prev_lessons.get(vid, {})
        if not pub:
            pub = prev.get("published", "")
        if not pub and v.get('rel'):
            # 06.11: new video, every exact source failed this run (RSS 404 + bot-variant
            # watch page). Derive a date from YouTube's own relative text ONLY when its
            # whole rounding interval lands on one Israel civil date; otherwise skip and
            # wait for an exact source. A later run with a reachable exact source (RSS or
            # watch page) replaces the derived value with the exact timestamp.
            approx = resolve_rel_date(v['rel'], datetime.datetime.now(datetime.timezone.utc))
            if approx:
                pub = approx.isoformat()
                print("date derived from channel-page relative time:", vid, v['rel'], "->", pub[:10])
            else:
                print("relative date ambiguous across a day boundary, not assigning:", vid, v['rel'])
        if not desc and prev.get("description"):
            desc = prev["description"]
        if not dur and prev.get("durationSec"):
            dur = prev["durationSec"]
        if not dur and badge_dur:
            dur = badge_dur  # 06.11: channel-page badge, rounded to the second display
        if not title and prev.get("title"):
            title = prev["title"]
        if not pub:
            # every date source failed this run: skip loudly, a later healthy run picks it
            # up - never crash, never invent a date
            print("SKIP (no publish date available):", vid, title); continue
        # rabbi/topic derived from the FINAL title (after prev-data carry-over)
        rabbi = ""
        seg = re.split(r'\|', title)[0].strip()
        if seg.startswith("הרב"):
            rabbi = seg
        else:
            m = re.search(r'הרב[ה"׳\s]+[א-ת]{2,}(?:\s+[א-ת]{2,}){1,2}', desc)
            if m: rabbi = m.group(0)
        parts = [p.strip() for p in re.split(r'\|', title)]
        topic = parts[1] if len(parts) > 1 else title
        series = "שיעור שבועי" if "פרשת" in title else ("מוצ״ש בבית מדרש")
        dt = datetime.datetime.fromisoformat(pub.replace("Z", "+00:00"))
        lessons.append({
            "id": vid, "title": title, "topic": topic, "rabbi": rabbi,
            "description": desc[:1200], "published": pub,
            "hebrewDate": hebrew_date(dt), "durationSec": dur,
            "series": series,
            "youtubeUrl": f"https://www.youtube.com/watch?v={vid}",
            "spotifyUrl": f"https://open.spotify.com/episode/{smap[vid]}" if vid in smap else None,
            "onSpotify": vid in smap,
            "thumbnail": f"https://i.ytimg.com/vi/{vid}/hq720.jpg",
        })
        if vid in prev_audio:
            lessons[-1]["audioUrl"] = prev_audio[vid]
        time.sleep(0.4)
    seen_ids = {l["id"] for l in lessons}
    for vid, pl in prev_lessons.items():
        if vid not in seen_ids:
            print("kept from previous data (not in this run's listing):", vid)
            lessons.append(pl)
    lessons.sort(key=lambda l: l["published"], reverse=True)
    if not lessons:
        print("FATAL: zero lessons parsed - refusing to write empty catalog")
        sys.exit(1)
    out = {"generated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "showSpotifyUrl": f"https://open.spotify.com/show/{SHOW_ID}",
           "channelUrl": f"https://www.youtube.com/channel/{CH_ID}",
           "lessons": lessons}
    json.dump(out, open(os.path.join(ROOT, "data", "lessons.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    both = sum(1 for l in lessons if l["onSpotify"])
    print(f"lessons: {len(lessons)}, on both platforms: {both}")

if __name__ == "__main__":
    main()
