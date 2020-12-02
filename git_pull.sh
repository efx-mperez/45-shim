sot_repo=`cat repo_path.txt`

(cd $sot_repo && ( [ "$1" == "true" ] || git pull -q) && git log -n 1 | tr '\n' '~' | sed s/~/\<br\>/g | sed -E "s/(https[^]]*)/<a href='\1'>\1<\\a>/g")
if [ "$1" != "true" ]; then
	jq '{
	        alliances: .alliances | map_values({
	            environments: .environments | map_values({
	                teams: .teams | map_values({
	                	projects: .projects | keys
	                }),
	                "dszs": ."host-project"."dsz-svpcs" | map_values(."peer-id"),
	                "svpc-project-id": ."host-project"."default-svpc"."project-id"
	            }), 
	            mnemonic: .mnemonic 
	        }),
	        allowed_apis: {npe:.apis.environments.npe.whitelist, prd:.apis.environments.prd.whitelist, general:.apis.whitelist, defaults: .apis.defaults}
	    }' $sot_repo'/sot.json' > sot.min.json
	jq -r '.alliances|keys[] as $alliance | 
		.[$alliance].mnemonic as $mnemonic |
		.[$alliance].environments|keys[] as $environment | 
		.[$environment].teams|keys[] as $team | 
		.[$team].projects|keys[] as $project | 
		.[$project].networks|keys[] as $network | 
		.[$network].cidr+" "+$alliance+":"+$mnemonic+"-"+$environment+"-"+$team+"-"+$project+":"+$network' $sot_repo'/sot.json' | 
		sed -E 's/\.|\// /g' | 
		awk '{printf "%03d.%03d.%03d.%03d %02d %s\n",$1,$2,$3,$4,$5,$6}' | 
		sort -r > cidrs.txt
	jq -r '.alliances[].environments[].teams[].projects[].networks[] | .region+"/"+.vpc.dsz' $sot_repo'/sot.json' | 
		sort | 
		uniq > region_dsz_combinations.txt
fi