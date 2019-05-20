#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Elizabeth Yam.
# Distributed under the terms of the Modified BSD License.

# from .example import ExampleWidget
from ._version import __version__, version_info

from .nbextension import _jupyter_nbextension_paths
from .hysds import HysdsMagic


def load_ipython_extension(ipython):
    m = HysdsMagic()
    ipython.register_magics(m)
