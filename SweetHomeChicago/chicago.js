/*
 ability to show demographic data for Chicago as a whole and compare it to any one of the 77 community areas (data for all 77 areas should be available but the user will only bring up data on one of those areas at a time, and the user can move from one area to another)
 ability for user to show data on Age and Gender as well designed bar charts, pie charts, or raw data
 ability for user to also show data on race and place of origin as bar charts, pie charts, or raw data

 ability to colour in the community areas and districts on the map as a heatmap based on one of at least 5 particular pieces of data (e.g. percentage of people under 18) to see how that piece of data changes across the city
 */

var d3 = window.d3; // Just so the IDE doesn't complain

var RacePropKeys = [
    "NHW", "NHB", "NHAM", "NHAS", "NHOTHER", "HISP", "MULTI", "TOTAL",
    "Asian Indian", "Bangladeshi",  "Bhutanese",  "Burmese",  "Cambodian",
    "Chinese (except Taiwanese)", "Filipino", "Hmong",  "Indonesian",
    "Japanese", "Korean", "Laotian",  "Malaysian",  "Nepalese", "Pakistani",
    "Sri Lankan", "Taiwanese",  "Thai", "Vietnamese", '"Other Asian, specified"',
    '"Other Asian, not specified"', "Hispanic or Latino by specific origin",
    "Mexican",  "Puerto Rican Cuban", "Cuban",  "Dominican",
    "Central American (excluding Mexican) [subtotal]",
    "Costa Rican",  "Guatemalan", "Honduran", "Nicaraguan",
    "Panamanian", "Salvadoran", "Other Central American",
    "South American [subtotal]",  "Argentinean",  "Bolivian",
    "Chilean",  "Colombian",  "Ecuadorian", "Paraguayan", "Peruvian",
    "Uruguayan",  "Venezuelan", "Other South American",
    "Other Hispanic or Latino [subtotal]",  "Spaniard", "Spanish",
    "Spanish American", "All other Hispanic or Latino"]
/////////////////////////////////////////
/*

 NHW -> White alone, not Hispanic or Latino
 NHB -> Black or African American alone, not Hispanic or Latino
 NHAM -> American Indian and Alaska Native alone, not Hispanic or Latino
 NHAS -> Asian alone, not Hispanic or Latino
 NHOTHER -> Other single race alone, not Hispanic or Latino
 HISP -> Hispanic or Latino
 MULTI -> Two or more races, not Hispanic or Latino

 Label Information
 gt25 -> 25 or more years of Education
 ltHS -> Less than a High school education
 HS -> High school or GED
 AAS  -> Some College or Associates Degree
 BA -> Bachelors degree

 */

/////////////////// Define some global vars ///////////////////////

var width = 4080, //4080  | 8196
    height = 2188; //2304  | 2188

var chartType = 0;
// Create automatic color range
var color = d3.scale.ordinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var color10 = d3.scale.category10();
var color20 = d3.scale.category20();

// setup Map svg
var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)
    .classed("map", true);

var svgArray= [];
var topArray = ["200px", "750px", "1300px", "1850px"];
var leftArray = ["2100px", "3100px", "4100px"];

// Setup projection
var projection = d3.geo.mercator()
    .scale(200000)
    .translate([1300, 1150]);

// Path generator
var path = d3.geo.path().projection(projection);

// use this to handle passing data to the charts
var districtSelection = [];
var communitySelection = [];
var chicagoStack = [];

var pChart0 = popChart(leftArray[0], topArray[0], color10); pChart0();
var pChart01 = popChart(leftArray[0], topArray[1], color10); pChart01();
var pChart02 = popChart(leftArray[0], topArray[2], color10); pChart02();

var pChart11 = popChart(leftArray[1], topArray[1], color10); pChart11();
var pChart12 = popChart(leftArray[1], topArray[2], color10); pChart12();

var pChart21 = popChart(leftArray[2], topArray[1], color10); pChart21();
var pChart22 = popChart(leftArray[2], topArray[2], color10); pChart22();
/////////////////////////////////////////////////////
//        This is where the magic happens!         //
/////////////////////////////////////////////////////

// Main program
d3.json("data/chi.json", readyBegin);

////////////////////////////////////////////////////////////////////////////////
//                       Being Function Definitions                           //
////////////////////////////////////////////////////////////////////////////////

// Entry point into our program
function readyBegin(json){
    console.log("inside prepData", json);
    // Convert Topo Json object to GeoJson feature collection
    var topo = topojson.feature(json, json.objects.chicago_health2);
    appendROC(topo);
}

////////////////////////////////////////////////////////////////////////////////
//                        Race Origin Community
////////////////////////////////////////////////////////////////////////////////
function appendROC(data){
    console.log("inside appendROC", data);
    d3.tsv("data/RaceOriginComm.tsv", function(error, roc) {
        data.features.forEach(function(comm){
            console.log(comm)
            var rOC = roc.filter(function(rd) {
                return parseInt(rd.NAME) === comm.id;
            })[0];

            // setup some objects to append to the community data
            var origin = { }; // object to store Racial origins for those fringe groups
            var raceOriginComm = {slug: "race"};  //

            d3.keys(rOC).forEach(function(k){
                if (RacePropKeys.indexOf(k) > -1 && RacePropKeys.indexOf(k) < 8){
                    var total = parseInt(rOC[k]);
                    var group = { count: total, name: k };
                    raceOriginComm[k] = group;
                } else if (RacePropKeys.indexOf(k) > -1) {
                    origin[k] = parseInt(rOC[k]);
                };
            })
            comm.properties.community.race = raceOriginComm
            comm.properties.community.race.origin = origin
            // console.log("comm.properties.community.race", comm.properties.community.race)
        });
        appendRAGC(data);
    });
};

////////////////////////////////////////////////////////////////////////////////
//                    Race Age Gender Community
////////////////////////////////////////////////////////////////////////////////
function appendRAGC(data){
    console.log("inside appendRAGC", data);
    d3.tsv("data/RaceAgeGenderCommUP2.tsv", function(error, ragc) {
        // console.log("ragc", ragc);
        data.features.forEach(function(comm){
            // compile array of objects containing each race's age information
            var raceAgeGenderComm = ragc.filter(function(rd) {
                return parseInt(rd.NAME) === comm.id;
            });
            // This is an array of objects which contains a race and the entire age/gender set
            raceAgeGenderComm.forEach(function(rowRA){
                // each row contains a race and the entire age/gender set
                d3.keys(comm.properties.community.race).forEach(function(key){
                    if (key === rowRA.GROUP) {
                        var mAge = [], fAge = [], tAge = [];
                        d3.keys(rowRA).forEach(function(dKey){
                            if (dKey.search('M[0-9]+') > -1) {
                                mAge.push({key: dKey.split('M')[1], value: parseInt(rowRA[dKey]) } )
                            }
                            else if (dKey.search('F[0-9]+') > -1) {
                                fAge.push( { key: dKey.split('F')[1], value: parseInt(rowRA[dKey]) } )
                            }
                            else if (dKey.search('T[0-9]+') > -1) {
                                tAge.push( { key: dKey.split('T')[1], value: parseInt(rowRA[dKey]) } )
                            }
                            comm.properties.community.race[key].gender = { male: mAge, female: fAge, total: tAge }
                        })
                    }
                });
            });
        });
        // Send data on to the Nesting function
        nestData(data)
    });
};

////////////////////////////////////////////////////////////////////////////////
//                  Primary map making function
////////////////////////////////////////////////////////////////////////////////
function nestData(topo) {
    console.log("In nestData", topo);

    projection.center(d3.geo.centroid(topo))

    // Nest distric and community data for more logical organization
    var nestDistComm = d3.nest()
        .key(function(d) { return d.properties.district.name; })
        .key(function(d) { return d.properties.community.name; })
        .entries(topo.features);

    // console.log("nestDistComm", nestDistComm);
    appendNestedAggregates(nestDistComm);
}

///////////////////////////////////////////////////////
///   aggregates data at district & community level
//////////////////////////////////////////////////////
function appendNestedAggregates(nest) {
    console.log("aggregated nest", nest);
    console.log("District Level Race && Gender Incomplete!!")


    function race() {
        return { "NHW": 0, "NHB": 0, "NHAS": 0, "HISP": 0,
            "NHAM": 0, "MULTI": 0,"NHOTHER": 0 //, "TOTAL":0
        };
    }

    function age(){
        return {
            "00-09": 0,  "10-19": 0,  "20-29": 0,
            "30-39": 0,  "40-49": 0,  "50-59": 0,
            "60-69": 0,  "70_OVER": 0//,  "Total": 0
        }
    };

    function gender() {
        return {"Male": 0, "Female": 0, "Total": 0}
    };

    var city = {}
    city.raceT = race()
    city.raceM = race()
    city.raceF = race()

    d3.keys(race()).forEach(function(r){
        city.raceT[r] = age();
        city.raceM[r] = age();
        city.raceF[r] = age();
    })
    // For Each District, dist...
    nest.forEach(function(dist){
        console.log("District is ", dist.key)

        dist.raceT = race();  // Race by District Total
        dist.raceM = race();  // Race by District Male
        dist.raceF = race();  // Race by District Female

        // add the ages in there
        d3.keys(race()).forEach(function(r){
            dist.raceT[r] = age();
            dist.raceM[r] = age();
            dist.raceF[r] = age();
        })


        // // Not iterate over each Community, comm
        dist.values.forEach(function(comm){
            comm.raceT = race(),  // Race by Community Total
                comm.raceM = race(),  // Race by Community Male
                comm.raceF = race();  // Race by Community Female

            var racesValues = comm.values[0].properties.community.race
            // console.log("race is ", racesValues)
            //   // build aggregate level of race at District level
            //   // That is, get the sum total of every race for every community within a district

            // For each Race, r, in the raceKeys
            d3.keys(race()).forEach(function(r){
                // console.log("\trace is ", r)
                comm.raceT[r] = age();
                comm.raceM[r] = age();
                comm.raceF[r] = age();
                //     // Accumulate the total number of members in this race.
                //     // We already have that number, we are just making the values
                //     // accessible for later on
                //     raceDistT[r] += racesValues[r].count;

                //     // Here I am accumulating the Sum total of each race,
                //     // so I can say what the TOTAL population, regardless of gender,
                //     // is for that district.
                //     raceDistT.TOTAL += racesValues[r].count;

                //     // do the same thing at the community level
                //     // Here we are just elevating the race counts up the hierarchy to make
                //     // it more accessible and in a a usable formate (arrays in this case)
                //     raceCommT[r].TOTAL += racesValues[r].count;
                //     // here we are iterating over an array of gender keys [Male, Female, Total]
                //     // we can use to select the correct gender property.
                //     // For each Gender, g
                d3.keys(gender()).forEach(function(g){
                    // console.log("\t\tgender", g)

                    // For each Age group, a
                    racesValues[r].gender[g.toLowerCase()].forEach(function(ak){
                        var a = ak.key, ageValue = ak.value
                        // console.log("\t\t\tage", a, ageValue)

                        // Here we are simply elevating the age group in the hierarchy for Male and Female
                        if(g === "Male") {
                            comm.raceM[r][a] += ageValue;
                            dist.raceM[r][a] += ageValue;
                            city.raceM[r][a] += dist.raceM[r][a];
                            // console.log("\t\t\t\tcomm.raceM[r][a]",comm.raceM[r][a])
                            // console.log("\t\t\t\tdist.raceM[r][a]",dist.raceM[r][a])
                            // console.log(r, g, a, comm.values[0].id, "ageDistM[a]",ageDistM[a], " ageCommM[a]", ageCommM[a])
                        }
                        if(g === "Female") {
                            comm.raceF[r][a] += ageValue;
                            dist.raceF[r][a] += ageValue;
                            city.raceF[r][a] += dist.raceF[r][a];
                            // console.log("\t\t\t\tcomm.raceF[r][a]",comm.raceF[r][a])
                            // console.log("\t\t\t\tdist.raceF[r][a]",dist.raceF[r][a])
                        }
                        if(g === "Total") {
                            // Here we are elevating the age group on the community level, up the hierachy,
                            comm.raceT[r][a] += comm.raceM[r][a] + comm.raceF[r][a];
                            // However, here we are accumulating the sum total of each age group
                            dist.raceT[r][a] += dist.raceM[r][a] + dist.raceF[r][a];
                            city.raceT[r][a] += dist.raceT[r][a]
                            // console.log("\t\t\t\tcomm.raceT[r][a]",comm.raceT[r][a])
                            // console.log("\t\t\t\tdist.raceT[r][a]",dist.raceT[r][a])

                        }
                    })
                })
                // console.log("\t\tcomm.raceM[r]",d3.entries(comm.raceT[r]))
                // console.log("\t\tdist.raceM[r]",dist.raceT[r])

                comm.raceT[r] = d3.entries(comm.raceT[r])
                comm.raceM[r] = d3.entries(comm.raceM[r])
                comm.raceF[r] = d3.entries(comm.raceF[r])

            })
            // console.log("\tcom.raceT",d3.entries(comm.raceT))
            comm.raceT = d3.entries(comm.raceT)
            comm.raceM = d3.entries(comm.raceM)
            comm.raceF = d3.entries(comm.raceF)
            // dist.raceT = d3.entries(raceDistT);
            // console.log("\traceComm",dist.raceT)

        })
        d3.keys(race()).forEach(function(r){
            dist.raceT[r] = d3.entries(dist.raceT[r]);
            dist.raceM[r] = d3.entries(dist.raceM[r]);
            dist.raceF[r] = d3.entries(dist.raceF[r]);
        })
        dist.raceT = d3.entries(dist.raceT)
        dist.raceM = d3.entries(dist.raceM)
        dist.raceF = d3.entries(dist.raceF)
    })
    d3.keys(race()).forEach(function(r){
        city.raceT[r] = d3.entries(city.raceT[r]);
        city.raceM[r] = d3.entries(city.raceM[r]);
        city.raceF[r] = d3.entries(city.raceF[r]);
    })
    city.raceT = d3.entries(city.raceT)
    city.raceM = d3.entries(city.raceM)
    city.raceF = d3.entries(city.raceF)

    var aggData = [city,nest]

    makeMap(aggData);
}


////////////////////////////////////////////////////////////////////////////////
//                  Primary map making function
////////////////////////////////////////////////////////////////////////////////
function makeMap(nest) {
    console.log("In makeMap", nest);

    // District level data join
    chicagoStack.push(nest[0])
    var district = svg.selectAll("g.district").data(nest[1])
    // donut svg
    svg.append("g").attr("class", "donut")
    svg.append("g").attr("class", "population")

    // District level Update Pattern
    var districtEnter = district.enter().append("g")
        .attr("class", function(d) {
            return "district " + d.key.replace(/\s|'/g, '_')
        })
        .style("fill",function(d) {
            return color10(d.key)
        })

    // Community level data join, extracts community level data from district
    var community = district.selectAll("g.community")
        .data(function(d){ return d.values})

    // Community level Update pattern
    var communityEnter = community.enter().append("g")
        .attr('class', function(d){
            return "community " + d.key.replace(/\s|'/g, '_')
        });

    // Append Path elements to community g's
    communityEnter.append("path")
        .classed("boundary", true)
        .attr("d", function(d){
            return path(d.values[0])
        });


    // Array to hold positions of where the District labels fall within the map
    districtLabelPos = [
        [1140.5031214249061,345.4841104606627], //farnorth *
        [1560.5031214249061,703.1232091893608], // north side *
        [1609.7979511953843,962.7053750767045], // central *
        [789.2386914991861,731.207982993439], // north west side *
        [935.4344700176821,1000.9765203036148], // westside *
        [1710.0655965725955,1254.9106891589777], // southside *
        [1980.1569471215657,1612.664288366978], // far south east side *
        [777.1471029108511,1356.1624746165123], // south west side *
        [1100.1471029108511,1700.1624746165123] // far south west side *
    ] //translate(780.1471029108511,1356.1624746165123)

    // Set district names, add mouseover and mouseout functionality
    districtEnter.append("text")
        .classed("dlabel",true)
        .attr("transform", function(d,i) {
            return "translate(" + districtLabelPos[i][0] + "," + districtLabelPos[i][1] +")";
        })
        .attr("dy", ".35em")
        .text(function(d) {
            return d.values[0].values[0].properties.district.name ;
        })

    districtEnter.append("circle")
        .attr("cx", 10)
        .attr("cy", 10)
        .attr("r", 10)
        .attr("transform", function(d,i) {
            return "translate(" + districtLabelPos[i][0] + "," + (districtLabelPos[i][1]+10) +")";
        })

    // Object to hold positions of errant labels
    var commLabelPos = {
        "O_Hare": "translate(550.0919010975593,500.9349721645051)",
        "Burnside": "translate(1622.2478666942989,1684.812617705221)",
        "West_Garfield_Park": "translate(1150.0423144232217,950.5395119412224)",
        "East_Garfield_Park": "translate(1240.7235487270556,975.4518759921707)",
        "Englewood": "translate(1465.7377190936527,1452.793975434456)",
        "Hegewisch": "translate(1795.752544153559,2010.3641730358465)"
    }

    // Add labels to community locations
    communityEnter.append("text")
        .classed("clabel", true)
        .attr("transform", function(d) {
            var clabel = d.key.replace(/\s|'/g, '_');
            var pos = commLabelPos[clabel] ;
            if (pos) {
                return pos;
            } else {
                return "translate(" + path.centroid(d.values[0]) + ")";
            }
        }).attr("dy", ".35em")
        .text(function(d) {
            return d.values[0].properties.community.name.toUpperCase();
        })

    ////////////////////////////////////////////////////////////
    ////           Selection Listeners!
    ////////////////////////////////////////////////////////////

    // add some listeners for ditstrict
    // svg.selectAll(".dlabel")
    districtEnter
        .on("dblclick", function(d){ console.log("dblclick!", d)
            window.foo = d3.select("input[value=\"Male\"]")
            var selection = d3.select("g.district."+d.key.replace(/\s|'/g, '_'))[0][0].classList
            // If the district has never been selected, or it is currently set to zero...
            if (d3.values(selection).indexOf("c-selected") < 0) {

                // color it yellow
                d3.select("g.district."+d.key.replace(/\s|'/g, '_'))
                    .classed("d-selected",true)
                    .classed("c-selected",true);
                // push onto stack
                districtSelection.push(d);
                // Make sure we only have 3 communities selected at a time,
                // shift the leading selection off the stack and demark it.
                if (districtSelection.length > 3) {
                    // shift the head off the stack
                    var shifted = districtSelection.shift();
                    // color it as unselected
                    d3.select("g.district."+shifted.key.replace(/\s|'/g, '_'))
                        .classed("d-selected",false)
                        .classed("c-selected",false);

                    console.log("shifted ",shifted); // let us know that is was shifted
                }
                drawGenderCharts()
                // if it was already selected
            } else {
                // prepare to pop it
                var popped;
                // if our stack is size 3
                console.log("index of ",districtSelection.indexOf(d))
                if(districtSelection.length == 3){
                    switch (districtSelection.indexOf(d)) {
                        case 0:
                            console.log("index is at 1")
                            popped = districtSelection.shift();
                            break;
                        case 1:
                            var keep = districtSelection.pop(); // pop the tail, but hang on to
                            popped = districtSelection.pop(); // pop the target element
                            districtSelection.push(keep); // push the tail back onto the stack
                            break;
                        case 2:
                            popped = districtSelection.pop();
                            break;
                    }
                } else {
                    switch (districtSelection.indexOf(d)) {
                        case 0:
                            console.log("index is at 1")
                            popped = districtSelection.shift();
                            break;
                        case 1:
                            popped = districtSelection.pop();
                            break;
                    }
                }
                d3.select("g.district."+popped.key.replace(/\s|'/g, '_'))
                    .classed("d-selected",false)
                    .classed("c-selected",false);

                console.log("selection is popped", popped);// d3.select("g.population").remove();
            }
        })
        .on("mouseover", function(d){
            console.log(d)
            d3.select(this).classed("hoverD", true)
            // districtEnter.select("district."+d.key+"text.dlabel").classed("hoverD", true)
        })
        .on("mouseout", function(d){
            d3.select(this).classed("hoverD", false)
            // district.select( ".dlabel").classed("hoverD", false)
        })
    // add some listeners for communities


    // Control the state of selection
    communityEnter
        .on("mouseover", function(d){ d3.select(this).classed("c-mag", true) })
        .on("mouseout", function(d){ d3.select(this).classed("c-mag", false)})

        .on("click", function(d){ console.log("click!", d)
            var selection = d3.select("g.community."+d.key.replace(/\s|'/g, '_'))[0][0].classList
            // If the community has never been selected, or it is currently set to zero...
            if (d3.values(selection).indexOf("c-selected") < 0) {
                // color it yellow
                d3.select("g.community."+d.key.replace(/\s|'/g, '_')).classed("c-selected",true);
                d3.select("boundary").style("stroke", color10(d.key))
                // push onto stack
                communitySelection.push(d);
                // Make sure we only have 3 communities selected at a time,
                // shift the leading selection off the stack and demark it.
                if (communitySelection.length > 3) {
                    // shift the head off the stack
                    var shifted = communitySelection.shift();
                    // color it as unselected
                    d3.select("g.community."+shifted.key.replace(/\s|'/g, '_')).classed("c-selected",false);
                    console.log("shifted ",shifted); // let us know that is was shifted
                }
                // if it was already selected
                drawGenderCharts()
            } else {
                // prepare to pop it
                var popped;
                // if our stack is size 3
                console.log("index of ",communitySelection.indexOf(d))
                if(communitySelection.length == 3){
                    switch (communitySelection.indexOf(d)) {
                        case 0:
                            console.log("index is at 1")
                            popped = communitySelection.shift();
                            break;
                        case 1:
                            var keep = communitySelection.pop(); // pop the tail, but hang on to
                            popped = communitySelection.pop(); // pop the target element
                            communitySelection.push(keep); // push the tail back onto the stack
                            break;
                        case 2:
                            popped = communitySelection.pop();
                            break;
                    }
                } else {
                    switch (communitySelection.indexOf(d)) {
                        case 0:
                            console.log("index is at 1")
                            popped = communitySelection.shift();
                            break;
                        case 1:
                            popped = communitySelection.pop();
                            break;
                    }
                }
                d3.select("g.community."+popped.key.replace(/\s|'/g, '_')).classed("c-selected",false);
                console.log("selection is popped", popped);// d3.select("g.population").remove();
            }
        })

    d3.select("#genderButton").on("click", updateGenderCharts);

    // Make the chicago graph constant
    if(chartType ===0 ) {gData = chicagoStack[0].raceT; gLabel = "Total: Chicago" }
    if(chartType ===1 ) {gData = chicagoStack[0].raceF; gLabel = "Female: Chicago" }
    if(chartType ===2 ) {gData = chicagoStack[0].raceM; gLabel = "Male: Chicago" }

    d3.select("g.population").datum([gLabel, gData]).each(pChart0.plot)
}


function updateGenderCharts(){
    console.log("updating gender charts!", chartType)
    chartType++;
    if (chartType > 2) {
        chartType = 0;
    }
    drawGenderCharts()
}


function drawGenderCharts() {
    console.log("drawing gender charts!",chartType)
    // Now update the charts
    var gLabel = '',
        gData;
    if(chartType ===0 ) {gData = chicagoStack[0].raceT; gLabel = "Total: Chicago" }
    if(chartType ===1 ) {gData = chicagoStack[0].raceF; gLabel = "Female: Chicago" }
    if(chartType ===2 ) {gData = chicagoStack[0].raceM; gLabel = "Male: Chicago" }

    d3.select("g.population").datum([gLabel, gData]).each(pChart0.plot)

    districtSelection.forEach(function(dg,i){
        if(chartType ===0 ) {gData = dg.raceT; gLabel = "Total: "+dg.key }
        if(chartType ===1 ) {gData = dg.raceF; gLabel = "Female: "+dg.key }
        if(chartType ===2 ) {gData = dg.raceM; gLabel = "Male: "+dg.key }
        console.log("gonna make some district graphs!", districtSelection.length,i, dg.key, dg)
        switch (i) {
            case 0:
                d3.select("g.population").datum([gLabel, gData]).each(pChart01.plot)
                break;
            case 1:
                d3.select("g.population").datum([gLabel, gData]).each(pChart11.plot)
                break;
            case 2:
                d3.select("g.population").datum([gLabel, gData]).each(pChart21.plot)
                break;
        }
    })

    // Now update the charts
    communitySelection.forEach(function(dg,i){
        console.log("gonna make some community graphs!", communitySelection.length,i, dg.key, dg)

        if(chartType ===0 ) {gData = dg.raceT; gLabel = "Total: "+dg.key }
        if(chartType ===1 ) {gData = dg.raceF; gLabel = "Female: "+dg.key }
        if(chartType ===2 ) {gData = dg.raceM; gLabel = "Male: "+dg.key }
        switch (i) {
            case 0:
                d3.select("g.population").datum([gLabel, gData]).each(pChart02.plot)
                break;
            case 1:
                d3.select("g.population").datum([gLabel, gData]).each(pChart12.plot)
                break;
            case 2:
                d3.select("g.population").datum([gLabel, gData]).each(pChart22.plot)
                break;
        }
    })
}

// window.pChart = popChart();

function popChart(left, top, _color) {
    var margin = {top: 20, right: 20, bottom: 30, left: 60},
        width = 1000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x0 = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = _color

    // set up xAxis
    var xAxis = d3.svg.axis()
        .scale(x0)
        .orient("bottom");

    // set up yAxis
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));

    var gPop = d3.select("#viz").append("svg")
        .style("position","absolute")
        .style("display","block")
        .style("left",left)
        .style("top",top)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("float", "right")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var title = gPop.append("text")
        .attr("class", "title")
        .attr("dy", ".11em")
        .attr("dx", "17.71em")

    // setup svg
    function chart() {
        gPop.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);


        gPop.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Population");

        var race = gPop.selectAll(".race")
            .append("g")
            .attr("class","race")
    }

    // data is an array which consists of the selected communities name,
    // and an array of objects
    chart.plot = function(data){
        console.log("Updating!", data)

        // A label for the selected region.
        var name = data[0]
        var dval = data[1]

        gPop.select("text.title").text("Population: "+name);
        // extract Legend label names, only do this once
        var ageNames = dval[0].value.map(function(d){return d.key})
        console.log("ageNames", ageNames)

        // Set the X Domains and the Y domains....I guess?
        x0.domain(dval.map(function(d){ return d.key }));
        x1.domain(ageNames).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(dval, function(d) { return d3.max(d.value, function(d) { return d.value; }); })]);

        gPop.select("g.x.axis")
            .call(xAxis);

        gPop.select("g.y.axis")
            .call(yAxis)


        var race = gPop.selectAll("g.race").data(dval); // <---------- DATA-JOIN

        race.enter().append("g").attr("class", "race"); // <---------- ENTER

        race.attr("transform", function(d) {
            return "translate(" + x0(d.key) + ",0)";       // <---------- UPDATE EVERYONE
        })

        var rect = race.selectAll("rect").data(function(d) { return d.value; })

        rect.enter().append("rect")
            .attr("width", x1.rangeBand())

        rect.transition() // WHAT?!?!?!
            .duration(700) // WHAT'S HAPPENING?!?!?!
            .attr("x", function(d) { return x1(d.key); })
            .attr("y", function(d) {
                // console.log("y(d.value)", y(d.value))
                return y(d.value); })
            .style("fill", function(d) { return color(d.key); })
            .style("fill-opacity",".5")
            .attr("height", function(d) { return height - y(d.value); })

        // The legend...This actually works!
        var legend = gPop.selectAll(".legend")
            .data(ageNames.slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color)
            .style("fill-opacity",".5");

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });
    }
    return chart;
}