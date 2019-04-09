import requests
import shutil
import os
import urllib
import boto3
from urllib.parse import urlparse


class Result(dict):
    """
    The class to structure the response xml string from the cmr API
    """
    _location = None

    # TODO: add destpath as config setting
    def getLocalPath(self, destpath=".", overwrite=False):
        """
        Download the dataset into file system
        :param destpath: use the current directory as default
        :param overwrite: don't download by default if the target file exists
        :return:
        """
        url = self._location
        # Downloadable url does not exist
        if not url:
            return None
        if url.startswith('ftp'):
            urllib.urlretrieve(url, destpath + "/" + self._downloadname.replace('/', ''))
            return self._downloadname.replace('/', '')
        elif url.startswith('s3'):
            o = urlparse(url)
            filename = url[url.rfind("/") + 1:]
            if not overwrite and not os.path.isfile(destpath + "/" + filename):
                s3 = boto3.client('s3', aws_access_key_id=self._awsKey, aws_secret_access_key=self._awsSecret)
                s3.download_file(o.netloc, o.path.lstrip('/'), destpath + "/" + filename)
            return destpath + '/' + filename
        else:
            r = requests.get(url, stream=True)
            r.raw.decode_content = True

            with open(destpath + "/" + self._downloadname.replace('/', ''), 'wb') as f:
                shutil.copyfileobj(r.raw, f)

            return self._downloadname.replace('/', '')


    def getDownloadUrl(self):
        """
        :return:
        """
        return self._location

    def getDescription(self):
        """

        :return:
        """
        return self['Granule']['GranuleUR'].ljust(70) + 'Updated ' + self['Granule']['LastUpdate'] + ' (' + self['collection-concept-id'] + ')'


class Collection(Result):
    def __init__(self, metaResult, maap_host):
        for k in metaResult:
            self[k] = metaResult[k]

        self._location = 'https://{}/search/concepts/{}.umm-json'.format(maap_host, metaResult['concept-id'])
        self._downloadname = metaResult['Collection']['ShortName']


class Granule(Result):
    def __init__(self, metaResult, awsAccessKey, awsAccessSecret):

        self._awsKey = awsAccessKey
        self._awsSecret = awsAccessSecret

        for k in metaResult:
            self[k] = metaResult[k]

        # Retrieve downloadable url
        try:
            self._location = self['Granule']['OnlineAccessURLs']['OnlineAccessURL']['URL']
            self._downloadname = self._location.split("/")[-1]
        except KeyError:
            self._location = None

        # Retrieve OPeNDAPUrl
        try:
            urls = self['Granule']['OnlineResources']['OnlineResource']
            self._OPeNDAPUrl = filter(lambda x: x["Type"] == "OPeNDAP", urls)['URL']
        except :
            self._OPeNDAPUrl = None

    def getOPeNDAPUrl(self):
        return self._OPeNDAPUrl
