from setuptools import setup, find_packages
from os import path
from codecs import open

here = path.abspath(path.dirname(__file__))

with open(path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

setup(
    name="submit_jobs",
    author="Elizabeth Yam",
    author_email="Elizabeth.Yam@jpl.nasa.gov",
    version="0.1.0",
    packages=find_packages(),
    install_requires=requires,
    description="query CMR for dataset granules based on keywords",
    long_description='',
    keywords='jupyter jupyterlab',
    include_package_data=True,
    zip_safe=False,
)
