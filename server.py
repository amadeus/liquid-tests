import SimpleHTTPServer
import SocketServer

PORT = 8888


class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return


httpd = SocketServer.TCPServer(("", PORT), MyHandler)

print 'Serving at localhost:' + str(PORT)
httpd.serve_forever()
