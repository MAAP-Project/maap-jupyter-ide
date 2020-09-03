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

def maap_ade_url(request):
	return 'https://{}'.format(request.headers['Maap_ade_server'])

def maap_mas_server(request):
	return request.headers['Maap_mas_server']

# Set selected ADE Docker Image 
class ListProjectsHandler(IPythonHandler):
    def get(self):
        # 'https://ade.maap-project.org/api/workspace/workspacetn41o4yl4a7kxclz'
        workspace_id = os.environ['CHE_WORKSPACE_ID'] if 'CHE_WORKSPACE_ID' in os.environ else ''
        che_machine_token = os.environ['CHE_MACHINE_TOKEN'] if 'CHE_MACHINE_TOKEN' in os.environ else ''

        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=maap_ade_url(self.request),workspace_id=workspace_id)
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

class GetProjectHandler(IPythonHandler):
    def get(self, project_name=None, location=None, src_type=None):
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

        workspace_id = os.environ['CHE_WORKSPACE_ID'] if 'CHE_WORKSPACE_ID' in os.environ else ''
        che_machine_token = os.environ['CHE_MACHINE_TOKEN'] if 'CHE_MACHINE_TOKEN' in os.environ else ''

        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=maap_ade_url(self.request),workspace_id=workspace_id)
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
                        if maap_mas_server(self.request) in location:

                            # If it is, get the authentication token and add to the location path
                            gitlab_token = self.get_argument('gitlab_token', '')
                            if gitlab_token == '':
                                self.finish({"status": "project import failed. no gitlab token"})

                            repo_path_on_gitlab = location.split(maap_mas_server(self.request))[-1]
                            location = "https://oauth2:" + gitlab_token + "@" + maap_mas_server(self.request) + repo_path_on_gitlab

                        Repo.clone_from(location,dl_loc)
                elif src_type == 'zip':
                    with urllib.urlopen(location) as response, open(dl_loc+'.zip', 'w+') as out_file:
                        shutil.copyfileobj(response, out_file)

            # return when done
            self.finish({"status": "done importing projects"})

        except:
            self.finish({"status": "project import failed"})
