import http.server
import socketserver
import webbrowser

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

class MyTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

print(f"Starting server on port {PORT}...")
print(f"To view the knowledge graph, open: http://localhost:{PORT}")

with MyTCPServer(("", PORT), Handler) as httpd:
    # Open browser automatically
    webbrowser.open(f"http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
