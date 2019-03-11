import os.path
from setuptools import find_packages, setup


# Package data
# ------------
_author = 'Jet Propulsion Laboratory'
_author_email = 'bsatoriu@jpl.nasa.gov'
_classifiers = [
    'Environment :: Console',
    'Framework :: Pytest',
    'Intended Audience :: Developers',
    'Intended Audience :: Information Technology',
    'Intended Audience :: Science/Research',
    'Topic :: Scientific/Engineering',
    'Development Status :: 3 - Alpha',
    'Operating System :: OS Independent',
    'Programming Language :: Python :: 2.7',
    'Programming Language :: Python :: 3.5',
    'Topic :: Internet :: WWW/HTTP',
    'Topic :: Software Development :: Libraries :: Python Modules',
]
_description = 'maapPy Python API'
_download_url = ''
_requirements = ['requests', 'boto3', 'botocore']
_keywords = ['dataset', 'granule', 'nasa', 'MAAP', 'CMR']
_license = 'Apache License, Version 2.0'
_long_description = 'Python client API for interacting with the NASA MAAP API'
_name = 'maapPy'
_namespaces = []
_test_suite = ''
_url = 'https://github.com/MAAP-Project/maap-py'
_version = '0.2.0'
_zip_safe = False

# Setup Metadata
# --------------


def _read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

_header = '*' * len(_name) + '\n' + _name + '\n' + '*' * len(_name)
_longDescription = '\n\n'.join([
    _header,
    _read('README.md')
])
open('doc.txt', 'w').write(_longDescription)

setup(
    author=_author,
    author_email=_author_email,
    classifiers=_classifiers,
    description=_description,
    download_url=_download_url,
    include_package_data=True,
    install_requires=_requirements,
    setup_requires=['pytest-runner'],
    tests_require=['pytest'],
    keywords=_keywords,
    license=_license,
    long_description=_long_description,
    name=_name,
    namespace_packages=_namespaces,
    packages=find_packages(),
    test_suite=_test_suite,
    url=_url,
    version=_version,
    zip_safe=_zip_safe,
)
