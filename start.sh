#!/bin/sh

# check options
atLeast2Args () {
	if [ $1 -lt 2 ]; then
	    echo "Option '"$2"' requires an argument"
		exit 1    
	fi
}
while [ ! $# -eq 0 ]
do
	case "$1" in
		--sot-repo|-s)
			atLeast2Args $# $1
			sot_repo=$2
			shift
			;;
		*)
			echo "Usage: ./start.sh [--sot-repo|-s path_to_metadata_sot_repo]"
			exit
	esac
	shift
done

# pull on this repo
echo "git pull on this repo..."
git pull

# pull on the metadata-sot repo
echo "git pull on the metadata-sot repo..."
if [ -z "$sot_repo" ]; then
	sot_repo=metadata-sot
	if [ ! -d metadata-sot ]; then
		git clone https://bitbucket.equifax.com/scm/efxgcp/metadata-sot.git
		#git clone ssh://git@bitbucket.equifax.com:7999/efxgcp/metadata-sot.git
	fi
fi 
echo $sot_repo > repo_path.txt
./git_pull.sh >/dev/null
echo "pull done"
echo "generated sot.min.json"

# check ports in use
shim45port=8080
while echo exit | nc localhost $shim45port > /dev/null
do 
	echo 'port '$shim45port' already in use'
	((shim45port+=1))
done
echo "Using next available port: "$shim45port

open http://localhost:$shim45port
echo "Open for e-business"
php -S 0.0.0.0:$shim45port
# python3 -m http.server $shim45port

