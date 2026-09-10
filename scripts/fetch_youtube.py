import json
import html
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

TAGS = ["#리센느", "#원이", "#미나미", "#리브", "#메이", "#제나"]
GROUP_QUERY = "#리센느|#RESCENE|리센느|RESCENE"
EXCLUDED_HASHTAGS = ("#리니지",)
DATA_PATH = Path(__file__).resolve().parents[1] / "dist" / "data.json"
API_ROOT = "https://www.googleapis.com/youtube/v3"

def api_get(endpoint, params):
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    url = f"{API_ROOT}/{endpoint}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)

def parse_duration(value):
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", value or "")
    if not match:
        return 0
    hours, minutes, seconds = (int(part or 0) for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds

def is_excluded(snippet):
    searchable = html.unescape(
        f"{snippet.get('title', '')} {snippet.get('description', '')}"
    ).casefold()
    return any(hashtag.casefold() in searchable for hashtag in EXCLUDED_HASHTAGS)

def load_existing():
    if not DATA_PATH.exists():
        return {"updatedAt": None, "videos": []}
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))

def main():
    existing = load_existing()
    now = datetime.now(timezone.utc)
    if existing.get("updatedAt"):
        start = datetime.fromisoformat(existing["updatedAt"].replace("Z", "+00:00")) - timedelta(minutes=10)
    else:
        start = now - timedelta(days=7)

    found = {}
    for tag in TAGS:
        query = GROUP_QUERY if tag == "#리센느" else tag
        result = api_get("search", {
            "part": "snippet", "q": query, "type": "video", "order": "date",
            "publishedAfter": start.isoformat().replace("+00:00", "Z"), "maxResults": 25,
            "regionCode": "KR", "relevanceLanguage": "ko"
        })
        for item in result.get("items", []):
            if is_excluded(item["snippet"]):
                continue
            video_id = item["id"]["videoId"]
            found.setdefault(video_id, {"snippet": item["snippet"], "tags": []})["tags"].append(tag)

    ids = list(found)
    details = {}
    for offset in range(0, len(ids), 50):
        batch = api_get("videos", {"part": "contentDetails", "id": ",".join(ids[offset:offset+50])})
        details.update({item["id"]: item for item in batch.get("items", [])})

    by_id = {
        video["id"]: video
        for video in existing.get("videos", [])
        if not any(hashtag.casefold() in html.unescape(video.get("title", "")).casefold()
                   for hashtag in EXCLUDED_HASHTAGS)
    }
    for video_id, value in found.items():
        snippet = value["snippet"]
        seconds = parse_duration(details.get(video_id, {}).get("contentDetails", {}).get("duration"))
        by_id[video_id] = {
            "id": video_id,
            "title": html.unescape(snippet["title"]),
            "channelTitle": html.unescape(snippet["channelTitle"]),
            "publishedAt": snippet["publishedAt"],
            "thumbnail": snippet["thumbnails"].get("high", snippet["thumbnails"]["default"])["url"],
            "durationSeconds": seconds,
            "format": "short" if seconds <= 180 else "long",
            "tags": sorted(set(value["tags"]))
        }

    cutoff = now - timedelta(days=60)
    videos = [v for v in by_id.values() if datetime.fromisoformat(v["publishedAt"].replace("Z", "+00:00")) >= cutoff]
    videos.sort(key=lambda item: item["publishedAt"], reverse=True)
    DATA_PATH.write_text(json.dumps({"updatedAt": now.isoformat().replace("+00:00", "Z"), "videos": videos[:200]}, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
