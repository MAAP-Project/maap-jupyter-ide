import json
import os

FILEPATH = os.path.dirname(os.path.abspath(__file__))
WORKDIR = FILEPATH+'/..'
fields_path = WORKDIR+'/src/fields.json'
# getCapabilities, execute, getStatus, getResult, dismiss, describe

def getFields(param):
	try:
		with open(fields_path) as fields:
			data = json.load(fields)
			return data[param]
	except:
		return []
