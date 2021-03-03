# MAAP Jupyter Interface

This repo includes JupyterLab extensions that have been built for the MAAP project (https://che-k8s.maap.xyz/)

In order to use each of these extensions they must be installed and enabled in your environment. Instructions for each extension can be 
found in the respective folder. Make sure each extension's dependencies are installed first.

These extensions have been developed for `Jupyter 4.4.0` and `Jupyter Lab 2.1.4`.

## Environment Setup for MAAP Extensions
All the MAAP Jupyter extensions share some common dependencies.

### Environment Setup and Dependencies
Create a new Conda environment and install common dependencies and versions:
``` bash
conda create --name maap-ade
conda activate maap-ade
conda install conda=4.7.12 jupyterlab=2.1.4 nodejs=10.13.0 gitpython=3.0.2
jupyter labextension install jupyterlab_toastify@3.3.0 --no-build
npm i jupyterlab_toastify@3.3.0
pip install plotly==4.0.0
jupyter labextension install @jupyter-widgets/jupyterlab-manager@2.0
```

## Extension Installation Order
There is no strict order to install the extensions in, but since some extensions depend on others, those dependencies should be installed first.  For each of the following extensions (in recommended order), the sub-bullet points will indicate if it requires installing another extension listed above it first.  

**Note:** Extensions marked as _Che-only_ don't make sense to install locally, since they only work in the context of the Che UI and/or containerized contexts, and require use of the Che API.

* `hide_side_panel` _(Che-only)_
* `ipycmc`
* `pull_projects` _(Che-only)_
* `show_ssh_info`
    * ssh features _(Che-only)_
    * s3 features work locally
        * requires `s3fs-fuse` util and AWS keys/role, `boto3` Python library installed (see extension README)
* `edsc_extension`
    * requires `maap-py` library (see extension README)
* `maapsec`
* `submit_jobs`
    * requires `maapsec`
* `dps_magic`
     * requires `maapsec`, `submit_jobs`, `show_ssh_info`
* `dps_info`
     * requires `maapsec`, `submit_jobs`
* `insert_defaults_to_notebook`
     * requires `maap-py` library (see extension README)
* `user_meta_form`

## Development
### Getting Started on Your Extension
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

In JupyterLab's update to the stable 1.0 version, they have also updated and added lots of documentation on extension 
development. I recommend taking a look at [this](https://jupyterlab.readthedocs.io/en/stable/developer/extension_dev.html).

## Deploying Extensions as Part of Eclipse Che
### Dockerizing
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

## IMPORTANT VERSION UPDATE
The upcoming v3 release of this project will make the information below deprecated. 

### Che Stacks
To make your custom docker image available to users in Che, you need to make a new stack that creates workspaces using your image and make it available to users.
Below is an example stack configuration using our locally built dockerized juptyer image with MAAP extensions installed.  

Make sure to replace the image name in `workspaceConfig.environments.default.recipe.image` with the location of your image.
In order for SSH-ing into the workspace to be possible, the `org.eclipse.che.exec` and `org.eclipse.che.ssh` installers must be enabled under `workspaceConfig.environments.default.machines.ws/jupyter.installers`.

#### Che Stack Raw Configuration
```
{
  "scope": "general",
  "description": "Use this one. Stable jupyter. No extra packages",
  "creator": "b07e3a58-ed50-4a6e-be17-fcf49ff8b242",
  "tags": [
    "MAAP",
    "JUPYTER",
    "STABLE"
  ],
  "workspaceConfig": {
    "defaultEnv": "default",
    "environments": {
      "default": {
        "recipe": {
          "contentType": "text/x-yaml",
          "type": "kubernetes",
          "content": "kind: List\nitems:\n - \n  apiVersion: v1\n  kind: Pod\n  metadata:\n   name: ws\n   labels:\n    name: ws\n  spec:\n   containers:\n    - \n     name: jupyter\n     image: 'localhost:32000/stable-ide:latest'\n     resources:\n      limits:\n       memory: 1024Mi\n     securityContext:\n       privileged: true\n - \n  apiVersion: v1\n  kind: Service\n  metadata:\n   name: ws\n  spec:\n   type: NodePort\n   ports:\n    - \n     port: 22\n   selector:\n    name: ws\n     \n    "
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
    "projects": [],
    "commands": [],
    "name": "default",
    "attributes": {},
    "links": []
  },
  "components": [],
  "name": "maap-jupyter-ide",
  "id": "stacktdo2q0ixhv7cge00"
}
```

#### Creating and Sharing Stacks
[TODO: Update with Che7 Devfile Registry info]
To create a stack, you write a raw configuration with all the che and docker settings your workspace will require, including installers, volumes, docker run tags, docker images, etc. See the example above.

To share a stack, you will need to be the owner (creator) of the stack.
Go to the homepage of where your Che instance is hosted and add `/swagger` to the end of the url for an interface with Che's API.   Under the `permissions`section, make a POST request with the users you want to share with and the id of your stack (shows up at the bottom of the configuration after creation).
POST body:
```
{
"userId": "*",
  "domainId": "stack",
  "instanceId": "${STACK_ID}",
  "actions": [
    "read",
    "search"
  ]
}
```
reference: https://www.eclipse.org/che/docs/che-6/stacks.html#sharing-stacks-and-system-stacks
