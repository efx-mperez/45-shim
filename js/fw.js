// what if I just wanted to add tcp with no ports specififed? add the case in the exampled span
// accept masks?
// accept tables?
// include dsz in the default name
// mark source tags as "dangerous"
// accept ports separated by slashes
// I'm not checking for the default route properly (source cidrs)
// check if IPs are in the sot but in groups
// ip lookup whould tell you the rion
default_rule_check_memory = {sourceCIDRs: [], tcpPorts: [], udpPorts: [], icmp: false}
default_rule_check = (sourceCIDRs, tcpPorts, udpPorts, icmp) => {
    document.querySelector('.covered_by_default_rule').innerHTML = ''
    if(sourceCIDRs != -1)
        default_rule_check_memory.sourceCIDRs = sourceCIDRs
    if(tcpPorts != -1)
        default_rule_check_memory.tcpPorts = tcpPorts
    if(udpPorts != -1)
        default_rule_check_memory.udpPorts = udpPorts
    if(icmp != -1)
        default_rule_check_memory.icmp = icmp

    if(default_rule_check_memory.sourceCIDRs.length > 0 && 
        (default_rule_check_memory.tcpPorts.length>0 || default_rule_check_memory.udpPorts.length>0 || default_rule_check_memory.icmp)){ 
        console.log('checking if covered_by_default_rule')
        fw_default_fw_link = 'https://console.cloud.google.com/networking/firewalls/details/default-firewall?project='+sot_min.alliances[inputs['alliance']].environments[inputs['environment']]['svpc-project-id']
        fw_default_fw_link = '<a href="'+fw_default_fw_link+'">'+fw_default_fw_link+'</a>'        
        document.querySelector('.covered_by_default_rule').innerHTML = 'This traffic is already allowed by an existing FW rule [1]. If connections can\'t be established, there may be a missing route, another FW or an OS level configuration blocking them.<br><br>[1] '+fw_default_fw_link
        default_rule_check_memory.sourceCIDRs.forEach(sourceCIDR => {
            if(sourceCIDR.indexOf("10.") != 0 && sourceCIDR.indexOf("172.16") != 0 ||
                sourceCIDR.indexOf("10.") == 0 && parseInt(sourceCIDR.substr(sourceCIDR.indexOf('/')+1)) < 8 || 
                sourceCIDR.indexOf("172.16") == 0 && parseInt(sourceCIDR.substr(sourceCIDR.indexOf('/')+1)) < 12)
                document.querySelector('.covered_by_default_rule').innerHTML = ''
        })    
        default_rule_check_memory.tcpPorts.forEach(tcpPorts => {
            if(!["22", "80", "8080", "443", "8443", "3389"].includes(tcpPorts))
                document.querySelector('.covered_by_default_rule').innerHTML = ''
        })
        if(default_rule_check_memory.udpPorts.length > 0)
            document.querySelector('.covered_by_default_rule').innerHTML = ''
    }
}
reduceContinuousPorts = ports => {
    ports.sort((a, b)=>{return parseInt(a)-parseInt(b)})
    continuouslyReduced = 0
    for(let i=1;i<ports.length;i++){
        dashPosition_previous = ports[i-continuouslyReduced-1].indexOf('-')
        if(dashPosition_previous != -1){
            startingPort_previous = ports[i-continuouslyReduced-1].substr(0,dashPosition_previous)
            endPort_previous      = ports[i-continuouslyReduced-1].substr(dashPosition_previous+1)
        }
        else {
            startingPort_previous = ports[i-continuouslyReduced-1]
            endPort_previous = ports[i-continuouslyReduced-1]
        }
        dashPosition_current = ports[i].indexOf('-')
        if(dashPosition_current != -1){
            startingPort_current = ports[i].substr(0,dashPosition_current)
            endPort_current      = ports[i].substr(dashPosition_current+1)
        }
        else {
            startingPort_current = ports[i]
            endPort_current = ports[i]
        }
        if((delta = parseInt(startingPort_current)-parseInt(endPort_previous)) <= 1){
            if(delta==1)
                ports[i-continuouslyReduced-1] = startingPort_previous + '-' + endPort_current
            ports[i] = ''
            continuouslyReduced++
        }
        else
            continuouslyReduced = 0

    }
    return ports.map(port => port.trim())
        .filter(port => port.length)
}
isIPinGCP_memory = {}
document.querySelector('.ip').addEventListener('input', event => {
    document.querySelector('.is_ip_in_gcp').innerHTML = ''
    ips = event.target.value.split(/,|\s|\"/)
                    .map(ip => ip.trim())
                    .filter(ip => ip.length)
    
    tokens = ips.length
    ips = ips.filter(ip => ip.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/))
    if(tokens != ips.length)
        event.target.style.background = '#fdd'
    else
        event.target.style.background = 'white'

    ips.forEach(ip => {
        if(isIPinGCP_memory[ip])
            document.querySelector('.is_ip_in_gcp').innerHTML += isIPinGCP_memory[ip] + '<br>'
        else{
            var isIPinGCP_request = new XMLHttpRequest();
            isIPinGCP_request.onload = () => {
                searchResult = JSON.parse(isIPinGCP_request.response).searchResult
                ip = JSON.parse(isIPinGCP_request.response).ip
                if(searchResult != ""){
                    isIPinGCP_memory[ip] = ''
                    searchResult.split('|').slice(0, -1).forEach((match, i) => {
                        if(i > 0)
                            isIPinGCP_memory[ip] += '<br>'
                        isIPinGCP_memory[ip] += ip + ' is in ' + match.split(':')[1] + ' ' + match.split(':')[2]
                    })
                    document.querySelector('.firewall_inputs').querySelector('.alliance').value = searchResult.split(':')[0]
                    setTimeout((toTrigger)=>toTrigger.dispatchEvent(Object.assign(new Event('input'), {stopPopulating:1})), 0, document.querySelector('.firewall_inputs').querySelector('.alliance'))

                    document.querySelector('.firewall_inputs').querySelector('.environment').value = searchResult.split(':')[1].split('-')[1]
                    setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, document.querySelector('.firewall_inputs').querySelector('.environment'))

                } else {
                    isIPinGCP_memory[ip] = ip + ' is not in the SOT:<br>This is egress traffic which is already allowed by the GCP FW. If connections can\'t be established, there may be a missing route, another FW or an OS level configuration blocking them.<br>'
                }
                document.querySelector('.is_ip_in_gcp').innerHTML += isIPinGCP_memory[ip] + '<br>'
            }
            isIPinGCP_request.open('GET', 'isIPinGCP.php?ip='+ip);
            isIPinGCP_request.send();  
        }
    })
})
updatePRLink = (inputs) => {
    if(inputs['alliance'] && inputs['environment'] && inputs['jira']){
        fw_repo_link = 'https://bitbucket.equifax.com/projects/EFXGCPT/repos/'+inputs['alliance']+'_alliance_'+inputs['environment']+'/compare/diff?sourceBranch='+inputs['jira']
        return '<a href="'+fw_repo_link+'">'+fw_repo_link+'</a>'
    } else return 'Introduce an allaince, evironment and Jira'
}
document.querySelector('.firewall_inputs').querySelectorAll('input,textarea').forEach((input) => {
    input.addEventListener('input', event => {
        console.log('FW input triggered by %o ', event.target)
        inputs = get_inputs('.firewall_inputs')
        outputs = {}
        switch(event.target.name) {
            case "jira":
                if(!inputs['description'])
                    outputs.fw_description = JSON.stringify(event.target.value)
                outputs.fw_jira = event.target.value
                outputs.fw_PR_link = updatePRLink(inputs)
                break;
            case "alliance":
                outputs.fw_mnemonic = sot_min.alliances[inputs['alliance']].mnemonic
                outputs.fw_alliance = inputs['alliance']
                outputs.fw_PR_link = updatePRLink(inputs)
                if(!event.stopPopulating){
                    toPopulate = document.querySelector('.firewall_inputs').querySelector('.environment')
                    datalist = document.getElementById('datalist_fw_environments');
                    datalist.innerHTML = ''
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
                }
                console.log('left alliance case %o', outputs)
                break;
            case "environment":
                fw_custom_job_link = 'https://10.148.64.5/view/30-'+inputs['alliance']+'-'+inputs['environment']+'/job/'+inputs['alliance']+'_alliance_custom_'+inputs['environment']+'/build'
                outputs.fw_custom_job_link = '<a href="'+fw_custom_job_link+'">'+fw_custom_job_link+'</a>'
                fw_default_fw_link = 'https://console.cloud.google.com/networking/firewalls/details/default-firewall?project='+sot_min.alliances[inputs['alliance']].environments[inputs['environment']]['svpc-project-id']
                outputs.fw_default_fw_link = '<a href="'+fw_default_fw_link+'">'+fw_default_fw_link+'</a>'
                fw_repo_link = 'https://bitbucket.equifax.com/projects/EFXGCPT/repos/'+inputs['alliance']+'_alliance_'+inputs['environment']+'/browse'
                outputs.fw_repo_link = '<a href="'+fw_repo_link+'">'+fw_repo_link+'</a>'
                outputs.fw_environment = event.target.value
                outputs.fw_PR_link = updatePRLink(inputs)
                if(inputs['alliance'] != 'FedRAMP')
                    document.querySelector('.firewall_inputs').querySelector('.name').value = sot_min.alliances[inputs['alliance']].mnemonic+'-'+inputs['environment']+'-'
                else
                    document.querySelector('.firewall_inputs').querySelector('.name').value = ''
                setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, document.querySelector('.firewall_inputs').querySelector('.name'))

                toPopulate = document.querySelector('.firewall_inputs').querySelector('.dsz')
                datalist = document.getElementById('datalist_fw_dszs')
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
                console.log('left environment case %o', outputs)
                break;
            case "dsz":
                outputs.fw_dsz = event.target.value
                break;
            case "name":
                outputs.fw_name = JSON.stringify(event.target.value)
                if(event.target.value != sot_min.alliances[inputs['alliance']].mnemonic+'-'+inputs['environment']+'-'){
                    fw_FW_link = 'https://console.cloud.google.com/networking/firewalls/details/'+inputs['name']+'?project='+sot_min.alliances[inputs['alliance']].environments[inputs['environment']]['svpc-project-id']
                    outputs.fw_FW_link = '<a href ="'+fw_FW_link+'">'+fw_FW_link+'</a>'                    
                }
                if(!inputs['tags'])
                    outputs.fw_tags = '[' + JSON.stringify(event.target.value) + ']'
                break;
            case "sources":
                sourceTokens = inputs['sources'].split(/,|\s|\"/)
                    .map(source => source.trim())
                    .filter(source => source.length)
                    .map(source => {
                        if(source.indexOf('/') == -1)
                            return source+'/32'
                        else return source
                    })
                sourceCIDRs = sourceTokens.filter((source, i) => 
                    source.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[0-2][0-9]|[0-9])$/) &&
                    sourceTokens.indexOf(source) === i
                )
                if(sourceTokens.length != sourceCIDRs.length)
                    document.querySelector('.firewall_inputs').querySelector('.sources').style.background = '#fdd'
                else
                    document.querySelector('.firewall_inputs').querySelector('.sources').style.background = '#fff'
                sources = '[\n    '+ 
                    sourceCIDRs
                    .map(source => {
                        return "\"" + source + "\""
                    })
                    .join(",\n    ") +
                    '\n  ]'
                outputs.fw_sources = sources
                default_rule_check(sourceCIDRs, -1, -1, -1)
                break;
            case "source_tags":
                tags = JSON.parse('['+
                    event.target.value.split(/,|\s|\"/)
                    .map(tag => tag.trim())
                    .filter(tag => tag.length)
                    .map(tag => {
                        return "\"" + tag + "\""
                    })
                    .join(",") +
                    ']')
                if(tags.length)
                    outputs.fw_source_tags = '\n  source_tags = ' + JSON.stringify(tags)
                else
                    outputs.fw_source_tags = ''
                break;
            case "ports":
                tokens = inputs['ports'].split(/,|\s|\"/)
                    .map(port => port.trim())
                    .filter(port => port.length)
                tcpPorts = []
                udpPorts = []
                icmp = false
                document.querySelector('.firewall_inputs').querySelector('.ports').style.background = '#fff'
                tokens.forEach(token => {
                    if(token.indexOf('udp') != -1 && token.substr(3).match(/^\d+(-\d+)?$/))
                        udpPorts.push(token.substr(3))
                    else if (token.indexOf('tcp') != -1 && token.substr(3).match(/^\d+(-\d+)?$/))
                        tcpPorts.push(token.substr(3))
                    else if (token.match(/^\d+(-\d+)?$/))
                        tcpPorts.push(token)
                    else if (token == 'icmp')
                        icmp = true
                    else
                        document.querySelector('.firewall_inputs').querySelector('.ports').style.background = '#fdd'
                    if(token.match(/^\d+(-\d+)?$/) && parseInt(token.split('-')[0]) >= parseInt(token.split('-')[1]) )
                        document.querySelector('.firewall_inputs').querySelector('.ports').style.background = '#fdd'
                })
                
                tcpPorts = reduceContinuousPorts(tcpPorts)
                udpPorts = reduceContinuousPorts(udpPorts)

                res = ''
                if(!!tcpPorts.length)
                    res += '\n\
  allow {\n\
    protocol = "tcp"\n\
    ports = '+JSON.stringify(tcpPorts, null, 8).replace(']', '      ]')+'\n\
  }'
                if(!!udpPorts.length)
                    res += '\n\
  allow {\n\
    protocol = "udp"\n\
    ports = '+JSON.stringify(udpPorts, null, 8).replace(']', '      ]')+'\n\
  }'
                if(icmp)
                    res += '\n\
  allow {\n\
    protocol = "icmp"\n\
  }'
                outputs.fw_ports = res
                default_rule_check(-1, tcpPorts, udpPorts, icmp)
                break;
            case "description":
                outputs.fw_description = JSON.stringify(event.target.value)
                break;
            case "tags" :
                tags = JSON.parse('['+
                    event.target.value.split(/,|\s|\"/)
                    .map(tag => tag.trim())
                    .filter(tag => tag.length)
                    .map(tag => {
                        return "\"" + tag + "\""
                    })
                    .join(",") +
                    ']')
                outputs.fw_tags = JSON.stringify(tags)
                break;
            case "priority":
                document.querySelector('.firewall_inputs').querySelector('.priority').style.background = '#fff'
                if(event.target.value.match(/^\d+$/))
                    outputs.fw_priority = JSON.stringify(event.target.value)
                else
                    document.querySelector('.firewall_inputs').querySelector('.priority').style.background = '#fdd'
                break;
        }
        Object.keys(outputs).forEach(output => {
            document.querySelector('.firewall_outputs').querySelectorAll('.'+output).forEach(e=>e.innerHTML = outputs[output])
        })
    })
})