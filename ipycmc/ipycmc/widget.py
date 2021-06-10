#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Flynn Platt.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import (
    DOMWidget, Box, CallbackDispatcher, widget_serialization, interactive
)
from traitlets import (
    Float, Unicode, Int, Tuple, List, Instance, Bool, Dict, Enum,
    link, observe, default, validate, TraitError, Union
)
from ._frontend import module_name, module_version
from . import loadGeotiff

import os

class InteractMixin(object):

    def interact(self, **kwargs):
        c = []
        for name, abbrev in kwargs.items():
            default = getattr(self, name)
            widget = interactive.widget_from_abbrev(abbrev, default)
            if not widget.description:
                widget.description = name
            widget.link = link((widget, 'value'), (self, name))
            c.append(widget)
        cont = Box(children=c)
        return cont

class MapCMC(DOMWidget, InteractMixin):
    _model_name = Unicode('MapCMCModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode('MapCMCView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    _argv = List().tag(sync=True)
    _state = Dict(read_only=True).tag(sync=True)
    _workspace_base_url = Unicode(os.getenv("PREVIEW_URL", "")).tag(sync=True)

    def __init__(self, **kwargs):
        super(MapCMC, self).__init__(**kwargs)

    def load_layer_config(self, url, handle_as, default_ops = {}):
        self._argv = ["loadLayerConfig", url, handle_as, default_ops]

    def load_geotiff(self, urls):
        return_url = loadGeotiff.loadGeotiffs(urls)
        print("Request url generated: " + str(return_url))
        #load_layer_config(return_url, "wmts/xml", {"handleAs": "wmts_raster"})
        if return_url != None:
            self._argv = ["loadLayerConfig", return_url, "wmts/xml", {"handleAs": "wmts_raster"}]
        else:
            print("Unable to fulfill your request due to the above error")
        #self._argv = ["loadLayerConfig", "https://baxpil3vd6.execute-api.us-east-1.amazonaws.com/cog/WMTSCapabilities.xml?tile_format=png&tile_scale=1&TileMatrixSetId=WebMercatorQuad&url=s3%3A%2F%2Fnasa-maap-data-store%2Ffile-staging%2Fnasa-map%2FSRTMGL1_COD___001%2FN45W101.SRTMGL1.tif&resampling_method=nearest&return_mask=true&rescale=0%2C1000", "wmts/xml", {"handleAs": "wmts_raster"}]

    def set_date(self, date_str, format_str=""):
        self._argv = ["setDate", date_str, format_str]

    def set_projection(self, projection_str="EPSG:4326"):
        self._argv = ["setProjection", projection_str]

    def get_date(self):
        return self._state["date"]

    def get_layers(self):
        return self._state["layers"]

    def get_area_selections(self):
        return self._state["areaSelections"]

    def get_active_layers(self):
        if "layers" in self._state:
            l = self._state["layers"]["data"]
            return list(filter(lambda layer_id: l[layer_id]["isActive"], l))
        return []
