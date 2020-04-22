# MAAP Jupyter Interface

This repo includes JupyterLab extensions that have been built for the MAAP project (https://che-k8s.maap.xyz/)

In order to use each of these extensions they must be installed and enabled in your environment. Instructions for each extension can be 
found in the respective folder. 

These extensions have been developed for `Jupyter 4.4.0` and `Jupyter Lab 1.0.2`.

#### Getting Started on Your Extension
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

#### Deploying Extensions as Part of Eclipse Che
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
#### Enabling Privileged Docker Containers
1. Cluster Privileges
- in `/var/snap/microk8s/current/args/kubelet` and `/var/snap/microk8s/current/args/kube-apiserver`, append `--allow-privileged`
- restart both services:
```
sudo systemctl restart snap.microk8s.daemon-apiserver
sudo systemctl restart snap.microk8s.daemon-kubelet
```

2. Che Permissions
- in `che/dockerfiles/init/manifest/che.env`, set `CHE_DOCKER_PRIVILEGED=true` under the Privileged Mode section
- restart Che

#### Creating and Sharing Stacks
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


