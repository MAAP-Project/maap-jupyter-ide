from http.server import HTTPServer
from webbrowser import open_new
from maap.utils.HTTPServerHandler import HTTPServerHandler

REDIRECT_URL = 'http://localhost:8080/'
PORT = 8080


# Command-line SSO work in progress
# Known issues:
# 1) browser window is spawned during execution; investigating running chrome in headless mode
# 2) credentials are required as input on initial authentication;
#    investigating CAS python libraries to avoid this concern.
class TokenHandler:
    """
    Functions used to handle Earthdata oAuth
    """
    def __init__(self, a_id):
        self._id = a_id

    def get_access_token(self):
        """
         Fetches the access key using an HTTP server to handle oAuth
         requests
            Args:
                appId:      The URS assigned App ID
        """

        access_uri = ('https://uat.urs.earthdata.nasa.gov/oauth/'
                      + 'authorize?client_id=' + self._id + '&redirect_uri='
                      + REDIRECT_URL + "&response_type=code")

        open_new(access_uri)
        http_server = HTTPServer(
                ('localhost', PORT),
                lambda request, address, server: HTTPServerHandler(
                    request, address, server, self._id))
        http_server.handle_request()
        return http_server.access_token