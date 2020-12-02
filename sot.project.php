<?php 
	if($_GET['alliance'] && $_GET['environment'] && $_GET['team'] && $_GET['project'])
		echo shell_exec("jq '.alliances.\"".$_GET['alliance']."\".environments.\"".$_GET['environment']."\".teams.\"".$_GET['team']."\".projects.\"".$_GET['project']."\"' `cat repo_path.txt`/sot.json");
	else{
		echo "alliance: ".$_GET['alliance']."<br>";
		echo "environment: ".$_GET['environment']."<br>";
		echo "team: ".$_GET['team']."<br>";
		echo "project: ".$_GET['project']."<br>";
	}
?>