class Presenter:
    """
    Functions used to handle Earthdata oAuth
    """
    def __init__(self, capabilities, display_config):
        wmts_contents = capabilities['Capabilities']['Contents']
        tile_matrix_set = wmts_contents['TileMatrixSet']
        self.layer_title = wmts_contents['Layer']['ows:Title']
        bbox = self.gen_bounding_box(wmts_contents['Layer']['ows:WGS84BoundingBox'])
        self.bbox = bbox
        self.lat = (bbox[3] - bbox[1]) / 2 + bbox[1]
        self.lng = (bbox[2] - bbox[0]) / 2 + bbox[0]
        self.display_config = self.display_config(display_config)
        tile_matrix_set = wmts_contents['TileMatrixSet']
        self.minzoom = int(tile_matrix_set['TileMatrix'][0]['ows:Identifier'])
        self.maxzoom = int(tile_matrix_set['TileMatrix'][-1]['ows:Identifier'])

    def gen_bounding_box(self, wmts_bbox):
        bbox = wmts_bbox['ows:LowerCorner'].split(' ')
        bbox.extend(wmts_bbox['ows:UpperCorner'].split(' '))
        return list(map(float, bbox))

    def display_config_defaults(self):
        return {
          'LVIS Level 2 Geolocated Surface Elevation and Height Product': {
            'rescale': '0, 70',
            'color_map': 'schwarzwald'
          },
          'AfriSAR UAVSAR Coregistered SLCs Generated Using NISAR Tools': {
            'rescale': '-1, 1'
          }
        }

    def display_config(self, display_config):
        return display_config or self.display_config_defaults()[self.layer_title]
