import requests
import plotly
from plotly.offline import iplot
from random import randint

def retrieve_data(plot_type, start_date, end_date, layer_ids, geometry):
    req = requests.get('https://api.github.com/events')
    resp = req.json()
    return resp

def plot_data(plot_type="timeseries", data={}):
    sample_data = [randint(0,100) for x in range(100)]
    trace = plotly.graph_objs.Scatter(y=sample_data)
    fig = dict(data=[trace])
    return iplot(fig)
