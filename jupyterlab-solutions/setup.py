import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name='jupyterlab_solutions',
    version='0.0.1',
    author='RMOTR',
    description="A jupyterlab extension to hide solutions for assignments",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    install_requires=[
        'jupyterlab>=0.35.4',
        'jupyter-nbextensions-configurator>=0.4.0'
    ],
    package_data={'jupyterlab_rmotr_solutions': ['*']},
)
