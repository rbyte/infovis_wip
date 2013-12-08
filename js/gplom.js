var vars
var filter = []
// for each data row, counts how many column filters filter one of its row cells
var filterMask
var highlightMask
var svg
var sliderColor = 200

function interfaceInit() {
	console.log("hi console :)")
//	scatter()
//	histTest()
//	heatmapTest()
	main()
}

function main() {
	var afterParsingDo = function() {
		console.log("parsing data done")
		var dataTypesCount = []
		var dataTypes = ["ordinal", "metric", "dichotomous", "nominal"]
		
		if (false) {
			for (var k=0; k<dataTypes.length; k++)
				dataTypesCount.push(0)

			for (var i=0; i<vars.length; i++)
				for (var k=0; k<dataTypes.length; k++)
					if (vars[i].dataType === dataTypes[k]) {
						dataTypesCount[k]++
						break
					}

			for (var k=0; k<dataTypes.length; k++) {
				console.log(dataTypes[k]+": "+dataTypesCount[k])
				for (var i=0; i<vars.length; i++)
					if (vars[i].dataType === dataTypes[k]) {
						console.log("\t"+vars[i].name+", "+vars[i].data.length+", "+vars[i].detail+", "+vars[i].dictionary)
					}
			}
			
			document.write(JSON.stringify(vars))
		}
		
		var numberOfVarsToDraw = 10
		if (vars.length > numberOfVarsToDraw)
			vars.splice(numberOfVarsToDraw, vars.length-numberOfVarsToDraw)
		
		var dataLength = vars[0].data.length
		filterMask = new Array(dataLength)
		highlightMask = new Array(dataLength)
		for (var k=0; k<dataLength; k++) {
			filterMask[k] = 0
			highlightMask[k] = 0
		}
		
		// find min & max in metric data
		for (var i=0; i<vars.length; i++) {
			if (vars[i].dataType === "metric") {
				var max = Number.NEGATIVE_INFINITY
				var min = Number.POSITIVE_INFINITY
				for (var k=0; k<vars[i].data.length; k++) {
					var v = vars[i].data[k]
					if (typeof v !== "string" && !isNaN(v) && v !== undefined) {
						if (v > max) max = v
						if (v < min) min = v
					}
				}
				if (max < min) { // no metric data found
					min = 0
					max = 1
				}
				if (max-min < 0.0001) { // same as scatterplot border
					max += 1
					min -= 1
				}
				vars[i].max = max
				vars[i].min = min
//				console.log(i+": "+min+", "+max)
			}
		}
		
		
		draw()
		
		console.log("done!")
	}
	
//	parseData("data/SHIP_2012_D_S2_20121129.json", afterParsingDo)
	parseDataFast("data/SHIP_2012_D_S2_20121129_improved.json", afterParsingDo)
	
//	createTestData(100)
}

function draw() {
	width = 1100
	height = 830
//	var width = 4000, height = 4000
	
	svg = d3.select("#viz").append("svg")
		.attr("width", width)
		.attr("height", height)
	
	if (false) svg
		.append("rect")
		.attr("x", 0).attr("y", 0)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "rgb(0,0,0)")
		.attr("fill-opacity", "0.03")
	
	defineGradients(svg)
	padding = 20
	createGplomMatrix(svg, padding, padding, width-2*padding, height-2*padding)
	
//	stream(svg)
}

function parseData(filename, callback) {
	vars = []
	var purgeDictEntriesNotFoundInData = true
	d3.json(filename, function(jsonData) {
		var varId = 0
		for (var key in jsonData) {
			var jsonDataKey = jsonData[key]
			console.assert(jsonDataKey.hasOwnProperty("name"))
			console.assert(jsonDataKey.hasOwnProperty("data"))
			console.assert(jsonDataKey.hasOwnProperty("description"))
			
			var desc = jsonDataKey.description
			console.assert(desc.hasOwnProperty("name"))
			console.assert(desc.hasOwnProperty("dataType"))
			console.assert(desc.hasOwnProperty("detail"))
			var isMetric = desc.dataType === "metric"
			var hasDict = desc.hasOwnProperty("dictionary")
			
			// filter
			if (key === "zz_nr")
				continue
			
			if (isMetric || hasDict) {
				vars.push(desc)
				vars[varId]["data"] = new Array(jsonDataKey.data.length)
			} else {
				// I dont know how to interpret that
				console.log("skipping: "+desc.name)
				continue
			}
			
			if (hasDict) {
				var newDict = []
				var oldToNewDictTranslation = {}
				if (!purgeDictEntriesNotFoundInData)
					for (var dictKey in desc.dictionary) {
						newDict.push(desc.dictionary[dictKey])
					}
				
				for (var i=0; i<vars[varId].data.length; i++) {
					var val = jsonDataKey.data[i]
//					console.assert(typeof val === "string")
					if (!isMetric) {
						console.assert(desc.dictionary.hasOwnProperty(val))
					}

					if (purgeDictEntriesNotFoundInData
						&& oldToNewDictTranslation[val] === undefined
						&& desc.dictionary[val] !== undefined) {
							oldToNewDictTranslation[val] = "x" // check
							newDict.push(desc.dictionary[val])
					}
					
					for (var k=0; k<newDict.length; k++)
						if (desc.dictionary[val] === newDict[k])
							vars[varId].data[i] = isMetric ? ""+k : k
					
					if (isMetric && vars[varId].data[i] === undefined)
						vars[varId].data[i] = convertStrToNumber(val)
				}
//				console.log(newDict)
				vars[varId].dictionary = newDict
			} else {
				if (desc.dataType === "metric") {
					for (var i=0; i<vars[varId].data.length; i++)
						vars[varId].data[i] = convertStrToNumber(jsonDataKey.data[i])
				}
			}
			varId++
		}
		callback()
	})
}

function parseDataFast(filename, callback) {
	d3.json(filename, function(jsonData) {
		vars = jsonData
		callback()
	})
}

function defineGradients(svg) {
	var defs = svg.append("defs")
	
	var lgrad = defs.append("linearGradient")
		.attr("id", "lg1")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%")
	
	lgrad
		.append("stop")
		.attr("stop-color", "rgb(200,200,200)")
		.attr("offset", "0%")
	
	lgrad
		.append("stop")
		.attr("stop-color", "rgb(240,240,240)")
		.attr("offset", "100%")
	
	var lgradBlue = defs.append("linearGradient")
		.attr("id", "lgBlue")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%")
	
	lgradBlue
		.append("stop")
		.attr("stop-color", "rgb(150,150,255)")
		.attr("offset", "0%")
	
	lgradBlue
		.append("stop")
		.attr("stop-color", "rgb(220,220,255)")
		.attr("offset", "100%")
		
	var rgrad = defs.append("radialGradient")
		.attr("id", "g1")
		.attr("cx", "50%")
		.attr("cy", "50%")
		.attr("r", "50%")
	
	rgrad
		.append("stop")
		.attr("stop-color", "rgb(0,0,0)")
		.attr("stop-opacity", "0.5")
		.attr("offset", "0%")
	
	rgrad
		.append("stop")
		.attr("stop-color", "rgb(0,0,0)")
		.attr("stop-opacity", "0")
		.attr("offset", "100%")
}


























function createGplomMatrix(svg, xGlobal, yGlobal, wGlobal, hGlobal) {
	wGlobal -= 5
	hGlobal -= 5
	var marginToTotal = 0.2
	var cardinalityWidthCap = 8
	var vccc = getTotalCardinalityFrom(cardinalityWidthCap)
//	var numberOfCatVars = vccc[0]
//	var totalCardinality = vccc[1]
//	var totalCardinalityMinusFirst = vccc[2]
	var wMargin = wGlobal*marginToTotal/(vars.length-2)
	var hMargin = hGlobal*marginToTotal/(vars.length-2)
	
	var barWidth = wGlobal*(1-marginToTotal)/(vars.length-1)
//		*numberOfCatVars/totalCardinality
	var barHeight = hGlobal*(1-marginToTotal)/(vars.length-1)
//		*(numberOfCatVars-1)/totalCardinalityMinusFirst
	
	var x = xGlobal, y = yGlobal
	// on the y-axis, we start with cat no 2
	var metricIdX, catIdX, metricIdY, catIdY = nextCat()
	var xTextDiv = d3.select("#xNames")
	var yTextDiv = d3.select("#yNames")
	var xStyle = "width: "+round(wGlobal/(vars.length-1))+"px"
	var yStyle = "height: "+round(hGlobal/(vars.length-1))+"px"
	
	// row iteration (y-axis)
	for (var i=0; i<vars.length-1; i++) {
		catIdY = nextCat(catIdY)
		var h = barHeight
		if (catIdY !== -1) { // heatmaps
//			h = vars[catIdY].dictionary.length * barHeight
		} else {
//			h = wGlobal*(1-marginToTotal)/vars.length
			metricIdY = nextMetric(metricIdY)
			console.assert(metricIdY !== -1)
		}
		// column iteration (x-axis)
		for (var k=0; k<i+1; k++) {
			catIdX = nextCat(catIdX)
			var w = barWidth
			if (catIdX !== -1) {
				var cardinality = vars[catIdX].dictionary.length
//				w = (cardinality > cardinalityWidthCap
//					? cardinalityWidthCap
//					: cardinality) * barWidth
			}
			if (catIdY !== -1) { // heatmap
				console.assert(catIdX !== -1 && catIdX !== catIdY)
				drawHeatmapFirstime(svg, x, y, w, h, catIdX, catIdY)
			} else {
				if (catIdX !== -1) { // histogram
					drawHistogramFirsttime(svg, x, y, w, h, catIdX, metricIdY)
					
					if (false) {
					// create new stream from each category
						var catBuckets = []
						for (var m=0; m<vars[catIdX].dictionary.length; m++)
							catBuckets.push([])
						for (var m=0; m<vars[metricIdY].data.length; m++)
							catBuckets[vars[catIdX].data[m]].push(vars[metricIdY].data[m])
						for (var m=0; m<vars[catIdX].dictionary.length; m++)
							drawKDE(svg.append("g"), x, y, w, h, catBuckets[m])
					}
				} else { // scatterplot
					metricIdX = nextMetric(metricIdX)
					console.assert(metricIdX !== -1)
					
//					if (false)
					drawScatterplotFirsttime(svg, x, y, w, h, metricIdX, metricIdY)
				}
			}
			var curVar = catIdX === undefined || catIdX < 0 ? metricIdX : catIdX
			if (i === vars.length-2) {
				drawFilterX(svg, x, y, w, h, curVar)
			}
			if (k === i) {
				xTextDiv.append("td").attr("style", xStyle).text(vars[curVar].name)
			}
			x += w + wMargin
		}
		yTextDiv.append("tr").append("td").attr("style", yStyle).text(vars[
			(catIdY === undefined || catIdY < 0 ? metricIdY : catIdY)
		].name)
		x = xGlobal
		drawFilterY(svg, x, y, w, h, (catIdY === undefined || catIdY < 0 ? metricIdY : catIdY))
		y += h + hMargin
		metricIdX = undefined
		catIdX = undefined
	}
}

function nextMetric(current) {
	return next(current, true)
}

function nextCat(current) {
	return next(current, false)
}

function next(current, findMetric) {
	if (current == -1)
		return -1
	if (current === undefined || current === null)
		current = -1
	while (++current < vars.length) {
		var typeIsMetric = vars[current].dataType === "metric"
		if ((findMetric && typeIsMetric) || (!findMetric && !typeIsMetric))
			return current
	}
	return -1
}

function getTotalCardinalityFrom(cardinalityWidthCap) {
	var current = undefined
	var cc = 0
	var cc0 = 0
	var vc = 0
	while ((current = nextCat(current)) !== -1) {
		vc++
		var cardinality = vars[current].dictionary.length
		cc += (cardinality > cardinalityWidthCap
			? cardinalityWidthCap
			: cardinality)
		if (vc === 1)
			cc0 = cc
	}
	return [vc, cc, cc-cc0]
}

function getFilterRangeFor(varId, aOrB) {
	for (var i=0; i<filter.length; i++) {
		if (filter[i].varId === varId)
			return filter[i][aOrB]
	}
	return aOrB === "a"
		? (vars[varId].dataType === "metric"
			? vars[varId].min
			: 0)
		: (vars[varId].dataType === "metric"
			? vars[varId].max
			: (vars[varId].dictionary.length-1))
}

function addToMask(mask, varId) {
	toMask(mask, true, varId)
}

function subtractFromMask(mask, varId) {
	toMask(mask, false, varId)
}

function toMask(mask, plus, varId) {
	var isMetric = vars[varId].dataType === "metric"
	var low = isMetric ? vars[varId].min : 0
	var high = isMetric ? vars[varId].max : vars[varId].dictionary.length-1
	
	var newToBeF = []
	console.assert(runOnFilterWithVarId(varId, function(i, fi) {
		if (low === filter[i].a)
			return
		newToBeF.min = low
		newToBeF.max = filter[i].a
		updateMask(mask, varId, plus, newToBeF)
	}))
	console.assert(runOnFilterWithVarId(varId, function(i, fi) {
		if (high === filter[i].b)
			return
		newToBeF.min = filter[i].b+(isMetric ? 0 : 1)
		newToBeF.max = high+(isMetric ? 0 : 1)
		updateMask(mask, varId, plus, newToBeF)
	}))
}

function updatehighlightMask(varId, plus, newToBeF) {
	updateMask(highlightMask, varId, plus, newToBeF)
}

function updateFilterMask(varId, plus, newToBeF) {
	updateMask(filterMask, varId, plus, newToBeF)
}

function updateMask(mask, varId, plus, newToBeF) {
	if (vars[varId].dataType === "metric") {
		for (var i=0; i<mask.length; i++) {
			if (typeof vars[varId].data[i] !== "string") {
				// intricate difference: range max or min included ?
				if (plus) {
					if (newToBeF.min <= vars[varId].data[i]
					   && newToBeF.max > vars[varId].data[i])
					   mask[i]++
				} else {
					if (newToBeF.min < vars[varId].data[i]
					   && newToBeF.max >= vars[varId].data[i])
					   mask[i]--
				}
				console.assert(mask[i] >= 0)
				if (mask[i] < 0)
					mask[i] = 0
			}
		}
	} else {
		for (var i=0; i<mask.length; i++) {
			// filter: [min, max)
			for (var k=newToBeF.min; k<newToBeF.max; k++) {
				if (vars[varId].data[i] === k) {
					mask[i] += (plus ? 1 : -1)
					console.assert(mask[i] >= 0)
				}
			}
		}
	}
}

function runOnFilterWithVarId(varId, f) {
	for (var i=0; i<filter.length; i++) {
		if (filter[i].varId === varId) {
			f(i, filter[i])
			return true
		}
	}
	// not found
	return false
}

function setFilterRangeFor(varId, aOrB, val) {
	var isMetric = vars[varId].dataType === "metric"
	var low = isMetric ? vars[varId].min : 0
	var high = isMetric ? vars[varId].max : vars[varId].dictionary.length-1
	console.assert(val <= high && val >= low)
	var id = "fLi"+varId
	
	var newToBeF = []
	var found = runOnFilterWithVarId(varId, function(i, fi) {
		var oldVal = filter[i][aOrB]
		filter[i][aOrB] = val
		if (filter[i].a === low && filter[i].b === high) {
			filter.splice(i, 1)
			d3.select("#"+id).remove()
		}
		newToBeF.min = Math.min(oldVal, val) + (!isMetric && aOrB === "b" ? 1: 0)
		newToBeF.max = Math.max(oldVal, val) + (!isMetric && aOrB === "b" ? 1: 0)
		updatehighlightMask(varId, aOrB === "a" ? oldVal < val : val < oldVal, newToBeF)
	})
	
	// create new
	if (!found && ((aOrB === "a" && val !== low) || (aOrB === "b" && val !== high))) {
		var a = aOrB === "a" ? val : low
		var b = aOrB === "b" ? val : high
		
		filter.push({
			varId: varId,
			a: a,
			b: b,
			isApplied: false
		})
		
		var appliedColour = "#faa"
		var notAppliedColour = "#ddd"
		
		d3.select("#filter")
			.append("li")
			.attr("id", id)
			.attr("varId", varId)
			.text(vars[varId].name)
			.attr("style", "background-color: "+notAppliedColour+";")
			.on("click", function(d,i) {
				var elem = d3.select(this)
				runOnFilterWithVarId(varId, function() {
					if (filter[i].isApplied) {
						filter[i].isApplied = false
						elem.attr("style", "background-color: "+notAppliedColour+";")
						subtractFromMask(filterMask, varId)
						addToMask(highlightMask, varId)
					} else {
						filter[i].isApplied = true
						elem.attr("style", "background-color: "+appliedColour+";")
						subtractFromMask(highlightMask, varId)
						addToMask(filterMask, varId)
					}
					updateSVG()
				})
			})
		
		// filter: [min, max)
		newToBeF.min = aOrB === "a" ? low : b+(isMetric ? 0 : 1)
		newToBeF.max = aOrB === "a" ? a : high+(isMetric ? 0 : 1)
		updatehighlightMask(varId, true, newToBeF)
	}
}

var ondrag = d3.behavior.drag().on("drag", function() {
	// if a === b then the sliders are one width apart!
	// thus, bSlider pos is actually at b+1!
	var mouseX = d3.event.x
	var mouseY = d3.event.y
	var d3obj = d3.select(this)
	var tDelay = 200
	var x = parseFloat(d3obj.attr("_x"))
	var y = parseFloat(d3obj.attr("_y"))
	var w = parseFloat(d3obj.attr("_w"))
	var h = parseFloat(d3obj.attr("_h"))
	var xOrY = d3obj.attr("xOrY")
	var isX = xOrY === "x"
	
	var varId = parseInt(d3obj.attr("_varId"))
	var aOrB = d3obj.attr("aOrB")
	var c = getFilterRangeFor(varId, aOrB)
	var NaOrB = aOrB === "a" ? "b" : "a"
	var Nc = getFilterRangeFor(varId, NaOrB)
	

	if (vars[varId].dataType !== "metric") {
		var numberOfCat = vars[varId].dictionary.length
		var barX = w/numberOfCat
		var barY = h/numberOfCat
		function transform(trL, aOrB) {
			// TODO is is only correct if the w & h of all diagrams is the same!
			// we would actually need to get w & h from the NxOrY d3 obj
			d3.select("#fsx"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate("+trL*barX+", 0)")
			d3.select("#fsy"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate(0, "+(-trL*barY)+")")
		}
		var barSize = isX ? barX : barY
		var pos = (isX ? x : y+h)+(isX ? 1 : -1)*(c+(aOrB === "b" ? 1 : 0))*barSize
		var p = (isX ? 1 : -1)*((isX ? mouseX : mouseY)-pos)/barSize
		if (p >= 0.5 && ((aOrB === "a" && c < numberOfCat-1) || (aOrB === "b" && c < numberOfCat-1))) {
			setFilterRangeFor(varId, aOrB, c+1)
			transform((c+1+ (aOrB === "b" ? 1 : 0)), aOrB)
			// a must < b
			if (aOrB === "a" && c+1 >= Nc) {
				setFilterRangeFor(varId, NaOrB, c+1)
				transform(c+2, NaOrB)
			}
			updateSVG()
		}
		if (p <= -0.5 && ((aOrB === "a" && c > 0) || (aOrB === "b" && c > 0))) {
			setFilterRangeFor(varId, aOrB, c-1)
			transform((c-1+ (aOrB === "b" ? 1 : 0)), aOrB)
			// a must < b
			if (aOrB === "b" && c-1 <= Nc) {
				setFilterRangeFor(varId, NaOrB, c-1)
				transform(c-1, NaOrB)
			}
			updateSVG()
		}
	} else {
		var p = isX ? (mouseX-x)/w : 1-(mouseY-y)/h
		p = Math.min(1, p)
		p = Math.max(0, p)
		var newFilterVal = vars[varId].min + p* (vars[varId].max - vars[varId].min)
		setFilterRangeFor(varId, aOrB, newFilterVal)
		function transform(aOrB) {
			d3.select("#fsx"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate("+(p*w)+", 0)")
			d3.select("#fsy"+aOrB+varId).transition().duration(tDelay).attr("transform", "translate(0, "+(-p*h)+")")
		}
		transform(aOrB)
		if ((aOrB === "a" && newFilterVal > Nc) || (aOrB === "b" && newFilterVal < Nc)) {
			setFilterRangeFor(varId, NaOrB, newFilterVal)
			transform(NaOrB)
		}

		updateSVG()
	}
})
.on("dragstart", function() {
	this.isDragged = true
	d3.select(this).attr("fill", "red")
})
.on("dragend", function() {
	this.isDragged = false
	d3.select(this).attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
})

function drawFilterY(svg, x, y, w, h, varId) {
	var size = 10
	var fss = new Array()
	// the A is at the bottom!
	fss.push(svg
		.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsya"+varId)
		.attr("aOrB", "a")
		.attr("xOrY", "y")
		.attr("d", "M"+x+","+(y+h)+" L"+(x-size)+","+(y+h)+" L"+(x-size)+","+(y+h + size)+" Z")
	)
	fss.push(svg.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsyb"+varId)
		.attr("aOrB", "b")
		.attr("xOrY", "y")
		.attr("d", "M"+x+","+(y+h)+" L"+(x-size)+","+(y+h)+" L"+(x-size)+","+(y+h - size)+" Z")
		.attr("transform", "translate(0, "+(-h)+")")
	)
	commonSliders(svg, x, y, w, h, varId, fss)
}

function drawFilterX(svg, x, y, w, h, varId) {
	var size = 10
	
	var fss = new Array()
	fss.push(svg
		.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsxa"+varId)
		.attr("aOrB", "a")
		.attr("xOrY", "x")
		.attr("d", "M"+x+","+(y+h)+" L"+x+","+(y+h+size)+" L"+(x - size)+","+(y+h+size)+" Z")
	)
	fss.push(svg.append("path")
		.attr("class", "filterSlider")
		.attr("id", "fsxb"+varId)
		.attr("aOrB", "b")
		.attr("xOrY", "x")
		.attr("d", "M"+x+","+(y+h)+" L"+x+","+(y+h+size)+" L"+(x + size)+","+(y+h+size)+" Z")
		.attr("transform", "translate("+w+", 0)")
	)
	commonSliders(svg, x, y, w, h, varId, fss)
}

function commonSliders(svg, x, y, w, h, varId, fss) {
	for (var i=0; i<fss.length; i++)
		fss[i]
		.attr("_x", x)
		.attr("_y", y)
		.attr("_w", w)
		.attr("_h", h)
		.attr("_varId", varId)
		.attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
		.on("mouseover", function() {
			if (!this.isDragged)
				d3.select(this).attr("fill", "red")
		})
		.on("mouseout", function() {
			if (!this.isDragged)
				d3.select(this).attr("fill", "rgb("+sliderColor+","+sliderColor+","+sliderColor+")")
		})
		.call(ondrag)
}

function getHistogramDataFromVars(catId, metricId, filtered) {
	var result = new Array(vars[catId].dictionary.length)
	for (var i=0; i<result.length; i++)
		result[i] = 0
	
//	highlightMask
	for (var i=0; i<vars[catId].data.length; i++)
		if (typeof vars[metricId].data[i] !== "string") {
			if (!filtered) {
				result[vars[catId].data[i]] += vars[metricId].data[i]
			} else {
				if (highlightMask[i] === 0)
					result[vars[catId].data[i]] += vars[metricId].data[i]
			}
		}
	return result
}

function histTest() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)
	
	var input = []
	for (var i=0; i<10; i++)
		input.push(Math.random())
	
	// deprecated
//	drawHistogram(svg, 10, 10, 300, 200, input, false)
}

function drawHistogramFirsttime(svg, x, y, w, h, catIdX, metricIdY) {
	var histG = svg.append("g")
		.attr("class", "histogram")
		.attr("catIdX", catIdX)
		.attr("metricIdY", metricIdY)
		.attr("_x", round(x))
		.attr("_y", round(y))
		.attr("_w", round(w))
		.attr("_h", round(h))
		
	updateHistogram(histG, x, y, w, h, catIdX, metricIdY, true)
}

function updateHistogram(histG, x, y, w, h, catId, metricId, firsttime) {
	var input = new Array(vars[catId].dictionary.length)
	for (var i=0; i<input.length; i++)
		input[i] = [0,0]
	
	for (var i=0; i<vars[catId].data.length; i++)
		if (typeof vars[metricId].data[i] !== "string" && filterMask[i] === 0) {
			input[vars[catId].data[i]][(highlightMask[i] === 0 ? 0 : 1)] += vars[metricId].data[i]
		}
	
//	console.log(input)
	
	var max = 0
	for (var i=0; i<input.length; i++) {
		max = Math.max(max, input[i][0]+input[i][1])
	}
	
	if (max === 0)
		max += 1
	
	var baseline = 0
	
	var ww = 1/input.length*w
	for (var i=0; i<input.length; i++) {
		var xx = x+i/input.length*w
		var barHeight = h*(input[i][0]+input[i][1]-baseline)/(max-baseline)
		var barHeightF = h*(input[i][0]-baseline)/(max-baseline)
		var yy = y+(h-barHeight)
		var yyF = y+(h-barHeightF)
		
		var barId = "hist"+catId+"x"+metricId+"bar"+i
		var strokeId = "hist"+catId+"x"+metricId+"barStroke"+i
		var barFId = "histH"+catId+"x"+metricId+"bar"+i
		var strokeFId = "histH"+catId+"x"+metricId+"barStroke"+i
		
		if (firsttime !== undefined) {
			histG
				.append("rect")
				.attr("id", barId)
				.attr("x", round(xx))
				.attr("width", round(ww))
				.attr("fill", "url(#lg1)")
			histG
				.append("line")
				.attr("id", strokeId)
				.attr("x1", xx)
				.attr("x2", xx+ww)
				.attr("stroke", "black")
				.attr("stroke-width", "1")
			histG
				.append("rect")
				.attr("id", barFId)
				.attr("x", round(xx))
				.attr("width", round(ww))
				.attr("fill", "url(#lgBlue)")
			histG
				.append("line")
				.attr("id", strokeFId)
				.attr("x1", xx)
				.attr("x2", xx+ww)
				.attr("stroke", "black")
				.attr("stroke-width", "1")
		}
		d3.select("#"+barId)
			.attr("y", round(yy))
			.attr("height", round(barHeight))
		d3.select("#"+strokeId)
			.attr("y1", yy)
			.attr("y2", yy)
		d3.select("#"+barFId)
			.attr("y", round(yyF))
			.attr("height", round(barHeightF))
		d3.select("#"+strokeFId)
			.attr("y1", yyF)
			.attr("y2", yyF)
	}
	
	if (firsttime !== undefined) {
		var numberOfRulers = 3
		for (var i=1; i<(numberOfRulers+1); i++) {
			var yy = y+h-i/(numberOfRulers+1)*h
			histG
				.append("line")
				.attr("x1", round(x)).attr("y1", round(yy))
				.attr("x2", round(x+w)).attr("y2", round(yy))
				.attr("stroke", "rgb(255,255,255)")
				.attr("stroke-opacity", "0.5")
				.attr("stroke-width", "1")
		}
		
		histG
			.append("line")
			.attr("x1", x).attr("y1", y+h)
			.attr("x2", x+w).attr("y2", y+h)
			.attr("stroke", "gray")
			.attr("stroke-width", "3")
	}
}

function updateSVG() {
	d3.selectAll(".histogram").each(function(d, i) {
		var hist = d3.select(this)
		var catIdX = hist.attr("catIdX")
		var metricIdY = hist.attr("metricIdY")
		var x = parseFloat(hist.attr("_x"))
		var y = parseFloat(hist.attr("_y"))
		var w = parseFloat(hist.attr("_w"))
		var h = parseFloat(hist.attr("_h"))
		
		updateHistogram(hist, x, y, w, h, catIdX, metricIdY)
	})
	
	d3.selectAll(".scatterplot").each(function(d, i) {
		var scatter = d3.select(this)
		var id0 = scatter.attr("id0")
		var id1 = scatter.attr("id1")
		var x = parseFloat(scatter.attr("_x"))
		var y = parseFloat(scatter.attr("_y"))
		var w = parseFloat(scatter.attr("_w"))
		var h = parseFloat(scatter.attr("_h"))
		
		scatter.remove()
		drawScatterplotFirsttime(svg, x, y, w, h, id0, id1)
	})
	
	d3.selectAll(".heatmap").each(function(d, i) {
		var heatmap = d3.select(this)
		var id0 = heatmap.attr("id0")
		var id1 = heatmap.attr("id1")
		var x = parseFloat(heatmap.attr("_x"))
		var y = parseFloat(heatmap.attr("_y"))
		var w = parseFloat(heatmap.attr("_w"))
		var h = parseFloat(heatmap.attr("_h"))
		
		updateHeatmap(heatmap, x, y, w, h, id0, id1)
	})
}

function drawKDE(svg, x, y, w, h, input) {
	var scaleX = d3.scale.linear()
		.domain(getMinMax(input))
		.range([x, x+w])
		
	var scaleY = d3.scale.linear()
		.domain([0, .1])
		.range([y+h, y])

	var kde = kernelDensityEstimator(epanechnikovKernel(7), scaleX.ticks(100))
	
	var line = d3.svg.line()
		.x(function(d) { return scaleX(d[0]) })
		.y(function(d) { return scaleY(d[1]) })

	svg.append("path")
		.datum(kde(input))
		.attr("class", "line")
		.attr("d", line)
		.attr("fill", "transparent")
		.attr("stroke", "gray")
		.attr("stroke-width", "3")
}

function heatmapTest() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)

	var input = []
	for (var i=0; i<10; i++) {
		var inside = []
		for (var k=0; k<10; k++)
			inside.push(Math.random())
		input.push(inside)
	}
	
	// TODO deprecated
//	drawHeatmap(svg, 10, 10, 300, 200, input)
}

function drawBorder(svg, x, y, w, h) {
	var storkeWidth = 0.5
	svg
		.append("rect")
		.attr("x", x-storkeWidth).attr("y", y-storkeWidth)
		.attr("width", w+2*storkeWidth)
		.attr("height", h+2*storkeWidth)
		.attr("fill", "rgb(0,0,0)")
		.attr("fill-opacity", "0")
		.attr("stroke", "rgb(0,0,0)")
		.attr("stroke-opacity", "0.3")
		.attr("stroke-width", storkeWidth)
}

function drawHeatmapFirstime(svg, x, y, w, h, id0, id1) {
	var heatmap = svg.append("g")
		.attr("class", "heatmap")
		.attr("id0", id0)
		.attr("id1", id1)
		.attr("_x", round(x))
		.attr("_y", round(y))
		.attr("_w", round(w))
		.attr("_h", round(h))
	drawBorder(heatmap, x, y, w, h)
	updateHeatmap(heatmap, x, y, w, h, id0, id1, true)
}

function updateHeatmap(heatmap, x, y, w, h, id0, id1, firsttime) {
	var outterLength = vars[id0].dictionary.length
	var innerLength = vars[id1].dictionary.length
	console.assert(outterLength > 0 && innerLength > 0)
	var input = new Array(outterLength)
	for (var i=0; i<outterLength; i++) {
		var inside = new Array(innerLength)
		for (var k=0; k<innerLength; k++) {
			inside[k] = [0,0] // [isNotFiltered, is]
		}
		input[i] = inside
	}
	
	for (var i=0; i<vars[id0].data.length; i++)
		input[vars[id0].data[i]][vars[id1].data[i]][(highlightMask[i] === 0 ? 0 : 1)]++
	
	var max = input[0][0][0]+input[0][0][1]
	var min = max
	for (var i=0; i<outterLength; i++) {
		for (var k=0; k<innerLength; k++) {
			if (input[i][k][0]+input[i][k][1] > max) max = input[i][k][0]+input[i][k][1]
			if (input[i][k][0]+input[i][k][1] < min) min = input[i][k][0]+input[i][k][1]
		}
	}
	
	var ww = w/outterLength
	var hh = h/innerLength
	for (var i=0; i<outterLength; i++) {
		for (var k=0; k<innerLength; k++) {
			var colorP = (input[i][k][0]+input[i][k][1])/max
			// percentage non-filtered
			var satP = colorP === 0 ? 0 : input[i][k][0] / (input[i][k][0] + input[i][k][1])
			var sat = Math.round((1*satP)*100)
			// 0.7 because at black, no colour difference is visible anymore
			var ligthness = Math.round((1-colorP*0.7)*100)
			var cellId = "hc"+id0+"x"+id1+"x"+i+"x"+k
			var cell
			if (firsttime !== undefined) {
				cell = heatmap
					.append("rect")
					.attr("id", cellId) // heatmap cell
					.attr("x", round(x+i*ww))
					.attr("y", round(y+(h-(k+1)*hh)))
					.attr("width", round(ww))
					.attr("height", round(hh))
				
			} else {
				cell = d3.select("#"+cellId)
			}
			cell
				// TODO does not work in Inkscape .. have to convert
				// also hue does not match (bases are 256 or 360)
				// blue
				.attr("fill", "hsl(200, "+sat+"%, "+ligthness+"%)")
//				.attr("fill", "rgb("+color*255+","+color*255+","+color*255+")")
		}
	}
}

function scatter() {
	var svg = d3.select("#viz")
		.attr("width", 960)
		.attr("height", 500)
	
	var dataX = [], dataY = []
	for (var i=0; i<200; i++) {
		dataX.push(Math.random())
		dataY.push(Math.random())
	}
	
	// TODO deprecated
//	drawScatterplotFormat(svg, 10, 10, 100, 200, dataX, dataY)
}

function drawScatterplotFirsttime(svg, x, y, w, h, id0, id1) {
	var scatter = svg.append("g")
		.attr("class", "scatterplot")
		.attr("id0", id0)
		.attr("id1", id1)
		.attr("_x", round(x))
		.attr("_y", round(y))
		.attr("_w", round(w))
		.attr("_h", round(h))
	
	drawBorder(scatter, x, y, w, h)
	
	updateScatterplot(scatter, x, y, w, h, id0, id1)
}

function updateScatterplot(scatter, x, y, w, h, id0, id1) {
	var maxPointsDisplayed = 100
	console.assert(vars[id0].data.length === vars[id1].data.length)
	var length = vars[id0].data.length
	
	var vX = new Array(length)
	var vY = new Array(length)
	var goodEntries = 0
	// cleanup metric data pair
	for (var i=0; i<length; i++) {
		if (	typeof vars[id0].data[i] !== "string"
			&&	typeof vars[id1].data[i] !== "string"
			&& !isNaN(vars[id0].data[i])
			&& !isNaN(vars[id1].data[i])
			&& vars[id0].data[i] !== undefined
			&& vars[id1].data[i] !== undefined) {
				vX[i] = true
				vY[i] = true
				goodEntries++
		} else {
			// this way, the relation to the data indices is not broken
				vX[i] = false
				vY[i] = false
		}
	}
	
	var Xmin = vars[id0].min, Xmax = vars[id0].max
	var Ymin = vars[id1].min, Ymax = vars[id1].max
	
	// min & max have to be calc individually for every metric pair
//	var minMax = getMinMax(vX), Xmin = minMax[0], Xmax = minMax[1]
//	var minMax = getMinMax(vY), Ymin = minMax[0], Ymax = minMax[1]
	
	if (Xmax-Xmin < 0.0001) {
		Xmax += 1
		Xmin -= 1
	}
	if (Ymax-Ymin < 0.0001) {
		Ymax += 1
		Ymin -= 1
	}
	
	for (var i=0; i<length; i++) {
		if (highlightMask[i] !== 0) {
			if (vX[i]) {
				goodEntries--
				vX[i] = false
				vY[i] = false
			}
		}
	}
	
	// "filter" so that #maxPointsDisplayed are not undefined
	if (goodEntries > maxPointsDisplayed) {
		var randomId = uniqueRandomNumbersArray(maxPointsDisplayed, goodEntries-1)
		
		randomId.sort(function(a,b) { return a-b })
		
		var validCount = 0
		var rIdI = 0
		for (var i=0; i<vX.length; i++) {
			if (vX[i]) {
				if (rIdI < randomId.length && validCount >= randomId[rIdI]) {
					rIdI++
				} else {
					vX[i] = false
					vY[i] = false
				}
				validCount++
			}
		}
	}
	
	for (var i=0; i<vX.length; i++) {
		if (vX[i] && vY[i]) {
			scatter
			.append("circle")
			.attr("fill", "url(#g1)")
			.attr("r", 4)
			.attr("cx", round(x+w*((vars[id0].data[i]-Xmin)/(Xmax-Xmin))))
			.attr("cy", round(y+h*(1-(vars[id1].data[i]-Ymin)/(Ymax-Ymin))))
		}
	}
}

function stream(svg) {
	var faithful1 = [1,2,3,4,5,6]
	var faithful2 = [4,3,5,1,2,0]
	var f1xy = faithful1.map(function(d, i) {
		return {x: i, y: d}
	})
	var f2xy = faithful2.map(function(d, i) {
		return {x: i, y: d}
	})
	
	console.log([f1xy, f2xy])
	var stack = d3.layout.stack().offset("wiggle"), // zero, wiggle, expand
		layers0 = stack([f1xy, f2xy])
		
	
	var x = d3.scale.linear()
		.domain([0, 7])
		.range([0, 500])

	var y = d3.scale.linear()
		.domain([0, 7])
		.range([300, 0])

	var color = d3.scale.linear()
		.range(["#aad", "#556"])

	var area = d3.svg.area()
		.x(function(d) { return x(d.x) })
		.y0(function(d) { return y(d.y0) })
		.y1(function(d) { return y(d.y0 + d.y) })
	
	svg.selectAll("path")
		.data(layers0)
	  .enter().append("path")
		.attr("d", area)
		.attr("fill", function() { return color(Math.random()) })
}

function kernelDensityEstimator(kernel, x) {
	return function(sample) {
		return x.map(function(x) {
			return [x, d3.mean(sample, function(v) { return kernel(x - v) })]
		})
	}
}

function epanechnikovKernel(scale) {
	return function(u) {
		return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0
	}
}





















function getMinMax(input) {
	if (input.length === 0)
		return [0,0]
	var max = undefined
	var min = undefined
	for (var i=0; i<input.length; i++) {
		if (input[i] !== undefined && input[i] !== null && typeof input[i] !== "string") {
			if (max === undefined) max = input[i]
			if (min === undefined) min = input[i]
			if (input[i] > max) max = input[i]
			if (input[i] < min) min = input[i]
		}
	}
	if (max === undefined || min === undefined || max < min)
		return [0,0]
	if (max === min)
		console.log("max === min")
	
	return [min, max]
}

function flowText(svg, x, y, w, h, text) {
	// does not work. if I put the same svg block into the html, it works. do not know why.
	var switchObj = svg.append("switch")
	switchObj
		.append("foreignObject")
//		.attr("x", x).attr("y", y)
		.attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
		.attr("width", w).attr("height", h)
		.append("p")
		.attr("xmlns", "http://www.w3.org/1999/xhtml")
		.text("Text goes here ok so i have along line of text and i expect it to be wrapped now")
}

function convertStrToNumber(val) {
	var number = parseInt(val)
	if (isNaN(number))
		number = parseFloat(val)
	if (isNaN(number) || number === undefined)
		console.log("could not parse: "+val)
	return number
}

function uniqueRandomNumbersArray(length, rangeMax) {
	console.assert(length <= rangeMax)
	var randomId = []
	while (randomId.length < length) {
		var randomnumber=Math.ceil(Math.random()*rangeMax)
		var found = false
		for (var i=0; i<randomId.length; i++) {
			if(randomId[i] === randomnumber) {
				found=true
				break
			}
		}
		if (!found)
			randomId[randomId.length] = randomnumber
	}
	return randomId
}

function round(number) {
//	if (typeof number === "")

	return Number(number.toFixed(1))
}


function createTestData(numberOfRows) {
	vars = [
		{name:"v1", dataType:"metric", dictionary:[30, 50], data:[]},
		{name:"v2", dataType:"ordinal", dictionary:[3,5,7,9], data:[]},
		{name:"v3", dataType:"nominal", dictionary:["yes", "no", "kA"], data:[]},
		{name:"v4", dataType:"ordinal", dictionary:["1-3", "3-10", "10-100"], data:[]},
		{name:"v5", dataType:"metric", dictionary:[0, 100], data:[]}
	]
	
	for (var i=0; i<vars.length; i++) {
		var row = []
		for (var k=0; k<numberOfRows; k++) {
			if (vars[i].dataType === "metric") {
				var min = vars[i].dictionary[0]
				var max = vars[i].dictionary[1]
				row.push(Math.random() * (max - min) + min)
			} else { // get random category
				// push id of category
				row.push(Math.floor(Math.random()*vars[i].dictionary.length))
			}
		}
		vars[i].data = row
	}
}

