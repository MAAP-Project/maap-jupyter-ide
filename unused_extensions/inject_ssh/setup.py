import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name='inject_ssh',
    version='0.0.1',
    author='RMOTR',
    description="A jupyterlab extension to inject ssh key from browser's keycloak",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    install_requires=[
        'jupyterlab>=0.35.4',
        'jupyter-nbextensions-configurator>=0.4.0'
    ],
    package_data={'inject_ssh': ['*']},
)
