# MAAP Jupyter Interface

This repo includes JupyterLab extensions that have been built for the MAAP project (https://che-k8s.maap.xyz/)

In order to use each of these extensions they must be installed and enabled. Instructions for each extension can be 
found in the respective folder. 

These extensions have been developed on `Jupyter 4.4.0` and `Jupyter Lab 0.32.1`.

To build additional extensions for the project, it is recommended to start from 
a [cookie-cutter](https://github.com/jupyterlab/extension-cookiecutter-ts) or off a previously built extension.

Some Jupyter Extensions/Resources we have found helpful:
* [xkcd tutorial](https://jupyterlab.readthedocs.io/en/stable/developer/xkcd_extension_tutorial.html) Great place to start for extending JupyterLab
* [pizzabutton](https://github.com/peterskipper/pizzabutton) Implements a basic server extension and connects it with UI
* [cookie-cutter-ts](https://github.com/jupyterlab/extension-cookiecutter-ts) Base to build UI extensions off of
* [jupyterlab_autoversion](https://github.com/timkpaine/jupyterlab_autoversion)
* [jupyterlab-logout](https://github.com/zgqallen/jupyterlab-logout)
* [jupyterlab_iframe](https://github.com/timkpaine/jupyterlab_iframe)
* [jupyterlab_toastify](https://github.com/fcollonval/jupyterlab_toastify)
* [jupyter-notify](https://github.com/ShopRunner/jupyter-notify)
* [jupyterlab](https://github.com/jupyterlab/jupyterlab) A lot of figuring out how to add things where has happened through looking at the source code of jupyter
* [Jupyterlab-html](https://github.com/mflevine/jupyterlab_html) 
* [Jupyterlab-sandbox](https://github.com/canavandl/jupyterlab_sandbox)

##### Deploying extensions as part of Eclipse Che
Our development process involves building and running an extension locally in jupyterlab using a conda env before 
installing it on the che server. To enable an extension in Che, it must be included in the base docker image/stack that a 
Che workspace is launched with. The dockerfile that extensions are included in is the `Dockerfile` and the highest level
in this repo. At the point of adding your extension into the Docker image, some minor changes may have to be made 
(mainly path issues). This will be explained in the bullets below.

An instance of this repository lives on the Che server under `~/che/dockerfiles/maap-jupyter-ide`. Once an extension has been tested locally, rebuild the docker 
image with your new extensions.


- Add your install to the Dockerfile. For example:
    ```bash
    # jlab pull projects into /projects directory
    COPY pull_projects /pull_projects
    RUN cd /pull_projects && npm run build
    RUN cd /pull_projects && jupyter labextension link .
    RUN cd /pull_projects && pip install -e .
    RUN cd /pull_projects && jupyter serverextension enable --py pull_projects --sys-prefix
    
    ```
- If your extension includes a server extension you also need to modify `entrypoint.sh`. This is because jupyter 
server extensions function off of having a standard base url, but in the context of che the url is not what jupyter 
thinks it is.
    - Here is some magic that fixes it (add this line and replace with the path to where 
your `load_jupyter_server_extension` function is)
        ```bash
        perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /show_ssh_info/show_ssh_info/__init__.py
        ```
- Then rebuild the docker image. `microk8s.docker build -t localhost:32000/che-jupyter-lab-ide .` 
- Push! `microk8s.docker push localhost:32000/che-jupyter-lab-ide `
- Now when you build a new workspace with the `localhost:32000/che-jupyter-lab-ide` image it will automatically 
fetch the new image. (found in the stack's `Recipe` or `Raw Configuration`)
    - you can also specify the image tag to use in your build on the stack if you want to use a previous build
- Any change pushed to `microk8s.docker push localhost:32000/che-jupyter-lab-ide ` will affect the default stacks
on all user accounts. If you are testing something, you can create your own image and your own stack to play around with.

##### Che Stack Raw Configuration
```
{
  "description": "JupyterLab Extension",
  "scope": "general",
  "creator": "b07e3a58-ed50-4a6e-be17-fcf49ff8b242",
  "workspaceConfig": {
    "defaultEnv": "default",
    "environments": {
      "default": {
        "recipe": {
          "contentType": "text/x-yaml",
          "type": "kubernetes",
          "content": "kind: List\nitems:\n - \n  apiVersion: v1\n  kind: Pod\n  metadata:\n   name: ws\n   labels:\n    name: ws\n  spec:\n   containers:\n    - \n     name: jupyter\n     image: 'localhost:32000/che-jupyter-lab-ide:latest'\n     resources:\n      limits:\n       memory: 1024Mi\n     securityContext:\n       privileged: true\n - \n  apiVersion: v1\n  kind: Service\n  metadata:\n   name: ws\n  spec:\n   type: NodePort\n   ports:\n    - \n     port: 22\n   selector:\n    name: ws\n    "
        },
        "machines": {
          "ws/jupyter": {
            "env": {
              "MACHINE_NAME": "WS_JUPYTER"
            },
            "servers": {
              "jupyter": {
                "path": "/",
                "attributes": {
                  "cookiesAuthEnabled": "true",
                  "type": "ide",
                  "secure": "true"
                },
                "protocol": "http",
                "port": "3100"
              }
            },
            "installers": [
              "org.eclipse.che.exec",
              "org.eclipse.che.ssh"
            ],
            "volumes": {
              "projects": {
                "path": "/projects"
              }
            },
            "attributes": {}
          }
        }
      }
    },
    "commands": [],
    "projects": [],
    "name": "default",
    "attributes": {},
    "links": []
  },
  "components": [],
  "tags": [],
  "name": "JupyterLab Extensions",
  "id": "stackjfbf5pwojopvx4e7"
}
```