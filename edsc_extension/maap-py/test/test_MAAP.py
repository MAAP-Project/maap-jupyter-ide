from unittest import TestCase
from maap.maap import MAAP
from maap.utils.TokenHandler import TokenHandler


class TestMAAP(TestCase):
    @classmethod
    def setUpClass(cls):
        config_file_path = "../maap.cfg"

        cls.maap = MAAP(config_file_path)

        cls._test_granule_instrument_name = 'UAVSAR'
        cls._test_granule_instrument_name_lvis= 'lvis'
        cls._test_granule_track_number = '001'
        cls._test_granule_ur = 'uavsar_AfriSAR_v1_SLC-topo'
        cls._test_granule_site_name = 'lope'

    def test_searchGranuleByInstrumentAndTrackNumber(self):
        results = self.maap.searchGranule(
            instrument=self._test_granule_instrument_name,
            track_number=self._test_granule_track_number)
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchGranuleByGranuleUR(self):
        results = self.maap.searchGranule(
            granule_ur=self._test_granule_ur)
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchGranuleByInstrumentAndSiteName(self):
        results = self.maap.searchGranule(
            instrument=self._test_granule_instrument_name_lvis,
            site_name=self._test_granule_site_name)
        self.assertTrue('concept-id' in results[0].keys())

    # Need to determine collection search support
    def test_searchCollection(self):
        self.fail()

    # Awaiting persistent HySDS cluster availability
    def test_registerAlgorithm(self):
        self.fail()

    # Awaiting persistent HySDS cluster availability
    def test_getJobStatus(self):
        self.fail()

    def test_TokenHandler(self):
        th = TokenHandler("a-K9YbTr8h112zW5pLV8Fw")
        token = th.get_access_token()
        self.assertTrue(token != 'unauthorized' and len(token) > 0)
