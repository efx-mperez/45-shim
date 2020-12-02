<?php 
	echo shell_exec('echo "{\"searchResult\": \"`./isIPinGCP.sh '.$_GET['ip'].'`\",\"ip\": \"'.$_GET['ip'].'\"}"');
?>