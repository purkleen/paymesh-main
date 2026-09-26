"""Local dev server for the prototype.

Like `python3 -m http.server`, but tells the browser not to cache, so edits to
the JS and CSS show up on a normal refresh instead of an old copy being reused.

    python3 serve.py          # http://localhost:4321
    python3 serve.py 4322     # another port
"""

import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
    http.server.ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
