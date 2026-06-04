import feedparser

url = "https://news.google.com/rss/search?q=Artificial+Intelligence+OR+GPUs+OR+LLMs+when:1d&hl=en-US&gl=US&ceid=US:en"
feed = feedparser.parse(url)
print(f"Found {len(feed.entries)} entries.")
for entry in feed.entries[:5]:
    print(entry.title)
