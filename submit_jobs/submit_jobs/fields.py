import json
import os

fields_path = os.getcwd()+'/src/fields.json'
# getCapabilities, execute, getStatus, getResult, dismiss, describe

def getFields(param):
	try:
		with open(fields_path) as fields:
			data = json.load(fields)
			return data[param]
	except:
		return []