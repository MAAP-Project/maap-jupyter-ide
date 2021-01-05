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