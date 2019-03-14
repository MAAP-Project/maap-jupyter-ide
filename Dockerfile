FROM continuumio/anaconda3:2018.12

RUN conda install -c conda-forge jupyterlab
RUN conda install -c conda-forge nodejs 
RUN conda install -c conda-forge gitpython

COPY show_ssh_info /show_ssh_info
COPY pull_projects /pull_projects

# jlab show ssh extension
RUN cd /show_ssh_info && npm run build
RUN cd /show_ssh_info && jupyter labextension link .
RUN cd /show_ssh_info && pip install -e .
RUN cd /show_ssh_info && jupyter serverextension enable --py show_ssh_info --sys-prefix

# jlab pull projects into /projects directory
RUN cd /pull_projects && pip install -e .
RUN cd /pull_projects && jupyter serverextension enable --py pull_projects --sys-prefix
RUN cd /pull_projects && npm run build
RUN cd /pull_projects && jupyter labextension link .

# jlab earthdata search extension
COPY jupyterlab_iframe /jupyterlab_iframe
RUN cd /jupyterlab_iframe && npm run build
RUN cd /jupyterlab_iframe && jupyter labextension link .
RUN cd /jupyterlab_iframe && pip install -e .
RUN cd /jupyterlab_iframe/maap-py && python setup.py install
RUN cd /jupyterlab_iframe && jupyter serverextension enable --py jupyterlab_iframe --sys-prefix



# install git extension
COPY jupyterlab-git /jupyterlab-git
RUN cd /jupyterlab-git && npm install && npm run build
RUN cd /jupyterlab-git && jupyter labextension link .
RUN cd /jupyterlab-git && npm run build
RUN cd /jupyterlab-git && pip install -e .
RUN cd /jupyterlab-git && jupyter serverextension enable --py jupyterlab_git --sys-prefix

RUN touch /root/.bashrc && echo "cd /projects >& /dev/null" >> /root/.bashrc

RUN mkdir /projects

EXPOSE 3100

WORKDIR /projects
ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
