# ipycmc

`ipycmc` provides a data mapping and plotting package for datasets ingested into the MAAP ecosystem. With it you can create a widget in your python notebook where you can visualize and interact with rasterized geospatial data on a 2D and 3D map. From the widget you can select specific regions and time periods and retrieve dynamically calculated analyses and plot them inline with an interactive charting widget.

## Getting Started

*import the module* - This will load ipycmc into your notebook for use.
```
import ipycmc
```

*create a mapping widget* - This will create and display a widget inline in your notebook. This widget includes some controls for navigating the map, switching between 2D and 3D, changing the displayed time, and manipulating layer displays.
```
w = ipycmc.MapCMC()
w
```

*load data into the mapping widget* - This will load all the layers specified in this WMS server's capabilities into the widget for display. You can then use the controls in the widget to display some of those layers on the map, then select an area and generate commands for plotting the data corresponding to your selection in the notebook below.
```
w.load_layer_config(
    "http://geoserver.biomass-maap.com/geoserver/gwc/service/wms?REQUEST=GetCapabilities",
    "wms/xml"
)

```
For loading 3D data, see documentation for [load_layer_config](#Class) below.

## API Documentation

### Module: `ipycmc`

`.MapCMC()` - creates a new instance of a MapCMC widget. This widget widget is meant to be dislayed inline in the notebook and functions called on the instance will not perform as expected until the widget is displayed.

Example
```
w = ipycmc.MapCMC()
w
```

---

`.retrieve_data(plotType, startDate, endDate, ds, geometry)` - retrieves data meant for plotting from the MAAP data analysis platform
 * `plotType`: _string_ - ['timeseries', 'timeAvgMap', 'hovmoller_lat', 'hovmoller_lon'] the type of plot data to be calculated
 * `startDate`: _string_ - ISO 8601 string specifying the start time bound of the analysis
 * `endDate`: _string_ - ISO 8601 string specifying the end time bound of the analysis
 * `ds`: _list\<string\>_ - list of dataset identifiers that should be included in this analysis
 * `geometry`: _dict_ - dictionary of type, projection, and coordinates of the area that should be included in the analysis

Example
```
plotType = "timeseries"
startDate = "2019-08-25T07:00:00.000Z"
endDate = "2019-09-01T07:00:00.000Z"
ds = ["dataset_id"]
geometry = {"type":"Box","proj":"EPSG:4326","coordinateType":"Cartographic","coordinates":[-180,-90,180,90]}
data = ipycmc.retrieve_data(plotType, startDate, endDate, ds, geometry)
data
```

---

`.plot_data(plotType, data)` - plots the data from `retrieve_data()` inline in a charting widget
 * `plotType`: _string_ - ['timeseries', 'timeAvgMap', 'hovmoller_lat', 'hovmoller_lon'] the type of plot to be generated
 * `data`: _dict_ - the output from `retieve_data()` for this plot type

Example
```
plotType = "timeseries"
startDate = "2019-08-25T07:00:00.000Z"
endDate = "2019-09-01T07:00:00.000Z"
ds = ["dataset_id"]
geometry = {"type":"Box","proj":"EPSG:4326","coordinateType":"Cartographic","coordinates":[-180,-90,180,90]}
data = ipycmc.retrieve_data(plotType, startDate, endDate, ds, geometry)
ipycmc.plot_data(plotType, data)
```

---

### Class: `MapCMC`

NOTE: All methods of the `MapCMC` class expect the widget to be rendered so make sure you display the widget before calling any of these methods beforehand like so

```
w = ipycmc.MapCMC()
w
```

---

`.load_layer_config(url, handle_as, default_ops={})` - load a layer config into the mapping widget
 * `url`: _string_ - the url endpoint of the config (such as WMS or WMTS GetCapabilities endpoint)
 * `handle_as`: _string_ - ["json", "wmts/xml", "wms/xml"] the type of config endpoint to be loaded
 * `default_ops`: _dict_ - a dictionary of default options to apply to the loaded layers. If loading from a GIBS endpoint, you might use: `{"handleAs": "GIBS_raster"}`.

Example
```
w.load_layer_config(
    "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities",
    "wmts/xml",
    {"handleAs": "GIBS_raster"}
)
```
When loading 3D layers from MAAP's CMR you must include `"json"` and `{"handleAs": "vector-3d-tile"}`.

Example
```
w.load_layer_config(
    "https://cmr.maap-project.org/search/concepts/G1200354094-NASA_MAAP.json”, 
    "json”,  
    {“handleAs": "vector-3d-tile"})
```
---

`.set_date(date_str, format_str="")` - set the display date of the mapping widget
 * `date_str`: _string_ - date or datetime that the widget should be set to
 * `format_str`: _string_ - the format the of the date string. See token formats for MomentJS: https://momentjs.com/docs/#/parsing/string-format/

Example
```
w.set_date("2019-Jan-03", "YYYY-MMM-DD")
```

---

`.get_date()` - get the current widget display date as an ISO 8601 string

---

`.get_layers()` - get the list of ingested layer information dictionaries

---

`.get_area_selections()` - the the list of selected layer information dictionaries

---

`.get_active_layers()` - the the list of layer information dictionaries for layers currently active on the map
