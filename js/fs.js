// todo check if I'm missing any quicklinks
// todo add "code" input similar to the one on the projects section
sot_project_fs = {}
updatePRLink = (inputs) => {
    if(inputs['alliance'] && inputs['environment'] && inputs['jira']){
        fw_repo_link = 'https://bitbucket.equifax.com/projects/EFXGCPT/repos/'+inputs['alliance']+'_alliance_'+inputs['environment']+'/compare/diff?sourceBranch='+inputs['jira']
        return '<a href="'+fw_repo_link+'">'+fw_repo_link+'</a>'
    } else return 'Introduce an allaince, evironment and Jira'
}
document.querySelector('.filestore_inputs').querySelectorAll('input,textarea').forEach((input) => {
    input.addEventListener('input', event => {
        console.log('FS input triggered by %o ', event.target)
        inputs = get_inputs('.filestore_inputs')
        outputs = {}
        switch(event.target.name) {
            case "jira":
                if(!inputs['description'])
                    outputs.fs_description = JSON.stringify(event.target.value)
                outputs.fs_jira = event.target.value
                outputs.fs_PR_link = updatePRLink(inputs)
                break;
            case "alliance":
                outputs.fs_mnemonic = sot_min.alliances[inputs['alliance']].mnemonic
                outputs.fs_alliance = inputs['alliance']
                toPopulate = document.querySelector('.filestore_inputs').querySelector('.environment')
                datalist = document.querySelector('#datalist_fs_environments');
                datalist.innerHTML = ''
                outputs.fs_PR_link = updatePRLink(inputs)
                try{
                    Object.keys(sot_min.alliances[inputs['alliance']].environments).forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    toPopulate.value = datalist.querySelectorAll('option')[0].value
                } catch(err) {
                    toPopulate.value = ''
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, toPopulate)
                break;
            case "environment":
                fs_custom_job_link = 'https://10.148.64.5/view/30-'+inputs['alliance']+'-'+inputs['environment']+'/job/'+inputs['alliance']+'_alliance_custom_'+inputs['environment']+'/build'
                outputs.fs_custom_job_link = '<a href="'+fs_custom_job_link+'">'+fs_custom_job_link+'</a>'
                fs_repo_link = 'https://bitbucket.equifax.com/projects/EFXGCPT/repos/'+inputs['alliance']+'_alliance_'+inputs['environment']+'/browse'
                outputs.fs_repo_link = '<a href="'+fs_repo_link+'">'+fs_repo_link+'</a>'
                outputs.fs_environment = event.target.value
                outputs.fs_PR_link = updatePRLink(inputs)

                toPopulate = document.querySelector('.filestore_inputs').querySelector('.team')
                datalist = document.getElementById('datalist_fs_teams');
                datalist.innerHTML = ''
                try{
                    Object.keys(sot_min.alliances[inputs['alliance']].environments[inputs['environment']].teams).forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    toPopulate.value = datalist.querySelectorAll('option')[0].value
                } catch(err) {
                    toPopulate.value = ''
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, toPopulate)

                toPopulate = document.querySelector('.filestore_inputs').querySelector('.dsz')
                datalist = document.getElementById('datalist_fs_dszs')
                datalist.innerHTML = ''
                Object.keys(sot_min.alliances[inputs['alliance']].environments[inputs['environment']].dszs).forEach(option_value => {
                    if(sot_min.alliances[inputs['alliance']].environments[inputs['environment']].dszs[option_value] != -1){
                        option = document.createElement('option');
                        option.value = '-'+option_value+'-'
                        datalist.appendChild(option);
                    }
                })
                option = document.createElement('option');
                option.value = '-'
                datalist.appendChild(option);
                toPopulate.value = datalist.querySelectorAll('option')[0].value
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, toPopulate)
                break;
            case "team":
                toPopulate = document.querySelector('.filestore_inputs').querySelector('.project')
                datalist = document.getElementById('datalist_fs_projects');
                datalist.innerHTML = ''
                if(selected_team(inputs)){
                    selected_team(inputs).projects.forEach((option_value, i) => {
                        option = document.createElement('option');
                        option.value = option_value
                        datalist.appendChild(option);
                    });
                    toPopulate.value = datalist.querySelectorAll('option')[0].value
                }
                else{
                    toPopulate.value = ''
                }
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, toPopulate)
                break;
            case "project":
                if(selected_project(inputs)){
                    link = 'sot.project.php?alliance=' + inputs['alliance'] + '&environment=' + inputs['environment'] + '&team=' + inputs['team'] + '&project=' + inputs['project'];
                    outputs.current_project_fs = '<a target="_blank" href="'+link+'">'+inputs['project']+'</a>';

                    var sot_project_fs_request = new XMLHttpRequest();
                    sot_project_fs_request.onload = () => {
                        sot_project_fs = JSON.parse(sot_project_fs_request.response)
                        datalist = document.getElementById('datalist_fs_cidrs')
                        datalist.innerHTML = ''
                        Object.keys(sot_project_fs.networks).forEach(option_value => {
                            network = sot_project_fs.networks[option_value]
                            if(network.cidr.substr(-3) == '/29'){
                                option = document.createElement('option');
                                option.value = network.cidr
                                option.dataset.region =  network.region
                                datalist.appendChild(option);
                            }
                        })
                    }
                    sot_project_fs_request.open('GET', 'sot.project.php?alliance=' + inputs['alliance'] + '&environment=' + inputs['environment'] + '&team=' + inputs['team'] + '&project=' + inputs['project']);
                    setTimeout(() => {sot_project_fs_request.send();}, 0)
                } else {
                    outputs.current_project_fs = 'No project has been selected'
                }
                break;
            case "dsz":
                outputs.fs_dsz = event.target.value
                break;
            case "name":
                outputs.fs_name = JSON.stringify(event.target.value)
                if(!inputs['fileshare_name'])
                    outputs.fs_fileshare_name = JSON.stringify(event.target.value).replace(/-/g, '_')
                break;
            case "fileshare_name":
                outputs.fs_fileshare_name = JSON.stringify(event.target.value).replace(/-/g, '_')
                break;
            case "capacity":            
                document.querySelector('.filestore_inputs').querySelector('.capacity').style.background = '#fff'
                if(event.target.value.match(/^\d*$/))
                    outputs.fs_capacity = event.target.value
                else
                    document.querySelector('.filestore_inputs').querySelector('.capacity').style.background = '#fdd'
                break;
            case "description":
                outputs.fs_description = JSON.stringify(event.target.value)
                break;
            case "cidr":
                document.querySelector('.filestore_inputs').querySelector('.cidr').style.background = '#fff'
                if(event.target.value.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/29$/)){
                    outputs.fs_cidr = JSON.stringify(event.target.value)
                    cidrInput = document.querySelector('.filestore_inputs').querySelector('.cidr')
                    outputs.fs_zone = JSON.stringify(cidrInput.list.querySelector('option[value="'+cidrInput.value+'"]').dataset.region + '-b')
                }
                else
                    document.querySelector('.filestore_inputs').querySelector('.cidr').style.background = '#fdd'
            break;
        }
        Object.keys(outputs).forEach(output => {
            document.querySelector('.filestore_outputs').querySelectorAll('.'+output).forEach(e=>e.innerHTML = outputs[output])
        })
    })
})
