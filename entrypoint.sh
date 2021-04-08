#!/bin/bash 

# A more robust method of constructing the workspace url prefix
get_workspace_url_prefix() {
	python - <<END
import os
import requests
import json
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

namespace = "$1" # 
svc_host = os.environ.get('KUBERNETES_SERVICE_HOST')
svc_host_https_port = os.environ.get('KUBERNETES_SERVICE_PORT_HTTPS')
che_workspace_id = os.environ.get('CHE_WORKSPACE_ID')
che_machine_name = os.environ.get('CHE_MACHINE_NAME').lower().replace('/', '-')

with open ("/var/run/secrets/kubernetes.io/serviceaccount/token", "r") as t:
    token=t.read()

headers = {
    'Authorization': 'Bearer ' + token,
}

request_string = 'https://' + svc_host + ':' + svc_host_https_port + '/api/v1/namespaces/' + namespace +  '/endpoints/'
response = requests.get(request_string, headers=headers, verify=False)
data = response.json()

endpoints = data['items']
for endpoint in endpoints:
    if che_machine_name in endpoint['metadata']['name']:
        if che_workspace_id == endpoint['metadata']['labels']['che.workspace_id']:
            print("/%s/%s" % (endpoint['metadata']['name'], endpoint['subsets'][0]['ports'][0]['name']))
            break
END
}

PREVIEW_URL=$(get_workspace_url_prefix "$CHE_WORKSPACE_NAMESPACE-che") # Che 7 configuration where the (actual) namespace is "<username>-che"
if test -z "$PREVIEW_URL" 
then
    PREVIEW_URL=$(get_workspace_url_prefix "$CHE_WORKSPACE_ID") # Che 6 configuration fallback where the default namespace is the workspace id
fi

# Fix Jupyterlab for Che in `single-host` mode. In `single-host` mode, Che uses URL path prefixes
# to distinguish workspaces. So for example, `https://<host>/work/space/path/<jupyter endpoints>`. 
# Because of this, we need to set Jupyter's `base_url` to `/work/space/path` so that all hrefs
# and links to files have the correct path prefix. HOWEVER, when the browser accesses those paths,
# the ingress/nginx proxy strips out the `base_url`! Even if the browser makes a request to `/work/space/path/lab`,
# Jupyter's web server, Tornado, only see a request for `/lab`. Tornado routes calls to the correct handler by
# matching the path against a known regular expression. Because `base_url` is configured to `/work/space/path`,
# Tornado only handles requests that have that path prefix, causing calls such as `/lab` to fail. The fix below
# allows `base_url` to be set so that HTTP *responses* include the `base_url` so that browsers make the correct
# call. However, it strips out `base_url` when listening for *requests* so that handles the ingress/nginx proxy
# requests correctly.
export NOTEBOOKLIBPATH=`find /opt/conda/lib/ -maxdepth 3 -type d -name "notebook"`
export JUPYTERSERVERLIBPATH=`find /opt/conda/lib -maxdepth 3 -type d -name "jupyter_server"`

read -r -d '' JUPYTER_PATCH << EOM
    # Fix for Tornado's inability to handle proxy requests
    from tornado.routing import _RuleList
    def fix_handlers(self, handlers: _RuleList, base_url: str):
        for i in range(len(handlers)):
            l = list(handlers[i])
            l[0] = l[0].replace(base_url.rstrip('/'), '')
            handlers[i] = tuple(l)
        return handlers

    def add_handlers(self, host_pattern: str, host_handlers: _RuleList) -> None:
        super().add_handlers(host_pattern, self.fix_handlers(host_handlers, self.settings['base_url']))
EOM

if [[ -f "$JUPYTERSERVERLIBPATH/serverapp.py" ]]; then
    perl -pi -e "s|(.*)\(web.Application\):|\$1\(web.Application\):\n$JUPYTER_PATCH|g" "$JUPYTERSERVERLIBPATH/serverapp.py"
    perl -pi -e 's|(.*)__init__\(handlers(.*)|$1__init__\(self.fix_handlers\(handlers, base_url\)$2|g' "$JUPYTERSERVERLIBPATH/serverapp.py"
fi

if [[ -f "$NOTEBOOKLIBPATH/notebookapp.py" ]]; then
    perl -pi -e "s|(.*)\(web.Application\):|\$1\(web.Application\):\n$JUPYTER_PATCH|g" "$NOTEBOOKLIBPATH/notebookapp.py"
    perl -pi -e 's|(.*)__init__\(handlers(.*)|$1__init__\(self.fix_handlers\(handlers, base_url\)$2|g' "$NOTEBOOKLIBPATH/notebookapp.py"
fi

# Dump all env variables into file so they exist still though SSH
env | grep _ >> /etc/environment

# Add conda bin to path
export PATH=$PATH:/opt/conda/bin
cp /root/.bashrc ~/.bash_profile

# Need to fix directory permissions for publickey authentication
chmod 700 /projects
mkdir -p /projects/.ssh/
chmod 700 /projects/.ssh/
service ssh start

VERSION=$(jupyter lab --version)
if [[ $VERSION > '2' ]] && [[ $VERSION < '3' ]]; then
    jupyter lab --ip=0.0.0.0 --port=3100 --allow-root --NotebookApp.token='' --NotebookApp.base_url=$PREVIEW_URL --no-browser --debug
elif [[ $VERSION > '3' ]] && [[ $VERSION < '4' ]]; then
    jupyter lab --ip=0.0.0.0 --port=3100 --allow-root --ServerApp.token='' --ServerApp.base_url=$PREVIEW_URL --no-browser --debug
else
    echo "Error!"
fi
