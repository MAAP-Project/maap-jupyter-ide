from notebook.base.handlers import IPythonHandler
import requests
import xml.etree.ElementTree as ET
import json
import datetime
import os

from .fields import getFields

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self):
		json_file = "./submit_jobs/register.json"
		fields = getFields('register')

		params = {}
		# params['url_list'] = []
		# params['timestamp'] = str(datetime.datetime.today())
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass
		# params['run_cmd'] = 'python /app/plant.py'
		# params['algo_name'] = 'plant_test'
		# params['algo_desc'] = 'test plant'
		print(params)

		url = 'http://localhost:5000/api/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)

		print(req_json)

		r = requests.post(
			url=url,
			data=req_json,
			headers=headers
		)
		try:
			print(r.text)
			try:
				resp = json.loads(r.text)
				self.finish({"status_code": resp['code'], "result": resp['message']})
			except:
				self.finish({"status_code": 200, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		# submit job
		# fields = ['service', 'version','url']
		fields = getFields('getCapabilities')
		params = {}
		
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'GetCapabilities'

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		# url = params.pop('url',None)
		r = requests.get(
			url,
			params=params
		)

		try:
			try:
				# parse out algorithm titles & names
				rt = ET.fromstring(r.text)
				algo_lst = rt[4]
				algo_info = [(n[0].text, n[1].text) for n in algo_lst]
				result = ''

				# print algorithm name in indented new line below algorithm title
				for (title, algo_id) in algo_info:
					result += '{title}\n	{algo_id}\n\n'.format(title=title,algo_id=algo_id)

				print(result)
				self.finish({"status_code": r.status_code, "result": result})

			except:
				self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class ExecuteHandler(IPythonHandler):
	def get(self):
		# submit job
		xml_file = "./submit_jobs/execute.xml"
		fields = getFields('execute')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass
		# params['algo_id'] = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
		# params['version'] = 'master'
		# params['data_value'] = 5.0
		params['timestamp'] = str(datetime.datetime.today())

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		headers = {'Content-Type':'text/xml'}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url=url, 
			data=req_xml, 
			headers=headers
		)
		try:
			# rt = ET.fromstring(r.text)
			# job_id = rt[0].text
			# # print(job_id)
			# data = dig(rt[1])
			# # print(data)
			# result = job_id+'\n '+str(data)
			# print(result)
			print("success!")
			# self.finish({"status_code": r.status_code, "result": result})
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print("failed")
			self.finish({"status_code": r.status_code, "result": r.reason})

class GetStatusHandler(IPythonHandler):
	def get(self):
		xml_file = "./submit_jobs/getStatus.xml"
		fields = getFields('getStatus')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		# params['job_id'] = 'random_job_id'
		headers = {'Content-Type':'text/xml',}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url,
			data=req_xml,
			headers=headers
		)
		try:
			# resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})

class GetResultHandler(IPythonHandler):
	def get(self):
		xml_file = "./submit_jobs/getResult.xml"
		fields = getFields('getResult')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		headers = {'Content-Type':'text/xml'}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url,
			data=req_xml,
			headers=headers
		)
		try:
			# resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})

class DismissHandler(IPythonHandler):
	def post(self):
		fields = getFields('dismiss')
		params = {}

		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = params.pop('url',None)
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'Dismiss'
		r.requests.get(
			url,
			params=params
		)
		try:
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class DescribeProcessHandler(IPythonHandler):
	def get(self):
		xml_file = "./submit_jobs/describe.xml"
		fields = getFields('describeProcess')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		# params['algo_id'] = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
		# params['version'] = 'master'
		headers = {'Content-Type':'text/xml',}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url,
			data=req_xml,
			headers=headers
		)
		# print(r)

		try:
			# resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})
