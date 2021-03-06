#!/bin/bash
  
# Reconstruct Che preview url
export PREVIEW_URL=`/usr/bin/printenv | grep $MACHINE_NAME | perl -slane 'if(/^(SERVER[^_]+_$mn)_SERVICE_PORT=(\d+)/) { $p=$2; print "/".lc($1=~s/_/-/rg)."/server-".$p; }' -- -mn=$MACHINE_NAME | uniq`

# Find the jupyter install in conda (because jlab may be installed in python3.6 or python3.7)
export NOTEBOOKLIBPATH=`find /opt/conda/lib/ -maxdepth 3 -type d -name "notebook"`
export JUPYTERLABLIBPATH=`find /opt/conda/lib/ -maxdepth 3 -type d -name "jupyterlab"`
export JUPYTERLABSERVERLIBPATH=`find /opt/conda/lib/ -maxdepth 3 -type d -name "jupyterlab_server"`

# Fixes to JupyterLab with base_url and Che proxying. Hack.
perl -pi -e "s|nb_app.web_app.settings\['base_url'\]|'/'|g" $NOTEBOOKLIBPATH/terminal/__init__.py
perl -pi -e "s|webapp.settings\['base_url'\]|'/'|g" $NOTEBOOKLIBPATH/terminal/__init__.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" $JUPYTERLABLIBPATH/extension.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" $JUPYTERLABSERVERLIBPATH/handlers.py
perl -pi -e "s|pattern = url_path_join\(settings\['base_url'\], handler\[0\]\)|pattern = url_path_join('/', handler[0])|g" $NOTEBOOKLIBPATH/notebookapp.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/pull_projects/pull_projects/__init__.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/show_ssh_info/show_ssh_info/__init__.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/edsc_extension/edsc_extension/__init__.py
#perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /jupyterlab_iframe/jupyterlab_iframe/__init__.py
#perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /inject_ssh/inject_ssh/__init__.py
perl -pi -e "s|web_app.settings\[\"base_url\"\]|'/'|g" /maap-jupyter-ide/jupyterlab-git/jupyterlab_git/handlers.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/submit_jobs/submit_jobs/__init__.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/ipycmc/ipycmc/nbextension/__init__.py
perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /maap-jupyter-ide/maapsec/maapsec/__init__.py


# Dump all env variables into file so they exist still though SSH
env | grep _ >> /etc/environment

# Add conda bin to path
export PATH=$PATH:/opt/conda/bin
cp /root/.bashrc ~/.bash_profile

jupyter lab --ip=0.0.0.0 --port=3100 --allow-root --NotebookApp.token='' --LabApp.base_url=$PREVIEW_URL --no-browser --debug
