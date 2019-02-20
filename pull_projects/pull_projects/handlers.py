import os.path
import sys
import nbformat
from notebook.base.handlers import IPythonHandler

import os
import requests
import json
from git import Repo
import shutil
import urllib

# Set selected ADE Docker Image 
class ListProjectsHandler(IPythonHandler):
    def get(self):
        # 'https://che-k8s.maap.xyz/api/workspace/workspacetn41o4yl4a7kxclz'
        workspace_id = os.environ['CHE_WORKSPACE_ID']
        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
        url = 'https://che-k8s.maap.xyz/api/workspace/{workspace_id}'.format(workspace_id=workspace_id)
        # --------------------------------------------------
        # TODO: FIGURE OUT AUTH KEY & verify
        # --------------------------------------------------
        headers = {
            'Accept':'application/json',
            'Authorization':'Bearer {token}'.format(token=che_machine_token)
        }
        r = requests.get(
            url, 
            headers=headers, 
            verify=False
        )

        try:
            resp = json.loads(r.text)               # JSON response to dict
            projects = resp['config']['projects']   # gets list of projects, each is dict with project properties

            self.finish(json.dumps(projects))
        except:
            self.finish({"status_code": r.status_code, "reason": r.reason})

class GetProjectHandler(IPythonHandler):
    def get(self, project_name, location, src_type):
        # ws_agent_port = 3100
        # project_name = "jupyterlab-logout"
        # import_type = 'git'                                         # can be 'git' | 'svn' | 'zip'
        # location = 'https://github.com/zgqallen/jupyterlab-logout'  # location where project can be downloaded from
                
        # che_machine_token = os.environ['CHE_MACHINE_TOKEN'] 
        # # --------------------------------------------------
        # # TODO: FIGURE OUT AUTH KEY & verify
        # # --------------------------------------------------
        # headers = {
        #     'Accept':'application/json',
        #     'Authorization':'Bearer {token}'.format(token=che_machine_token)
        # }
        # url = "http://localhost:{ws_agent_port}/wsagent/ext/project/import/{project_name}".format(ws_agent_port=str(ws_agent_port), project_name=project_name)
        # r = requests.post(url,headers=headers,data = {"location":"{location}".format(location=location), "type":"{import_type}".format(import_type=import_type)}, verify=False)
        dl_loc = '/projects/'+project_name
        
        try:
            if src_type == 'git':
                Repo.clone_from(location,dl_loc)
            elif src_type == 'zip':
                with urllib.urlopen(location) as response, open(dl_loc, 'w+') as out_file:
                    shutil.copyfileobj(response, out_file)
            self.finish({"message": "project import done"})
        except:
            self.finish({"message": "project import failed"})
            
class GetAllProjectsHandler(IPythonHandler):
    def __init__(self):
        self.getproject_handler = GetProjectHandler()

    def get(self,projects_json):
        projects_list = json.loads(projects_json)
        for project in projects_list:
            self.getproject_handler.get(project['name'],project['source']['location'],project['source']['type'])
        self.finish({"message": "done importing projects"})

