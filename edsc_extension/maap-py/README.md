# Python MAAP Client Library

Python client library that abstracts [MAAP API](https://github.com/MAAP-Project/maap-api) calls including CMR querying, algorithm change management, and HySDS job execution. CMR components in this library are largely derived from the [pyCMR](https://github.com/nasa/pyCMR) library.



## Setup

Run:

    $ python setup.py install

Or

    $ pip install -e .

## Usage

Populate your MAAP base url into a `maap.cfg` file, using [maap.cfg](maap.cfg) as a template.

Then, run:

```python
$ python
>>> from maap.maap import MAAP
>>> maap = MAAP() 

>>> granules = maap.searchGranule(sitename='lope', instrument='uavsar')
>>> for res in granules:
    print(res.getDownloadUrl())
    res.download()
#results omitted for brevity
```

### Custom 'Named Attribute'  Parameters

Named parameters are recommended as an alternative to CMR's [additional attributes](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#g-additional-attribute) as a way to improve usability.
This list of attributes is editable in the [maap.cfg](maap.cfg) `indexed_attributes` setting. E.g.:
- "site_name,Site Name,string" where `site_name` is the parameter, `Site Name` is the CMR attribute name, and `string` is the parameter type.

With named attribute parameters, this query:

 ```python
lidarGranule = maap.searchGranule(instrument='lvis', attribute='string,Site Name,lope')
```

Simplifies to:
 
```python
lidarGranule = maap.searchGranule(instrument='lvis', site_name='lope')
```

## Test

```bash
python setup.py test
```