from unittest import TestCase
from maap.maap import MAAP
from maap.utils.TokenHandler import TokenHandler


class TestMAAP(TestCase):
    @classmethod
    def setUpClass(cls):
        config_file_path = "../maap.cfg"

        cls.maap = MAAP(config_file_path)

        cls._test_instrument_name_uavsar = 'UAVSAR'
        cls._test_instrument_name_lvis= 'lvis'
        cls._test_track_number = '001'
        cls._test_ur = 'uavsar_AfriSAR_v1_SLC-topo'
        cls._test_site_name = 'lope'

    def test_searchGranuleByInstrumentAndTrackNumber(self):
        results = self.maap.searchGranule(
            instrument=self._test_instrument_name_uavsar,
            track_number=self._test_track_number)
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchGranuleByGranuleUR(self):
        results = self.maap.searchGranule(
            granule_ur=self._test_ur)
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchGranuleByInstrumentAndSiteName(self):
        results = self.maap.searchGranule(
            instrument=self._test_instrument_name_lvis,
            site_name=self._test_site_name)
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchGranuleWithPipeDelimiters(self):
        results = self.maap.searchGranule(
            instrument="LVIS|UAVSAR",
            platform="AIRCRAFT")
        self.assertTrue('concept-id' in results[0].keys())

    def test_searchCollection(self):
        results = self.maap.searchCollection(
            instrument=self._test_instrument_name_uavsar)
        self.assertTrue('concept-id' in results[0].keys())

    def test_genFromEarthdata(self):
        input = """
            {
             "p": "C1200015068-NASA_MAAP!C1200090707-NASA_MAAP!C1200015148-NASA_MAAP",
             "pg": [
              {
               "exclude": {
                "echo_granule_id": [
                 "G1200015109-NASA_MAAP",
                 "G1200015110-NASA_MAAP"
                ]
               }
              }
             ],
             "m": "-87.55224609375!75.30249023437501!0!1!0!0,2",
             "processing_level_id_h": [
              "1A",
              "1B",
              "2",
              "4"
             ],
             "instrument_h": [
              "LVIS",
              "UAVSAR"
             ],
             "platform_h": [
              "AIRCRAFT",
              "B-200",
              "COMPUTERS"
             ],
             "data_center_h": [
              "MAAP Data Management Team"
             ],
             "bounding_box": "-35.4375,-55.6875,-80.4375,37.6875"
            }
        """

        var_name = 'maapVar'
        testResult = self.maap.getCallFromEarthdataQuery(query=input, variable_name=var_name)
        self.assertTrue(
            testResult == var_name + '.searchGranule('\
                'processing_level_id="1A|1B|2|4", '\
                'instrument="LVIS|UAVSAR", '\
                'platform="AIRCRAFT|B-200|COMPUTERS", '\
                'data_center="MAAP Data Management Team", '\
                'bounding_box="-35.4375,-55.6875,-80.4375,37.6875")')

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
