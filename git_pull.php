<?php 
	echo shell_exec('echo "{\"commit\": \"`./git_pull.sh '.$_GET['first_pull'].'`\"}"');
?>