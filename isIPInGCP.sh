#!/bin/bash

# $1 ip to test
# $2 path to sot.jon

input=$(echo $1 | tr '.' ' ' | awk '{printf "%d", $1*256**3+$2*256**2+$3*256+$4;}')
paddedInputIP=$(echo $1 | sed -E 's/\./ /g' | awk '{printf "%03d.%03d.%03d.%03d\n",$1,$2,$3,$4}')

# cidrs.txt is populated by git_pull.sh
while read line; do 
	if [ ${line:0:15} \< "$paddedInputIP" ] || [ ${line:0:15} = "$paddedInputIP" ]; then 
		candidateSubnet=$(echo ${line:0:15} | tr '.' ' ' | awk '{printf "%d", $1*256**3+$2*256**2+$3*256+$4;}')
		mask=$((0xFFFFFFFF<<$((32-$(echo $line | awk '{print $2}') )) & 0xFFFFFFFF))
		# echo 'candidate line: ' $line
		# echo 'obase=2; '$candidateSubnet | bc
		# echo 'obase=2; '$input | bc 
		if [ $((candidateSubnet & mask)) -eq $((input & mask)) ]; then
			candidateSubnetIP=$(echo ${line:0:15} | tr '.' ' ' | awk '{printf "%d.%d.%d.%d",$1,$2,$3,$4;}')
			echo $candidateSubnetIP $line | awk '{printf "%s %s/%s|",$4,$1,$3}'
		else
			break
		fi		
	fi
done < cidrs.txt
