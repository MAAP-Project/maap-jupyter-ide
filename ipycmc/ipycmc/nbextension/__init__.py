#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Flynn Platt
# Distributed under the terms of the Modified BSD License.

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'nbextension/static',
        'dest': 'ipycmc',
        'require': 'ipycmc/extension'
    }]
