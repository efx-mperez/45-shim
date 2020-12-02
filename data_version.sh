#!/bin/bash

# https://bitbucket.equifax.com/projects/EFXGCP/repos/metadata-sot/browse/jenkins.d/README.md
# $1 jira_tag

[ $# -eq 0 ] && echo "Pass in the Jira as first parameter" && exit 

[ -d "metadata-schema" ] && cd metadata-schema && git checkout master && git stash && git pull && cd .. ||
git clone https://bitbucket.equifax.com/scm/efxgcp/metadata-schema.git

[ -d "automayte" ] && cd automayte && git checkout master && git stash && git pull && cd .. ||
git clone https://bitbucket.equifax.com/scm/efxgcp/automayte.git

[ -d "metadata-sot" ] && cd metadata-sot && git checkout master && git stash && git pull && cd .. ||
git clone https://bitbucket.equifax.com/scm/efxgcp/metadata-sot.git

cd metadata-sot
git checkout -b $1
cp sot/versions/data/PROTOTYPE.py sot/versions/data/$1.py
git add sot/versions/data/$1.py
open sot/versions/data/$1.py

echo "Update the docstring and implement"

echo "Would you like to test or are you ready to push? (push|any)"
while read input </dev/tty
do
  if [ "$input" = "push" ]; then
    break
  else
	./mott -S ../metadata-sot/sot.json --schema-root ../metadata-schema data-manager sanitize --apply-module sot.versions.data.$1
    echo "Data module applied, check the changes"
	echo "Would you like to test or push? (push|any)"
  fi
done

# git commit -m $1' data version'
# git push --set-upstream origin $1

echo "Pushed, create the PR at https://bitbucket.equifax.com/projects/EFXGCP/repos/metadata-sot/compare/diff?sourceBranch="$1
echo "then run the 90 job at https://10.148.64.5/job/90-metadata-version-manager/build"