from http.server import BaseHTTPRequestHandler
import requests
import json

REDIRECT_URL = 'http://localhost:8080/'


class HTTPServerHandler(BaseHTTPRequestHandler):

    """
    HTTP Server callbacks to handle Earthdata OAuth redirects
    """
    def __init__(self, request, address, server, a_id):
        self.app_id = a_id
        super().__init__(request, address, server)

    def do_GET(self):

        EARTHDATA_API_AUTH_URI = 'https://uat.urs.earthdata.nasa.gov/oauth/token'

        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        if 'code' in self.path:
            self.auth_code = self.path.split('=')[1]
            self.wfile.write(bytes('<html><h1>You may now close this window. </h1></html>', 'utf-8'))
            self.server.access_token = self.get_access_token_from_url(
                EARTHDATA_API_AUTH_URI, self.auth_code)

    def get_access_token_from_url(self, url, code):
        """
        Parse the access token from Earthdata's response
        Args:
            url: the Earthdata api oauth URI containing valid client_id
            code: Earthdata auth_code argument
        Returns:
            a string containing the access key
        """

        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URL
        }

        r = requests.post(url, data=body, auth=('MAAP', 'Icbinb1!'))

        if r.status_code == 401:
            return "unauthorized"
        else:
            j = json.loads(r.text)
            return j['access_token']

    # Disable logging from the HTTP Server
    def log_message(self, format, *args):
        return