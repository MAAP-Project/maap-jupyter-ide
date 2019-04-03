FROM continuumio/anaconda3:2018.12

RUN conda install -c conda-forge jupyterlab
RUN conda install -c conda-forge nodejs 
RUN conda install -c conda-forge gitpython

# jlab show ssh extension
COPY show_ssh_info /show_ssh_info
RUN cd /show_ssh_info && npm run build
RUN cd /show_ssh_info && jupyter labextension link .
RUN cd /show_ssh_info && pip install -e .
RUN cd /show_ssh_info && jupyter serverextension enable --py show_ssh_info --sys-prefix

# jlab pull projects into /projects directory
COPY pull_projects /pull_projects
RUN cd /pull_projects && pip install -e .
RUN cd /pull_projects && jupyter serverextension enable --py pull_projects --sys-prefix
RUN cd /pull_projects && npm run build
RUN cd /pull_projects && jupyter labextension link .

# jlab earthdata search extension
#COPY jupyterlab_iframe /jupyterlab_iframe
#RUN cd /jupyterlab_iframe && npm run build
#RUN cd /jupyterlab_iframe && jupyter labextension link .
#RUN cd /jupyterlab_iframe && pip install -e .
#RUN cd /jupyterlab_iframe/maap-py && python setup.py install
#RUN cd /jupyterlab_iframe && jupyter serverextension enable --py jupyterlab_iframe --sys-prefix

# jlab earthdata search extension
COPY edsc_extension /edsc_extension
RUN cd /edsc_extension && npm run build
RUN cd /edsc_extension && jupyter labextension link .
RUN cd /edsc_extension && pip install -e .
RUN cd /edsc_extension/maap-py && python setup.py install
RUN cd /edsc_extension && jupyter serverextension enable --py edsc_extension --sys-prefix

# install git extension
COPY jupyterlab-git /jupyterlab-git
RUN cd /jupyterlab-git && npm install && npm run build
RUN cd /jupyterlab-git && jupyter labextension link .
RUN cd /jupyterlab-git && npm run build
RUN cd /jupyterlab-git && pip install -e .
RUN cd /jupyterlab-git && jupyter serverextension enable --py jupyterlab_git --sys-prefix

## jlab show ssh extension
#COPY inject_ssh /inject_ssh
#RUN cd /inject_ssh && npm run build
#RUN cd /inject_ssh && jupyter labextension link .
#RUN cd /inject_ssh && pip install -e .
#RUN cd /inject_ssh && jupyter serverextension enable --py inject_ssh --sys-prefix

# jlab submit_jobs extension
COPY submit_jobs /submit_jobs
RUN cd /submit_jobs && npm run build
RUN cd /submit_jobs && jupyter labextension link .
RUN cd /submit_jobs && pip install -e .
RUN cd /submit_jobs && jupyter serverextension enable --py submit_jobs --sys-prefix

# jlab show ssh extension
COPY jupyterlab-solutions /jupyterlab-solutions
RUN cd /jupyterlab-solutions && npm install
RUN cd /jupyterlab-solutions && jupyter labextension link .

RUN touch /root/.bashrc && echo "cd /projects >& /dev/null" >> /root/.bashrc

RUN mkdir /projects

EXPOSE 3100

WORKDIR /projects
ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
