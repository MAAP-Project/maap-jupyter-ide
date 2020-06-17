from setuptools import setup, find_packages
from os import path
from codecs import open

here = path.abspath(path.dirname(__file__))

with open(path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

setup(
    name="maapsec",
    author="Brian Satorius",
    author_email="brian.p.satorius@jpl.nasa.gov",
    version="0.0.1",
    packages=find_packages(),
    install_requires=requires,
    description="login to maap and access maap profile information",
    long_description='',
    keywords='jupyter jupyterlab',
    include_package_data=True,
    zip_safe=False,
)
