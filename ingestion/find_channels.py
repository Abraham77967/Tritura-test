import urllib.request
import re

urls = [
    ("All-In", "https://www.youtube.com/@theallinpod")
]

for name, url in urls:
    html = urllib.request.urlopen(url).read().decode()
    match = re.search(r'https://www\.youtube\.com/feeds/videos\.xml\?channel_id=([^"]+)', html)
    print(f"{name}: {match.group(1) if match else 'Not found'}")
