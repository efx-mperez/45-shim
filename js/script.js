// todo: add icon
// todo : what's the snow id for this /22?

var sot_min = {}
var sot_project
get_sot_min = () => {
    var sot_min_request = new XMLHttpRequest();
    sot_min_request.onload = () => {
        sot_min = JSON.parse(sot_min_request.response)
        isIPinGCP_memory = {}
        
        // populate alliance options
        alliances_datalist = document.getElementById('datalist_alliances');
        Object.keys(sot_min.alliances).forEach(option_value => {
            option = document.createElement('option');
            option.value = option_value;
            alliances_datalist.appendChild(option);
        });
        sot_min.alliances['FedRAMP'] = {mnemonic: 'fr', environments: {
            "npe": {teams:{}, dszs: {TRUSTED: 1}, "svpc-project-id": "efx-gcp-fr-svpc-npe-36ff"},
            "prd": {teams:{}, dszs: {TRUSTED: 1}, "svpc-project-id": "efx-gcp-fr-svpc-prd-83d6"}
        }}
        alliances_datalist = document.getElementById('datalist_fw_alliances');
        Object.keys(sot_min.alliances).forEach(option_value => {
            option = document.createElement('option');
            option.value = option_value;
            alliances_datalist.appendChild(option);
        });
        alliances_datalist = document.getElementById('datalist_fs_alliances');
        Object.keys(sot_min.alliances).forEach(option_value => {
            option = document.createElement('option');
            option.value = option_value;
            alliances_datalist.appendChild(option);
        });
        
        document.querySelector('.firewall_inputs').querySelector('.alliance').value = datalist_fw_alliances.options[0].value
        document.querySelector('.firewall_inputs').querySelector('.alliance').dispatchEvent(new Event('input', {
            bubbles: true,
            cancelable: true,
        }))
        document.querySelector('.filestore_inputs').querySelector('.alliance').value = datalist_fw_alliances.options[0].value
        document.querySelector('.filestore_inputs').querySelector('.alliance').dispatchEvent(new Event('input', {
            bubbles: true,
            cancelable: true,
        }))
    }
    sot_min_request.open('GET', 'sot.min.json');
    sot_min_request.send();
}
get_sot_min()

project_template = {
    "format_version": "0.3.8",
    "alliances": {
        "ALLIANCE": {
            "environments": {
                "ENVIRONMENT": {
                    "teams": {
                        "TEAM": {
                            "action": "no-op",
                            "projects": {
                                "PROJECT": {
                                    "action": "no-op",
                                    "cost_center": "12345",
                                    "networks": {},
                                    "apis": {}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
subnet_template = {
    "action": "add"
}

document.querySelectorAll('.copy').forEach(button => {
    button.addEventListener('click', (event) => {
        const el = document.createElement('textarea');
        el.value = document.querySelector('.'+event.target.dataset.copy).textContent;

        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('copied');
    })  
})

document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('click', event => {
        event.target.select()
    })
})
teamAction_input = "no-op"
projectAction_input = "no-op"

get_inputs = (input_set_selector) => {
    project_inputs = document.querySelector(input_set_selector)
    res = {}
    Array.from(document.querySelector(input_set_selector).querySelectorAll('input, textarea')).forEach(e => {
        res[e.className] = e.value
    })
    return res
}
selected_alliance = (selections) => {
    if(sot_min.alliances)
        return sot_min.alliances[selections['alliance']]
    return false
}
selected_environment = (selections) => {
    if(selected_alliance(selections) && selected_alliance(selections).environments)
        return selected_alliance(selections).environments[selections['environment']]
    return false
}
selected_team = (selections) => {
    if(selected_environment(selections) && selected_environment(selections).teams)
        return selected_environment(selections).teams[selections['team']]
    return false
}
selected_project = (selections) => {
    if(selected_team(selections) && selected_team(selections).projects)
        return selected_team(selections).projects.indexOf(selections['project']) > -1
    return false
}

document.querySelector('.dangerous_field .toggle_link').addEventListener('click', event => {
    event.preventDefault()
    content = event.target.parentNode.querySelector('.content')
    content.style.display = 'block'
    closed_margin = content.offsetHeight/-2
    if(event.target.textContent == 'Empty and Hide'){
        authoratativeAPIsInput = event.target.parentNode.querySelector('textarea')
        authoratativeAPIsInput.value = ''
        setTimeout((toTrigger)=>toTrigger.dispatchEvent(new Event('input')), 0, authoratativeAPIsInput)
        event.target.textContent = 'Show'

        content.animate([
                {'transform': 'scaleY(1)', 'margin': '0'},
                {'transform': 'scaleY(0)', 'margin': closed_margin+'px 0'}
            ], 500)
        content.style.transform = 'scaleY(0)'
        content.style.margin = closed_margin+'px 0'
    }
    else {
        event.target.textContent = 'Empty and Hide'
        
        content.animate([
                {'transform': 'scaleY(0)', 'margin': closed_margin+'px 0'},
                {'transform': 'scaleY(1)', 'margin': '0'}
            ], 500)
        content.style.transform = 'scaleY(1)'
        content.style.margin = '0'
    }
})

document.querySelector('.git_pull').addEventListener('click', event => {
    document.querySelector('.commit').innerHTML = 'Loading...'
    var git_pull_request = new XMLHttpRequest();
    git_pull_request.onload = () => {
        response = JSON.parse(git_pull_request.response)
        document.querySelector('.commit').innerHTML = response.commit
        document.querySelector('.project').dispatchEvent(new Event('input', {
            bubbles: true,
            cancelable: true,
        }))
    }
    git_pull_request.open('GET', 'git_pull.php?first_pull='+first_pull);
    git_pull_request.send();
    if(first_pull){
        first_pull = false
    }
    get_sot_min()
})
first_pull = true;
document.querySelector('.git_pull').dispatchEvent(new Event('click', {
    bubbles: true,
    cancelable: true,
}))

