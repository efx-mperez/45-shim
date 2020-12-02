// todo add "include uat project as well" checkbox
// as soon as I replace authoratative api list by current apis, I can paint the additive fields with red
// add a delete button for every new subnet you add?
// tell me the region of the subnets I would remove with the buttons
// if no folder then git clone ssh://git@bitbucket.equifax.com:7999/efxgcpt/global_consumer_solutions_alliance_prd.git
// in project additions, I'm not removing the red subnet buttons
// provide necessary inputs for the group creation request
// the sdlc is independent from the other fields right now, maybe I should add some logic in the future to extract it from the project code or from the project name
region_dsz_combinations = {}
var region_dsz_combinations_request = new XMLHttpRequest();
region_dsz_combinations_request.onload = () => {
    region_dsz_combinations = JSON.parse(
        '[' +
        region_dsz_combinations_request.response.split(/,|\s|\"/)
        .map(region_dsz_combination => region_dsz_combination.trim())
        .filter(region_dsz_combination => region_dsz_combination.length && region_dsz_combination.indexOf('/') != 0 )
        .map(region_dsz_combination => {
            if(region_dsz_combination.slice(-1) == '/')
                region_dsz_combination = region_dsz_combination.slice(0, -1)
            return "\"" + region_dsz_combination + "\""
        })
        .join(",") +
        ']'
    )
    region_dsz_combinations.forEach(region => {
        document.querySelector('.modifySubnetButtons').innerHTML += '\
            <span class="addSubntsRow">\
                <button data-region="'+region+'" class="modifySubnets">VM</button>\
                <button data-region="'+region+'" class="modifySubnets">Dataflow</button>\
                <button data-region="'+region+'" class="modifySubnets">Dataproc</button>\
                <button data-region="'+region+'" class="modifySubnets">Filestore</button>\
                <button data-region="'+region+'" class="modifySubnets">Lift&Shift</button>\
                <button data-region="'+region+'" class="modifySubnets">XS GKE</button>\
                <button data-region="'+region+'" class="modifySubnets">S GKE</button>\
                <button data-region="'+region+'" class="modifySubnets">M GKE</button>\
                <button data-region="'+region+'" class="modifySubnets">L GKE</button>\
                <button data-region="'+region+'" class="modifySubnets">XL GKE</button>\
                - <span class="region_label">'+region+'</span>\
            </span>\
            <br>'
    })
}
region_dsz_combinations_request.open('GET', 'region_dsz_combinations.txt');
region_dsz_combinations_request.send();

cleanAPIs = inputText => {
        return '[' +
        inputText.split(/,|\s|\"/)
        .map(api => api.trim())
        .filter(api => api.length)
        .map(api => {
            if (!api.endsWith(".googleapis.com"))
                api += ".googleapis.com"
            return api
        })
        .filter(api => {
            // check the general whitelist
            if(sot_min.allowed_apis.general.indexOf(api) > -1)
                return true
            // check the current environment whitelist
            if(inputs['environment'] && sot_min.allowed_apis[inputs['environment']] && sot_min.allowed_apis[inputs['environment']].indexOf(api) > -1)
                return true
            // check project level api overrides
            if(selected_project(inputs) && selected_project(inputs).apis && selected_project(inputs).apis.override && selected_project(inputs).apis.override.whitelist && selected_project(inputs).apis.override.whitelist.add && selected_project(inputs).apis.override.whitelist.add.indexOf(api) > 1)
                return true
            return false
        })
        .map(api => {
            return "\"" + api + "\""
        })
        .join(",") +
        ']'
}

document.querySelector('.project_inputs').querySelectorAll('input,textarea').forEach((input) => {
    input.addEventListener('input', event => {
        console.log('Project input triggered by %o ', event.target)
        result = JSON.parse(JSON.stringify(project_template))
        inputs = get_inputs('.project_inputs')
        outputs = {}

        switch(event.target.name){
            case "project_code":
                project_code = inputs['project_code'].trim()
                segments = project_code.split('-').length
                if(segments < 4)
                    document.querySelector('.project_inputs').querySelector('.project_code').style.background = '#fdd'
                else{
                    document.querySelector('.project_inputs').querySelector('.project_code').style.background = '#fff'
        
                    document.querySelector('.project_inputs').querySelector('.alliance').value = project_code.split('-')[0]
                    document.querySelector('.project_inputs').querySelector('.team').value = project_code.split('-')[1]
                    document.querySelector('.project_inputs').querySelector('.project').value = project_code.split('-').slice(2, -1).join('-')
                    document.querySelector('.project_inputs').querySelector('.environment').value = project_code.split('-')[segments-1]
                    
                    alliance = ''
                    Object.keys(sot_min.alliances).forEach(alliance => {
                        if(sot_min.alliances[alliance].mnemonic == project_code.split('-')[0])
                            window.alliance = alliance
                    })
                    if(!alliance)
                        document.querySelector('.project_inputs').querySelector('.project_code').style.background = '#fdd'
                    else{
                        document.querySelector('.project_inputs').querySelector('.alliance').value = alliance
                        setTimeout((toTrigger)=>toTrigger.dispatchEvent(Object.assign(new Event('input'), {cameFromCode:1})), 0, document.querySelector('.project_inputs').querySelector('.alliance'))
                    }
                }
                break;
            case "alliance": 
                toPopulate = document.querySelector('.environment')
                datalist = document.getElementById('datalist_environments');
                datalist.innerHTML = ''
                try{
                    Object.keys(sot_min.alliances[inputs['alliance']].environments).forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    if(!event.cameFromCode)
                       toPopulate.value = datalist.querySelectorAll('option')[0].value
                } catch(err) {
                    toPopulate.value = ''
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(Object.assign(new Event('input'), {cameFromCode:event.cameFromCode})), 0, toPopulate)
            break;
            case "environment":
                toPopulate = document.querySelector('.team')
                datalist = document.getElementById('datalist_teams');
                datalist.innerHTML = ''
                try{
                    Object.keys(sot_min.alliances[inputs['alliance']].environments[inputs['environment']].teams).forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    if(!event.cameFromCode)
                        toPopulate.value = datalist.querySelectorAll('option')[0].value
                } catch(err) {
                    toPopulate.value = ''
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(Object.assign(new Event('input'), {cameFromCode:event.cameFromCode})), 0, toPopulate)

                sdlcField = document.querySelector('.sdlc')
                sdlcDatalist = document.getElementById('datalist_sdlcs');
                sdlcDatalist.innerHTML = ''
                if(inputs['environment'] == 'npe'){
                    ['dev', 'qa', 'uat', 'crt'].forEach(option_value => {
                        option = document.createElement('option');
                        option.value = option_value
                        sdlcDatalist.appendChild(option);    
                    })
                }
                if(inputs['environment'] == 'prd'){
                    ['uat', 'prd'].forEach(option_value => {
                        option = document.createElement('option');
                        option.value = option_value
                        sdlcDatalist.appendChild(option);    
                    })
                }
                //setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input'))), 0, sdlcField)
            break;
            case "team":
                toPopulate = document.querySelector('.project')
                datalist = document.getElementById('datalist_projects');
                datalist.innerHTML = ''
                if(selected_team(inputs)){
                    teamAction_input = 'no-op'
                    selected_team(inputs).projects.forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    if(!event.cameFromCode)
                        toPopulate.value = datalist.querySelectorAll('option')[0].value
                }
                else{
                    teamAction_input = 'add'
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, toPopulate)
            break;
            case "project":
                if(selected_project(inputs)){
                    document.querySelector('.removeCurrentSubnetButtons').innerHTML = 'Loading...'
                    projectAction_input = "no-op"
                    link = 'sot.project.php?alliance=' + inputs['alliance'] + '&environment=' + inputs['environment'] + '&team=' + inputs['team'] + '&project=' + inputs['project'];
                    outputs.current_project = '<a target="_blank" href="'+link+'">'+inputs['project']+'</a>';

                    var sot_project_request = new XMLHttpRequest();
                    sot_project_request.onload = () => {
                        sot_project = JSON.parse(sot_project_request.response)
                        document.querySelector('.removeCurrentSubnetButtons').innerHTML = ''
                        Object.keys(sot_project.networks).forEach((e) => {
                            document.querySelector('.removeCurrentSubnetButtons').innerHTML += '<button class="modifySubnets">Remove \"'+e+'\"</button>'
                        })
                        project_xvpc = 'https://console.cloud.google.com/networking/xpn/details?project='+sot_project['project-id']
                        document.querySelector('.project_outputs').querySelectorAll('.project_xvpc').forEach(e=>e.innerHTML = '<a href="'+project_xvpc+'">'+project_xvpc+'</a>')
                    }
                    sot_project_request.open('GET', 'sot.project.php?alliance=' + inputs['alliance'] + '&environment=' + inputs['environment'] + '&team=' + inputs['team'] + '&project=' + inputs['project']);
                    setTimeout(() => {sot_project_request.send();}, 0)
                    setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, document.querySelector('.add_non_default_apis'))
                } else {
                    //delete sot_project
                    sot_project = undefined
                    projectAction_input = "add"
                    if(inputs['project'] === ''){
                        outputs.current_project = 'No project has been selected'
                        outputs.project_xvpc = 'No project has been selected'
                    }
                    else{
                        outputs.current_project = 'No project has been selected'
                        outputs.project_xvpc = 'Project doesn\'t exist'
                    }
               }
            break;
        }

        // alliance
        if (!result.alliances[inputs['alliance']]) {
            result.alliances[inputs['alliance']] =
                result.alliances.ALLIANCE;
            delete result.alliances.ALLIANCE
        }

        // environment
        if (!result.alliances[inputs['alliance']].environments[inputs['environment']]) {
            result.alliances[inputs['alliance']].environments[inputs['environment']] =
                result.alliances[inputs['alliance']].environments.ENVIRONMENT
            delete result.alliances[inputs['alliance']].environments.ENVIRONMENT
        }

        // team
        if (!result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']]) {
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']] =
                result.alliances[inputs['alliance']].environments[inputs['environment']].teams.TEAM
            delete result.alliances[inputs['alliance']].environments[inputs['environment']].teams.TEAM
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].action = teamAction_input
        }

        // project
        if (!result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']]) {
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']] =
                result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects.PROJECT
            delete result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects.PROJECT
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].action = projectAction_input
        }

        // apis
        if(inputs['apis_add'] && !inputs['apis']){
            if(!result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis)
                result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis = {}

            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis.add =
            JSON.parse(cleanAPIs(inputs['apis_add'])).filter(api => { return !sot_project || get_non_default_apis(1).indexOf(api) == -1 })
        }
        if(inputs['apis_delete'] && !inputs['apis']){
            if(!result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis)
                result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis = {}

            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis.delete = 
            JSON.parse(cleanAPIs(inputs['apis_delete'])).filter(api => { return get_non_default_apis(1).indexOf(api) != -1})    
        }
        if (inputs['apis'] && event.target.name != "project" && (!sot_project || sot_project && inputs['apis'] != get_non_default_apis())){
            document.querySelector('.project_inputs').querySelector('.apis_add').style.background = inputs['apis_add']?'#fdd':'#fff'
            document.querySelector('.project_inputs').querySelector('.apis_delete').style.background = inputs['apis_delete']?'#fdd':'#fff'
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].allowed_apis = JSON.parse(
                cleanAPIs(inputs['apis'])
            )
            delete result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].apis
        } else {
            document.querySelector('.project_inputs').querySelector('.apis_add').style.background = '#fff'
            document.querySelector('.project_inputs').querySelector('.apis_delete').style.background = '#fff' 
        }

        //flags 
        if (inputs['flags'])
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].flags = JSON.parse(
                '[' +
                inputs['flags']
                .split(",")
                .map(flag => {
                    return flag.trim()
                })
                .filter(flag => {
                    return flag.length
                }).map(flag => {
                    flag = flag[0].toUpperCase() + flag.slice(1);
                    return "\"" + flag + "\""
                })
                .join(",") +
                ']'
            )

        //sdlc
        if (inputs['sdlc'])
            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].sdlc = inputs['sdlc']

        // subnets
        if (inputs['subnets']){
            document.querySelector('.subnets').style.background = 'white'
            try {
                var i = 0;
                JSON.parse(
                        '[' + inputs['subnets'] + ']'
                    )
                    .forEach(function(subnet) {
                        result_subnet = JSON.parse(JSON.stringify(subnet_template))
                        if(subnet.del){
                            result_subnet.action = "del"
                            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].networks[subnet.del] = result_subnet
                        } else{
                            result_subnet.action = "add"
                            result_subnet.region = subnet.region
                            if (subnet.gke)
                                result_subnet.gke = subnet.gke
                            else
                                result_subnet.flags = subnet.flags
                            result.alliances[inputs['alliance']].environments[inputs['environment']].teams[inputs['team']].projects[inputs['project']].networks['allocate-' + i++] = result_subnet
                        }
                    })
            } catch (e) {
                document.querySelector('.subnets').style.background = '#fdd'
            }
        }
        outputs.project_result = JSON.stringify(result, null, 2)
        Object.keys(outputs).forEach(output => {
            document.querySelector('.project_outputs').querySelectorAll('.'+output).forEach(e=>e.innerHTML = outputs[output])
        })
    })
})

document.querySelector('.modifySubnetButtons').addEventListener('click', event => {
    if(event.target.className === 'modifySubnets'){
        region = event.target.dataset.region
        if (document.querySelector('.subnets').value.length)
            document.querySelector('.subnets').value += ',\n'
        if (event.target.innerHTML == "VM")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "flags": ["VM", "/27"]}'
        if (event.target.innerHTML == "Dataproc")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "flags": ["DATAPROC", "/24"]}'
        if (event.target.innerHTML == "Dataflow")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "flags": ["DATAFLOW", "/24"]}'
        if (event.target.innerHTML == "Filestore")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "flags": ["FILESTORE", "/29"]}'
        if (event.target.innerHTML == "Lift&amp;Shift")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "flags": ["LIFTANDSHIFT", "/24"]}'
        if (event.target.innerHTML == "XS GKE")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "gke": {"size": "xs"}}'
        if (event.target.innerHTML == "S GKE")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "gke": {"size": "small"}}'
        if (event.target.innerHTML == "M GKE")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "gke": {"size": "medium"}}'
        if (event.target.innerHTML == "L GKE")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "gke": {"size": "large"}}'
        if (event.target.innerHTML == "XL GKE")
            document.querySelector('.subnets').value += '{"region": "'+region+'", "gke": {"size": "xl"}}'
        if (event.target.innerHTML.indexOf("Remove")!=-1)
            document.querySelector('.subnets').value += '{"del": "' + event.target.innerHTML.split('"')[1] + '"}'
        document.querySelector('.subnets').dispatchEvent(new Event('input'))
    }
})
document.querySelectorAll('.modifyFlags').forEach((button) => {
    button.addEventListener('click', event => {
        if (document.querySelector('.flags').value.length)
            document.querySelector('.flags').value += ', '
        if (event.target.innerHTML.indexOf("Composer") > -1)
            document.querySelector('.flags').value += "Composer"   
        document.querySelector('.flags').dispatchEvent(new Event('input'))     
    })
})
get_non_default_apis = (asArray) => {
    non_default_apis = sot_project.allowed_apis.filter(api => {
        override_defaults_add = []
        if(sot_project.apis && sot_project.apis.override && sot_project.apis.override.defaults && sot_project.apis.override.defaults.add)
            override_defaults_add = sot_project.apis.override.defaults.add
        return sot_min.allowed_apis.defaults.indexOf(api) == -1 && override_defaults_add.indexOf(api) == -1
    })
    if(asArray)
        return non_default_apis
    return non_default_apis.join(',\n')
}
document.querySelector('.add_non_default_apis').addEventListener('click', event => {
    if(selected_project(get_inputs('.project_inputs'))){
        document.querySelector('.project_inputs').querySelector('.apis').value = get_non_default_apis()
        document.querySelector('.project_inputs').querySelector('.apis').dispatchEvent(new Event('input'))     
    }
})
