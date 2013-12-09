<?php

?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>F-GPLOM</title>
	<link rel="stylesheet" type="text/css" href="css/main.css"/>
	<script type='text/javascript' src='js/d3.v3.min.js'></script>
	<script type='text/javascript' src='js/gplom.js'></script>
</head>

<body onload="interfaceInit()">
	
	<div id="vizWrapper">
		<svg id="viz" xmlns="http://www.w3.org/2000/svg"></svg>
	</div>
	<ul id="filter"></ul>
	<div id="varSelection">
		<span class="helperSpanToAlignImageVertically"></span>+
		<ul id="varSelectionUL"></ul>
	</div>
	
</body>
</html>
