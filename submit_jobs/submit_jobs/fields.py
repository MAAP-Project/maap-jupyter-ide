import json

fields_path = './src/fields.json'

def getCapabilitiesFields():
	with open(fields_path) as fields:
		data = json.load(fields)
		return data['getCapabilities']

def executeFields():
	with open(fields_path) as fields:
		data = json.load(fields)
		return data['execute']

def getStatusFields():
	with open(fields_path) as fields:
		data = json.load(fields)
		return data['getStatus']

def getResultFields():
	with open(fields_path) as fields:
		data = json.load(fields)
		return data['getResult']

def dismissFields():
	with open(fields_path) as fields:
		data = json.load(fields)
		return data['dismiss']
