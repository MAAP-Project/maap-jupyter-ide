from setuptools import setup, find_packages
from codecs import open
from os import path

here = path.abspath(path.dirname(__file__))

with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

with open(path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()


setup(
    name='edsc_extension',
    version='0.0.11',
    description='IFrame widgets for JupyterLab',
    long_description=long_description,
    url='',
    download_url='',
    author='Maya DeBellis',
    author_email='maya.debellis@jpl.nasa.gov',
    license='Apache 2.0',

    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='jupyter jupyterlab',
    packages=find_packages(exclude=['tests', ]),
    zip_safe=False,
    install_requires=requires,
    extras_require={'dev': requires + ['nose2', 'pylint', 'flake8']}
)
