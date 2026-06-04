from youtubesearchpython import VideosSearch

try:
    videosSearch = VideosSearch('AI hardware news', limit = 5)
    result = videosSearch.result()
    for video in result.get('result', []):
        print(video['id'], video['title'])
except Exception as e:
    print(f"Error: {e}")
