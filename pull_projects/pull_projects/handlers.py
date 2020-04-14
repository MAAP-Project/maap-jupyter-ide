import os.path
import sys
from notebook.base.handlers import IPythonHandler

import os
import glob
from pathlib import Path
import requests
import json
from git import Repo
import shutil
import urllib

<<<<<<< HEAD
GITLAB_REPO = "mas.maap-project.org"
=======
# set base url based on ops/dev environment
GITLAB_REPO = "repo.nasa.maap.xyz"
if 'ENVIRONMENT' in os.environ.keys() and os.environ['ENVIRONMENT'] == 'OPS':
    GITLAB_REPO = "mas.maap-project.org"

CHE_BASE_URL = "https://che-k8s.maap.xyz"
if 'ENVIRONMENT' in os.environ.keys() and os.environ['ENVIRONMENT'] == 'OPS':
    CHE_BASE_URL = "https://ade.maap-project.org"

>>>>>>> c188692... set base url for extension requests based on ops/dev environment

# Set selected ADE Docker Image 
class ListProjectsHandler(IPythonHandler):
    def get(self):
        # 'https://ade.maap-project.org/api/workspace/workspacetn41o4yl4a7kxclz'
        workspace_id = os.environ['CHE_WORKSPACE_ID']
        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
<<<<<<< HEAD
        url = 'https://ade.maap-project.org/api/workspace/{workspace_id}'.format(workspace_id=workspace_id)
=======
        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=CHE_BASE_URL,workspace_id=workspace_id)
>>>>>>> c188692... set base url for extension requests based on ops/dev environment
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
            result = ''

            for project in projects:
                project_name = project['name']
                location = project['source']['location']
                src_type = project['source']['type']
                result += 'name: {project_name}, \rsource: {src_type}, \rfrom {location}'.format(project_name=project_name, src_type=src_type, location=location)
                result += '\r\r'

            self.finish({"status_code": r.status_code, "result": result, "json_object":projects})
        except:
            self.finish({"status_code": r.status_code, "result": r.reason})

class ListFilesHandler(IPythonHandler):
    def get(self):
        # 'https://ade.maap-project.org/api/workspace/workspacetn41o4yl4a7kxclz'
        workspace_id = os.environ['CHE_WORKSPACE_ID']
        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
<<<<<<< HEAD
        url = 'https://ade.maap-project.org/api/workspace/{workspace_id}'.format(workspace_id=workspace_id)
=======
        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=CHE_BASE_URL,workspace_id=workspace_id)
>>>>>>> c188692... set base url for extension requests based on ops/dev environment
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
            files = []
            for p in projects:
                print(p['path'])
                path = '/projects/'+p['path']
                for fname in Path(path).glob('**/*.*py*'):
                    fname = str(fname)
                    l = len('/projects/')
                    fname = fname[l:]
                    # filter out ipynb checkpoints and py duplicates of ipynb
                    if not fname.replace('.py','.ipynb') in files and not '/.ipynb_checkpoints' in fname:
                        files.append(fname)

            self.finish({"status_code": r.status_code, "project_files":files, "response": r.text})
        except:
            self.finish({"status_code": r.status_code, "result": r.reason, "response": r.text})

class GetProjectHandler(IPythonHandler):
    def get(self, project_name=None, location=None, src_type=None):
        # ws_agent_port = 3100
        # project_name = "jupyterlab-logout"
        # import_type = 'git'                                         # can be 'git' | 'svn' | 'zip'
        # location = 'https://github.com/zgqallen/jupyterlab-logout'  # location where project can be downloaded from
                
        # che_machine_token = os.environ['CHE_MACHINE_TOKEN'] 
        # headers = {
        #     'Accept':'application/json',
        #     'Authorization':'Bearer {token}'.format(token=che_machine_token)
        # }
        # url = "http://localhost:{ws_agent_port}/wsagent/ext/project/import/{project_name}".format(ws_agent_port=str(ws_agent_port), project_name=project_name)
        # r = requests.post(url,headers=headers,data = {"location":"{location}".format(location=location), "type":"{import_type}".format(import_type=import_type)}, verify=False)

        try:
            # if called from the url
            if project_name == None and location == None and src_type == None:
                project_name = self.get_argument('project_name', '')
                location = self.get_argument('location', '')
                src_type = self.get_argument('src_type', '')

            dl_loc = '/projects/'+project_name

            if src_type == 'git':
                Repo.clone_from(location,dl_loc)
            elif src_type == 'zip':
                with urllib.urlopen(location) as response, open(dl_loc, 'w+') as out_file:
                    shutil.copyfileobj(response, out_file)
            self.finish({"message": "project import done"})

        except:
            self.finish({"message": "project import failed"})
            
class GetAllProjectsHandler(IPythonHandler):
    def get(self):
        # --------------------------------------------------
        # get list of projects      
        # --------------------------------------------------
        workspace_id = os.environ['CHE_WORKSPACE_ID']
        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
<<<<<<< HEAD
        url = 'https://ade.maap-project.org/api/workspace/{workspace_id}'.format(workspace_id=workspace_id)
=======
        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=CHE_BASE_URL,workspace_id=workspace_id)
>>>>>>> c188692... set base url for extension requests based on ops/dev environment
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
            project_list = resp['config']['projects']   # gets list of projects, each is dict with project properties

            # get projects
            for project in project_list:

                project_name = project['name']
                path = project['path']
                src_type = project['source']['type']
                location = project['source']['location']

                dl_loc = '/projects/'+project_name

                if src_type == 'git':
                    if not os.path.exists('/projects'+path):

                        # Check if is stored on our gitlab (repo.nasa.maap.xyz) if so, use the users authentication
                        # token to allow for the downloads of private repositories
                        if GITLAB_REPO in location:

                            # If it is, get the authentication token and add to the location path
                            gitlab_token = self.get_argument('gitlab_token', '')
                            if gitlab_token == '':
                                self.finish({"status": "project import failed. no gitlab token"})

                            repo_path_on_gitlab = location.split(GITLAB_REPO)[-1]
                            location = "https://oauth2:" + gitlab_token + "@" + GITLAB_REPO + repo_path_on_gitlab

                        Repo.clone_from(location,dl_loc)
                elif src_type == 'zip':
                    with urllib.urlopen(location) as response, open(dl_loc+'.zip', 'w+') as out_file:
                        shutil.copyfileobj(response, out_file)

            # return when done
            self.finish({"status": "done importing projects"})

        except:
            self.finish({"status": "project import failed"})

# class PutProjectHandler(IPythonHandler):
#     def put(self,project_name, location, src_type):
#         # add the project in jupyter
#         dl_loc = '/projects/'+project_name
#         if src_type == 'git':
#             Repo.clone_from(location,dl_loc)
#         elif src_type == 'zip':
#             with urllib.urlopen(location) as response, open(dl_loc+'.zip', 'w+') as out_file:
#                 shutil.copyfileobj(response, out_file)
        
#         # do something with workspace tracking

# class DeleteProjectHandler(IPythonHandler):
