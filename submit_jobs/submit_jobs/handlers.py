from notebook.base.handlers import IPythonHandler
import requests
import json

from .fields import getCapabilitiesFields, executeFields, getStatusFields, getResultFields, dismissFields

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		# submit job
		# fields = ['service', 'version','url']
		fields = getCapabilitiesFields()
		params = {}
		
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		params['url'] = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'GetCapabilities'

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		url = params.pop('url',None)
		r = requests.get(
			url,
			params=params
		)
		try:
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class ExecuteHandler(IPythonHandler):
	def post(self):
		# submit job
		fields = executeFields()
		params = {}
		
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		# url = params.pop('url',None)
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		r = requests.get(
			url,
			params=params
		)
		try:
			resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": result})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})

class GetStatusHandler(IPythonHandler):
	def get(self):
		fields = getStatusFields()
		params = {}

		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		# url = params.pop('url',None)
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		r.requests.get(
			url,
			params=params
		)

# class GetResultHandler(IPythonHandler):
# 	def get(self):
		# fields = getStatusFields()
		# params = {}

		# for f in fields:
		# 	try:
		# 		arg = self.get_argument(f.lower(), '')
		# 		params[f] = arg
		# 	except:
		# 		pass

		# url = params.pop('url',None)
		# url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		# r.requests.get(
		# 	url,
		# 	params=params
		# )

# class DismissHandler(IPythonHandler):
# 	def post(self):