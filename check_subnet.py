import sys
import json
#import click

bit_to_ip = {
	"15": "131072",
	"16": "65536",
	"17": "32768",
	"18": "16384",
	"19": "8192",
	"20": "4096",
	"21": "2048",
	"22": "1024",
	"23": "512",
	"24": "256",
	"25": "128",
	"26": "64",
	"27": "32",
	"28": "16",
	"29": "8",
	"30": "4",
	"31": "2",
	"32": "1"
}

gkesize_map = {
	"xs": "27",
	"small": "26",
	"medium": "25",
	"large": "24",
	"xl": "23"
}

def check_available_ips():

	alliance = None
	env = None
	team = None
	project = None
	regions = []
	networks_in_sot = None
	networks_in_json = None
	subnet_allocations = []
	input = None

	with open('input.json') as f: 
		input = json.load(f)

	for key in input['alliances'].keys():
		alliance = key

	for key in input['alliances'][alliance]['environments'].keys():
		env = key

	for key in input['alliances'][alliance]['environments'][env]['teams'].keys():
		team = key

	for key in input['alliances'][alliance]['environments'][env]['teams'][team]['projects'].keys():
		project = key

	networks_in_json = input['alliances'][alliance]['environments'][env]['teams'][team]['projects'][project]['networks']

	'''get networks in sot '''
	with open('./metadata-sot/sot.json') as f: 
		sot = json.load(f)
		networks_in_sot = sot['alliances'][alliance]['environments'][env]['networks']

	'''get unique regions '''
	regions = [val.get('region') for val in networks_in_json.values()]
	regions = list(dict.fromkeys(regions))	

	'''compare requested IP addresses and available ones in a region '''
	for region in regions:
		print('Requested IPs in {region}'.format(region=region))
		requested_ips = calculate_requested_ips(networks_in_json, region)
		print('  **Total requested IPs in {region} is {requested_ips}'
			.format(region=region, requested_ips=requested_ips))

		print('  Available IPs in {region}...'.format(region=region))
		available_ips = calculate_available_ips(networks_in_sot, region)
		print('  **Total available IPs in {region} is {available_ips}'
			.format(region=region, available_ips=available_ips))
		print()

def calculate_requested_ips(networks_in_json, region):
	total_requestd_ips = 0
	
	subnets = [
		val.get('flags') for val in networks_in_json.values() 
			if val.get('region') == region and val.get('flags') != None]
	if subnets:
		print('    subnets: {subnets}'.format(subnets=subnets))

	gkes = [
		val.get('gke') for val in networks_in_json.values() 
			if val.get('region') == region and val.get('gke') != None]
	if gkes:
		print('    gkes: {gkes}'.format(gkes=gkes))

	for subnet in subnets:
		bit = subnet[1].replace('/','')
		if bit:
			total_requestd_ips += int(bit_to_ip[bit])
		
	for gke in gkes:
		gkesize = gke['size']
		if not gkesize:
			continue
		total_requestd_ips += int(bit_to_ip["28"])
		total_requestd_ips += int(bit_to_ip[gkesize_map[gkesize]])
	
	return total_requestd_ips

def calculate_available_ips(networks_in_sot, region):
	total_available_ips = 0
	dsz = None
	
	if '/' in region:
		dsz = region.split('/')[1]
		region = region.split('/')[0]

	for k, network in networks_in_sot.items():
		if network['region'] != region:
			continue
		if "DO-NOT-ALLOCATE" in network['flags']:
			continue
		if not dsz and network['dsz']:
			continue
		if dsz and dsz != network['dsz']:
			continue  

		network_available_ips = int(bit_to_ip[network['cidr'].split('/')[1]])
		allocated_cidrs = network['subnets']['all']
		
		for allocated_cidr in allocated_cidrs:
			bit = allocated_cidr.split('/')[1]
			network_available_ips -= int(bit_to_ip[bit])
		
		print('    network={k}: available ips={aip}'
			.format(k=k, aip=network_available_ips))		
		total_available_ips += network_available_ips
	
	return total_available_ips

if __name__ == '__main__':
    check_available_ips()

