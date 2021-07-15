# MAAP Jupyter Interface

This repo includes JupyterLab extensions that have been built for the MAAP project (https://www.maap-project.org/)

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
jupyter labextension install jupyterlab_toastify@3.0.0
npm i jupyterlab_toastify@3.0.0
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

## Steps for Contributing
### Each Contribution
- Clone repository locally to test and develop extensions. Create your own branch and once you have tested it and are ready to contribute, put a PR into the develop branch.
- After you have validated your code is working locally, the next step is to test it in the MAAP ADE in the devlopment environment.
- When there is an update to the develop branch, such as merging in a PR, the CI will be kicked off automatically and will build the image necessary for use in the MAAP ADE. This image will end in the `:develop` tag. This is intended to be used to test in the development environment.
- When updates in develop have been tested in the MAAP ADE and deemed stable, merge them into master.
### Ready for Release
- Once there have been changes that warrant a new release to the operations environment, create a new Github release from the master branch. Name the release the next corresponding number following the `v3.0.1` schema. In the notes of the release include a changelog of the updates included in that release
- Then, update the existing `stable` tag to point to the same place as the release that you just created. This can easily be done on the command line by checking out the latest code on master (or whatever commit the release was created from) and running the following:
  ```
  git tag -f stable
  git push -f origin stable
  ```
- The CI will also be kicked off for `stable` and `v` tags. The `stable` tag is used in the devfiles in the operations environment and automatically pulled in each new workspace, so it is very important pushing changes to this tag have been thuroughly tested. The `v` tag is not used in any environment but is used to track versions and the changes we role out. If there is an issue found in the `stable` tag we can roll it back to the previous `v` release by checking out that release and running the lines above.
- The CI trigger information can be found .github/workflows/gitlab-trigger.yml and in the actions tab

## Docker Images and CI Process
- The CI and images built off of this code live on MAAP's hosted GitLab (https://mas.maap-project.org/root).
- Triggered from maap-jupyter-ide
    - Will build corresponding maap-jupyter-ide branch on all of the base images listed in the base_images.txt file
- Triggered from Gitlab
    - If triggered from a [base image](https://mas.maap-project.org/root/ade-base-images) being updated, it will only rebuild that base image with map-jupyter-ide’s stable tag on top of it.
    - If triggered from an update in the [jupyter-image](https://mas.maap-project.org/root/jupyter-image) repo, it will rebuild all of the base images listed in base_iamges.txt with maap-jupyter-ide’s stable tag.
- Troubleshooting
    - If the image failed to build for an unexpected reason, it is likely because the gitlab runner ran out of space. Ssh onto the runner, clean up the docker images (you can get rid of anything - everything important is on s3 backed registries) and restart the failed job.


## Troubleshooting
- If your extension includes a server extension you also need to modify `entrypoint.sh`. This is because jupyter server extensions function off of having a standard base url, but in the context of che the url is not what jupyter thinks it is.
  - Here is some magic that fixes it (add this line and replace with the path to where your `load_jupyter_server_extension` function is)
        ```bash
        perl -pi -e "s|web_app.settings\['base_url'\]|'/'|g" /show_ssh_info/show_ssh_info/__init__.py
# maap-jupyter-ide-testing
# maap-jupyter-ide-testing
# maap-jupyter-ide-testing
