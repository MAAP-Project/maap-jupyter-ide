import os.path
import sys
from notebook.base.handlers import IPythonHandler
import functools
import os
import glob
from pathlib import Path
import requests
import json
from git import Repo
import shutil
import urllib

@functools.lru_cache(maxsize=128)
def get_maap_config(host):
    path_to_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..', 'maap_environments.json')

    with open(path_to_json) as f:
        data = json.load(f)

    match = next((x for x in data if host in x['ade_server']), None)
    maap_config = next((x for x in data if x['default_host'] == True), None) if match is None else match
    
    return maap_config

def maap_ade_url(host):
	return 'https://{}'.format(get_maap_config(host)['ade_server'])

def maap_mas_server(host):
	return get_maap_config(host)['mas_server']

# Set selected ADE Docker Image 
class ListProjectsHandler(IPythonHandler):
    def get(self):
        # 'https://ade.maap-project.org/api/workspace/workspacetn41o4yl4a7kxclz'
        workspace_id = os.environ['CHE_WORKSPACE_ID'] if 'CHE_WORKSPACE_ID' in os.environ else ''
        che_machine_token = os.environ['CHE_MACHINE_TOKEN'] if 'CHE_MACHINE_TOKEN' in os.environ else ''

        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=maap_ade_url(self.request.host),workspace_id=workspace_id)
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

        url = '{base_url}/api/workspace/{workspace_id}'.format(base_url=maap_ade_url(self.request.host),workspace_id=workspace_id)
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

                        # Check if is stored on our gitlab (e.g. mas.maap-project.org) if so, use the users authentication
                        # token to allow for the downloads of private repositories
                        if maap_mas_server(self.request.host) in location:

                            # If it is, get the authentication token and add to the location path
                            gitlab_token = self.get_argument('gitlab_token', '')
                            if gitlab_token == '':
                                self.finish({"status": "project import failed. no gitlab token"})

                            repo_path_on_gitlab = location.split(maap_mas_server(self.request.host))[-1]
                            location = "https://oauth2:" + gitlab_token + "@" + maap_mas_server(self.request.host) + repo_path_on_gitlab

                        Repo.clone_from(location,dl_loc)
                elif src_type == 'zip':
                    with urllib.urlopen(location) as response, open(dl_loc+'.zip', 'w+') as out_file:
                        shutil.copyfileobj(response, out_file)

            # return when done
            self.finish({"status": "done importing projects"})

        except:
            self.finish({"status": "project import failed"})
