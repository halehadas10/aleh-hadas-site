#!/usr/bin/env python3
"""Build data/lessons.json for the virtual midrash.
Sources: YouTube channel RSS + watch pages (catalog), Spotify show embed (latest episode, both-platforms verification map)."""
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

def main():
    rss = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={CH_ID}")
    entries = re.findall(r'<entry>(.*?)</entry>', rss, re.S)
    vids = []
    for e in entries:
        vid = re.search(r'<yt:videoId>(.*?)</yt:videoId>', e).group(1)
        title = html.unescape(re.search(r'<title>(.*?)</title>', e).group(1))
        pub = re.search(r'<published>(.*?)</published>', e).group(1)
        vids.append((vid, title, pub))
    print("rss videos:", len(vids))

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
        for vid, title, pub in vids:
            nt = norm(title)
            if nt and (nt in sp_name or sp_name in nt):
                if smap.get(vid) != sp_id:
                    smap[vid] = sp_id; print("mapped:", vid, "->", sp_id)
    except Exception as e:
        print("spotify err", e)
    json.dump(smap, open(map_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    lessons = []
    for vid, title, pub in vids:
        # lessons only: shiurim, skip promos
        if ("הרב" not in title) and ("שיעור" not in title):
            print("skip (not a lesson):", title[:40]); continue
        desc, dur = "", 0
        try:
            w = get(f"https://www.youtube.com/watch?v={vid}")
            i = w.find("ytInitialPlayerResponse")
            j = w.find('{', i)
            pr = json.loads(balanced(w, j))
            vd = pr.get("videoDetails", {})
            desc = vd.get("shortDescription", "")
            dur = int(vd.get("lengthSeconds", 0) or 0)
            title = vd.get("title", title)
        except Exception as e:
            print("watch err", vid, e)
        # rabbi: first title segment when it starts with הרב, else from description
        rabbi = ""
        seg = re.split(r'\|', title)[0].strip()
        if seg.startswith("הרב"):
            rabbi = seg
        else:
            m = re.search(r'הרב[ה"׳\s]+[א-ת]{2,}(?:\s+[א-ת]{2,}){1,2}', desc)
            if m: rabbi = m.group(0)
        parts = [p.strip() for p in re.split(r'\|', title)]
        topic = parts[1] if len(parts) > 1 else title
        series = "שיעורי פרשת השבוע" if "פרשת" in title else ("מוצ״ש בבית המדרש")
        dt = datetime.datetime.fromisoformat(pub.replace("Z", "+00:00"))
        lessons.append({
            "id": vid, "title": title, "topic": topic, "rabbi": rabbi,
            "description": desc[:1200], "published": pub,
            "hebrewDate": hebrew_date(dt), "durationSec": dur,
            "series": series,
            "youtubeUrl": f"https://www.youtube.com/watch?v={vid}",
            "spotifyUrl": f"https://open.spotify.com/episode/{smap[vid]}" if vid in smap else None,
            "onSpotify": vid in smap,
            "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        })
        time.sleep(0.4)
    lessons.sort(key=lambda l: l["published"], reverse=True)
    out = {"generated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "showSpotifyUrl": f"https://open.spotify.com/show/{SHOW_ID}",
           "channelUrl": f"https://www.youtube.com/channel/{CH_ID}",
           "lessons": lessons}
    json.dump(out, open(os.path.join(ROOT, "data", "lessons.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    both = sum(1 for l in lessons if l["onSpotify"])
    print(f"lessons: {len(lessons)}, on both platforms: {both}")

if __name__ == "__main__":
    main()
