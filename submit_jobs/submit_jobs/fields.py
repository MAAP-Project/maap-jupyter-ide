import json

fields_path = '../submit_jobs/src/fields.json'
# getCapabilities, execute, getStatus, getResult, dismiss, describe

def getFields(param):
	try:
		with open(fields_path) as fields:
			data = json.load(fields)
			return data[param]
	except:
		return []
