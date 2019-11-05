## Packaging Jupyter Extensions and related stuff into docker images on a registry for Eclipse Che!

### Repos on GitHub:
#### *maap-jupyter-ide*

This is where the extension code lives as well as documentation and additional miscellaneous 
files like entrypoint.sh

A web hook is configured in this repo to trigger a build for the gitlab jupyter_image CI whenever 
there is a push event on this GitHub repo.

NOTE: The web hook triggers for ANY push event. Not just to master, even though the docker image only 
builds from master. A check needs to be added on the gitlab side to only proceed if the event trigger 
is from the master branch (information found in the ref tag). This needs to be fixed!


### Repos on GitLab: 
#### *ade_base_images*

This repo contains the base image dockerfiles. These are just the default packages we want
installed in our different Che stacks without any jupyter extensions. Hysds will use these to run 
jobs built off corresponding stacks as it does not need any of the jupyter packages. These base
images are the only thing that is different between the stacks. The rest of the configurations will
be the same.

The different packages/images are arranged into different branches. The name of the branch corresponds
to the image built from the docker file in the branch.
 
CI: triggered when any change is made on one of these branches. First it rebuilds the image from
the branch that changed. Then it triggers the CI build for `jupyter_image` passing the name of
the image that was just rebuilt as the variable `BASE_IMAGE`.

#### *jupyter_image*

This repo contains the dockerfile and CI for the final images to be used in Eclipse Che stacks. In the 
dockerfile, the `maap-jupyter-ide` repo is git cloned into the docker container and 
the extensions are installed from there. This docker build uses the `—no-cache` flag to make sure 
it is actually copying the latest jupyter extension code instead of a cached version of the repo.

It also contains the bash script that the CI runs that has the logic about what image it should be 
building since this CI can be triggered from multiple places (a change on `maap-jupyter-ide` or 
on `ade_base_images`). 

If the CI is triggered from `ade_base_images`, that base image that will be used for the build 
of `jupyter_image` will be a variable passed in corresponsidng to the branch that changed. 

If the CI is triggered by a web hook from the GitHub repo. the jupyter_image will be built for 
each of the base images in `ade_base_images`. (NOTE: these different bases/branches are hard coded
into the CI with the corresponding versions. If the versions are updated or if new base images are
added, this will need to be updated.)
 
Additional info needed for the build are stored as variables in the repo 
under Settings -> CI/CD.

The registry of these images built is the registry that Che will look at for images for the stacks.
This can be found under Packages -> Container Registry. The image names follow the format 
`mas.maap-project.org:5000/root/jupyter_image/{NAME_OF_BASE_IMAGE}`

NOTE: There is no `latest` for any of these images. They are all tagged with version numbers. Ex:
`mas.maap-project.org:5000/root/jupyter_image/vanilla:1.0`

