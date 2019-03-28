import json
import os

prefix = os.getcwd() if (os.getcwd() != '/') else ''
fields_path = prefix + '/src/fields.json'
# getCapabilities, execute, getStatus, getResult, dismiss, describe

def getFields(param):
	try:
		with open(fields_path) as fields:
			data = json.load(fields)
			return data[param]
	except:
		return []