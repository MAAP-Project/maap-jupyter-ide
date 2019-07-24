FROM localhost:32000/vanilla

RUN conda install -c conda-forge jupyterlab=1.0.2
RUN conda install -c conda-forge nodejs
RUN conda install -c conda-forge gitpython

# install git extension
COPY jupyterlab-git /jupyterlab-git
RUN cd /jupyterlab-git && npm install && npm run build
RUN cd /jupyterlab-git && jupyter labextension link .
RUN cd /jupyterlab-git && npm run build
RUN cd /jupyterlab-git && pip install -e .
RUN cd /jupyterlab-git && jupyter serverextension enable --py jupyterlab_git --sys-prefix

# install toastify for error messaging
RUN jupyter labextension install jupyterlab_toastify@2.3.0
RUN npm i jupyterlab_toastify@2.3.0

# control che side panel extension
COPY hide_side_panel /hide_side_panel
RUN cd /hide_side_panel && npm run build
RUN cd /hide_side_panel && jupyter labextension link .

# cmc widget
COPY ipycmc /ipycmc
RUN conda install -c plotly plotly 
# RUN cd /ipycmc && pip install ipywidgets
RUN cd /ipycmc && jupyter labextension install @jupyter-widgets/jupyterlab-manager@1.0
RUN cd /ipycmc && npm install && npm run build
RUN cd /ipycmc && pip install -e .
RUN cd /ipycmc && jupyter nbextension install --py --symlink --sys-prefix ipycmc
RUN cd /ipycmc && jupyter nbextension enable --py --sys-prefix ipycmc
RUN cd /ipycmc && jupyter labextension link .

# jlab pull projects into /projects directory
COPY pull_projects /pull_projects
RUN cd /pull_projects && pip install -e .
RUN cd /pull_projects && jupyter serverextension enable --py pull_projects --sys-prefix
RUN cd /pull_projects && npm run build
RUN cd /pull_projects && jupyter labextension link .

# jlab show ssh extension
COPY show_ssh_info /show_ssh_info
RUN cd /show_ssh_info && npm run build
RUN cd /show_ssh_info && jupyter labextension link .
RUN cd /show_ssh_info && pip install -e .
RUN cd /show_ssh_info && jupyter serverextension enable --py show_ssh_info --sys-prefix

# jlab earthdata search extension
ENV MAAP_CONF='/maap-py/'
RUN git clone --single-branch --branch stable-dev https://github.com/MAAP-Project/maap-py.git && cd maap-py && python setup.py install 
#RUN pip install git+https://github.com/MAAP-Project/maap-py@stable-dev#egg=maapPy
COPY edsc_extension /edsc_extension
RUN cd /edsc_extension && npm run build
RUN cd /edsc_extension && jupyter labextension link .
RUN cd /edsc_extension && pip install -e .
RUN cd /edsc_extension && jupyter serverextension enable --py edsc_extension --sys-prefix

# jlab submit_jobs extension
COPY submit_jobs /submit_jobs
RUN cd /submit_jobs && npm run build
RUN cd /submit_jobs && jupyter labextension link .
RUN cd /submit_jobs && pip install -e .
RUN cd /submit_jobs && jupyter serverextension enable --py submit_jobs --sys-prefix

# dps job magics
COPY dps_magic /dps_magic
RUN cd /dps_magic && pip install -e .
RUN cd /dps_magic && jupyter nbextension install --symlink --py dps_magic --sys-prefix
RUN cd /dps_magic && jupyter nbextension enable --py dps_magic --sys-prefix

# add maap libraries to notebook
COPY insert_defaults_to_notebook /insert_defaults_to_notebook
RUN cd /insert_defaults_to_notebook && npm install
RUN cd /insert_defaults_to_notebook && npm run build
RUN cd /insert_defaults_to_notebook && jupyter labextension link .

RUN touch /root/.bashrc && echo "cd /projects >& /dev/null" >> /root/.bashrc

RUN mkdir /projects

EXPOSE 3100

WORKDIR /projects
ADD entrypoint.sh /entrypoint.sh

ARG aws_access_key_id
ENV AWS_ACCESS_KEY_ID=$aws_access_key_id
ARG aws_secret_access_key
ENV AWS_SECRET_ACCESS_KEY=$aws_secret_access_key

ENTRYPOINT ["/entrypoint.sh"]

