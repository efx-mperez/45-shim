## 45 job shim

### Prerequisites
The `jq` command should be available  
The php dev server that comes installed on our Equifax Macs will be used so `php` should be available

### To start
```
./start.sh [--sot-repo|-s path_to_existing_metadata_sot_repo_on_master_branch]
```
`start.sh` will `git pull` and then extract data from sot.json  
A local web server will start on your next available port, starting from 8080  
Your preferred browser will be called to open a tab on the webpage  
Fill in the fields, watch how your JSON is created in real time  
Click on the `copy` button at the bottom of the page, then paste inside the 45 job  