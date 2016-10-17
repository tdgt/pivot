//The MIT License (MIT)
//
//Copyright (c) 2015 Thornton Tomasetti, Inc.
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

//global variables defined in Spectacles
var LAYERLIST
var ELEMENTS
var LAYERSTART
var SELATTRIBUTES
var CLICKEDELEMENT
var CAMERA
var PROJECTOR
var SCENE
var VIEWERDIV
var BOUNDINGSPHERE
var ORBITCONTROLS
var ORIGINALMATERIALS

//base application object containing Spectacles functions and properties
var SPECTACLES = function (divToBind, jsonFileData, callback) {

    var SPECT = this;        //a local app object we can work with inside of the constructor to avoid 'this' confusion.
    SPECT.viewerDiv = divToBind;  //a reference to the div for use throughout the app

    SPECT.scene = {};          //the THREE.js scene object
    SPECT.jsonLoader = {};     //the object that will take care of loading a THREE.js scene from a json file
    SPECT.boundingSphere = undefined;      //a sphere that encompasses everything in the scene
    SPECT.lightingRig = {};    //a parent object to hold our lights.  We'll be setting properties with UI
    SPECT.orbitControls = {};  //the THREE.js orbit controls object
    SPECT.camera = {};         //the THREE.js camera object
    SPECT.renderer = {};       //the THREE.js renderer object
    SPECT.clock = {};          //the THREE.js clock
    SPECT.stats = undefined;               //the Stats object
    SPECT.backgroundColor = 0xFFFFFF;
    
    
    
    //Store Starting Materials
    SPECT.originalMaterials = [];
    SPECT.layerStorage = [];
    SPECT.attributeSet = [];
    SPECT.attributeList = [];
    SPECT.guiList = [];
    SPECT.guiCount = 0;
    SPECT.filters = [];
    SPECT.filterVals = [];
    SPECT.counter = 0;
    SPECT.uniqueValues = 0;
    SPECT.searchedElements = [];
    SPECT.dataElements = [];
    var timeGUI = undefined;
    var customContainer = undefined;   

    //*********************
    //*********************
    //*** THREE.js setup

    //function that sets up the initial THREE.js scene, renderer, camera, orbit controls, etc.
    //also creates loading and blackout divs which are shown/hidden as json files are loaded
    SPECT.initViewer = function (viewerDiv) {

        //append the blackout div and let it respond to the parent div resizing
        SPECT.viewerDiv.append("<div class='Spectacles_blackout'></div>");
        //function to position and size the blackout div
        var setBlackout = function () {
            //set the position of the UI relative to the viewer div
            var targetDiv = $('.Spectacles_blackout');

            //get upper left coordinates of the viewer div - we'll use these for positioning
            var win = $(window);
            var x = SPECT.viewerDiv.offset().left - win.scrollLeft();
            var y = SPECT.viewerDiv.offset().top - win.scrollTop();

            //set the position and size
            targetDiv.css('left', x.toString() + "px");
            targetDiv.css('top', y.toString() + "px");
            targetDiv.css('width', SPECT.viewerDiv.width().toString() + "px");
            targetDiv.css('height', SPECT.viewerDiv.height().toString() + "px");
        };
        //call this the first time through
        setBlackout();
        //respond to resize of the parent div
        SPECT.viewerDiv.resize(function () {
            setBlackout();
        });


        //append the loading div and let it respond to the parent div resizing
        SPECT.viewerDiv.append("<div class='Spectacles_loading'><h1>Loading .json file...</h1></div>");
        //function to position the loading div
        var setLoading = function () {

            //set the position of the UI relative to the viewer div
            var targetDiv = $('.Spectacles_loading');

            //get upper left coordinates of the viewer div - we'll use these for positioning
            var win = $(window);
            var x = ((SPECT.viewerDiv.offset().left + SPECT.viewerDiv.outerWidth()) - win.scrollLeft()) / 2;
            var y = ((SPECT.viewerDiv.offset().top + SPECT.viewerDiv.outerHeight()) - win.scrollTop()) / 2;

            //set the position and size
            targetDiv.css('left', x.toString() + "px");
            targetDiv.css('top', y.toString() + "px");
        };
        //call this the first time through
        setLoading();
        //respond to resize of the parent div
        SPECT.viewerDiv.resize(function () {
            setLoading();
        });


        //append a footer.  Feel free to strip this out if you'd like to! ;]

        //function to position footer
        var setFooter = function(){
            //set the position of the UI relative to the viewer div
            var targetDiv = $('.Spectacles_Footer');

            //get lower right coordinates of the viewer div - we'll use these for positioning
            var win = $(window);
            var x = SPECT.viewerDiv.offset().left - win.scrollLeft();
            var y = (SPECT.viewerDiv.offset().top - win.scrollTop()) + SPECT.viewerDiv.height();

            //set the position
            targetDiv.css('left', x.toString() + "px");
            targetDiv.css('top', (y - 25).toString() + "px");
        };
        //call the first time through
        setFooter();
        //respond to resize of the parent div
        SPECT.viewerDiv.resize(function () {
            setFooter();
        });

        //empty scene
        SPECT.scene = new THREE.Scene();

        //set up the THREE.js div and renderer
        SPECT.container = viewerDiv;
        SPECT.renderer = new THREE.WebGLRenderer(
            {
                maxLights: 10,
                antialias: true
            }
        );
        SPECT.renderer.setClearColor(SPECT.backgroundColor, 1.0);
        SPECT.renderer.setSize(viewerDiv.innerWidth(), viewerDiv.innerHeight());
        SPECT.renderer.shadowMapEnabled = true;
        SPECT.container.append(SPECT.renderer.domElement);

        //set up the camera and orbit controls
        SPECT.camera = new THREE.PerspectiveCamera(45, viewerDiv.innerWidth() / viewerDiv.innerHeight(), 1, 1000000);
        SPECT.camera.position.set(1000, 1000, 1000);
        SPECT.orbitControls = new THREE.OrbitControls(SPECT.camera, SPECT.renderer.domElement);
        SPECT.orbitControls.target.set(0, 100, 0);
        //push to global variable for pivot
        CAMERA = SPECT.camera;
        ORBITCONTROLS = SPECT.orbitControls;

        //a clock.  the camera uses this
        SPECT.clock = new THREE.Clock();

        //respond to resize
        viewerDiv.resize(function () {
            var WIDTH = viewerDiv.innerWidth(),
                HEIGHT = viewerDiv.innerHeight();
            SPECT.renderer.setSize(WIDTH, HEIGHT);
            SPECT.orbitControls.object.aspect = WIDTH / HEIGHT;
            SPECT.orbitControls.object.updateProjectionMatrix();
        });

        //respond to window resize and scrolling.  when the window resizes, sometimes it moves our parent div ... and all of our
        //children need to be repositioned (maybe I'm just horrible with CSS?).  On a resize, trigger the resize
        //event on our parent DIV, which should reposition all of the children.
        window.addEventListener('resize', function () {
            SPECT.viewerDiv.resize();
        });
        window.addEventListener('scroll', function () {
            SPECT.viewerDiv.resize();
        });


        //call the render function - this starts the webgl render loop
        SPECT.render();
    };

    //function that starts the THREE.js renderer
    SPECT.render = function () {
        if (SPECT.stats !== undefined) {
            SPECT.stats.update();
        }
        var delta = SPECT.clock.getDelta();
        SPECT.orbitControls.update(delta); //getting a warning here - look into it

        requestAnimationFrame(SPECT.render); // same here - look into this warning
        SPECT.renderer.render(SPECT.scene, SPECT.orbitControls.object);
    };

    //*********************
    //*********************
    //*** TOP LEVEL FUNCTION CALLS
    //these are called from outside and enable / disable chunks of application functionality and UI

    //**********************TOP LEVEL METHOD!!!**********************************
    //this is the method that is called to initialize the dat.GUI user interface.
    SPECT.userInterface = function () {

        //append a child div to our parent and use the child to host the dat.GUI controller
        $('body').append('<div class="Spectacles_uiTarget"></div>');

        //initialize the Dat.GUI object, and bind it to our target div
        SPECT.uiVariables = new SPECT.UiConstructor();
        SPECT.datGui = new dat.GUI();
        SPECT.datGui.width = 300;
        
        //ABOVE THIS UN COMMENT STUFF FOR ORIGINAL
        
        //hide the dat.gui close controls button
        $(".close-button").css('visibility', 'hidden');


        //Jquery UI stuff - make divs draggable, resizable, etc.

        //make the attributes div draggable and resizeable
        //$('.Spectacles_attributeList').draggable({ containment: "parent" });
        $('.attributeList').resizable();

    };
    


    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable the file open UI.
    SPECT.openLocalFiles = function () {

        //function to position the loading div
        var setFileOpen = function () {

            //set the position of the UI relative to the viewer div
            var targetDiv = $('.Spectacles_openFile');

            //get upper left coordinates of the viewer div - we'll use these for positioning
            var x = (SPECT.viewerDiv.position().left + SPECT.viewerDiv.width()) / 2;
            var y = (SPECT.viewerDiv.position().top + SPECT.viewerDiv.height()) / 2;

            //set the position and size
            targetDiv.css('left', x.toString() + "px");
            targetDiv.css('top', y.toString() + "px");
        };
        //call this the first time through
        setFileOpen();
        //respond to resize of the parent div
        SPECT.viewerDiv.resize(function () {
            setFileOpen();
        });

        //add a file folder containing the file open button
        var fileFolder = SPECT.datGui.addFolder('File');
        SPECT.UIfolders.File = fileFolder;
        fileFolder.add(SPECT.uiVariables, 'openLocalFile').name("Open JSON Files");
        //fileFolder.add(SPECT.uiVariables, 'openUrl'); //not working yet - commenting out for now

        //make the file open divs draggable
        //$(".Spectacles_openFile").draggable({ containment: "parent" });
    };

    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable the Scene UI
    SPECT.sceneUI = function () {
        //add scene folder
        var sceneFolder = SPECT.datGui.addFolder('Scene');
        SPECT.UIfolders.Scene = sceneFolder;
        //background color control
        sceneFolder.addColor(SPECT.uiVariables, 'backgroundColor')
            .listen()
            .onChange(function (e) {
            //set background color
            SPECT.renderer.setClearColor(e);
        });
        //scene fog
        //sceneFolder.add(SPECT.uiVariables, 'fog').onChange(function(e){
        //        Spectacles.lightingRig.setFog(e);
        //    });

        //append a new div to the parent to use for stats visualization
        SPECT.viewerDiv.append("<div id='Spectacles_stats' style= 'position: fixed;'></div>");

        //set up the stats window
        SPECT.stats = new Stats();
        SPECT.stats.domElement.style.cssText = 'opacity: 0.5; position: fixed; ';
        $('#Spectacles_stats').append(SPECT.stats.domElement);

        //position the stats relative to the parent
        var positionStats = function () {
            //set the position of the UI relative to the viewer div
            var targetDiv = $('#Spectacles_stats');

            //get lower right coordinates of the viewer div - we'll use these for positioning
            //get upper left coordinates of the viewer div - we'll use these for positioning
            var win = $(window);
            var x = (SPECT.viewerDiv.offset().left - win.scrollLeft()) + SPECT.viewerDiv.width();
            var y = (SPECT.viewerDiv.offset().top - win.scrollTop()) + SPECT.viewerDiv.height();

            //set the position
            targetDiv.css('left', (x - 77).toString() + "px");
            targetDiv.css('top', (y - 48).toString() + "px");
        };
        positionStats();

        //hide the stats the first time through.
        $('#Spectacles_stats').hide();


        //respond to resize
        SPECT.viewerDiv.resize(function () {
            positionStats();
        });

        //create the controller in the UI
        SPECT.UIfolders.Scene.add(SPECT.uiVariables, 'showStats').onChange(function (e) {
            if (e) {
                $('#Spectacles_stats').show();
            }
            else {
                $('#Spectacles_stats').hide();
            }
        });
    };

    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable the Lighting UI
    SPECT.lightingUI = function () {
        //add a lighting folder
        var lightsFolder = SPECT.datGui.addFolder('Lighting');
        SPECT.UIfolders.Lighting = lightsFolder;
        //light colors
        lightsFolder.addColor(SPECT.uiVariables, 'ambientLightColor').onChange(function (e) {
            SPECT.lightingRig.setAmbientLightColor(e);
        });
        lightsFolder.addColor(SPECT.uiVariables, 'pointLightsColor').onChange(function (e) {
            SPECT.lightingRig.setPointLightsColor(e);
        });
        lightsFolder.add(SPECT.uiVariables, 'shadows').onChange(function (e) {
            SPECT.lightingRig.shadowsOnOff(e);
        });
//        //solar az and alt
         lightsFolder.add(SPECT.uiVariables, 'solarAzimuth')
         .min(0)
         .max(359)
         .step(1);
         lightsFolder.add(SPECT.uiVariables, 'solarAltitude')
         .min(0)
         .max(90)
         .step(0.1);
    };

           
    //**********************COLOR CODING (ADDED BY DG)******************************
    //call this method to enable color coding UI
    SPECT.colorCodingUI = function(){
        var colorCodeFolder = SPECT.datGui.addFolder('Color_Coding');
        SPECT.UIfolders.Color_Coding = colorCodeFolder;
        SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables, 'Rendered');
        //SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables, 'Textured');
        //SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables, 'colorCodeByType');
        //SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables, 'colorCodeByZone');
        //SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables, 'colorByAttribute');
        //console.log(SPECT.UIfolders.Color_Coding.__controllers.length);
    };
    
    //***********************TIMELINE UI(ADDED BY DG)*************************************
    //call this method to enable construction timeline UI
    SPECT.timelineUI = function(){
        var timelineFolder = SPECT.datGui.addFolder('Construction_Timeline');
        SPECT.UIfolders.timeline = timelineFolder;
        SPECT.UIfolders.timeline.add(SPECT.uiVariables,'startDate');
        SPECT.UIfolders.timeline.add(SPECT.uiVariables,'endDate');
        SPECT.UIfolders.timeline.add(SPECT.uiVariables, 'generateTimeline');
        //SPECT.UIfolders.timeline.add(SPECT.uiVariables,'time',-5,5).step(1);
    }
    
    //***********************SEARCH BY ATTRIBUTES (ADDED BY DG)********************************
    //call this method to enable search UI
    SPECT.searchUI = function(){ 
        SPECT.searchedElements = SPECT.attributes.elementList;
        updateCnsl();
        SPECT.max_filters();
        var searchFolder = SPECT.datGui.addFolder('Search_Model');
        SPECT.UIfolders.Search_Model = searchFolder;
        //SPECT.datGui.add(SPECT.uiVariables, 'downloadExcel').name('Download CSV File');
        SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'filterUI').name("Add Filter").onChange(function(e){
            SPECT.guiCount += 1;
            if (SPECT.guiCount === 1){
                //SPECT.UIfolders.Search_Model.removeByProperty('SEARCH');
                //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'filteredSearch').name("Filtered Search");
                $(".ColorConsole").css('visibility','hidden');
                $(".ColorHeader").css('visibility', 'hidden');
                //SPECT.UIfolders.Search_Model.removeByProperty('RESET');
                //SPECT.UIfolders.Search_Model.removeByProperty('Attribute_To_Search_For');
                //SPECT.UIfolders.Search_Model.removeByProperty('Available_Attributes');
                //SPECT.UIfolders.Search_Model.removeByProperty('colorByAttribute');
                //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'RESET');
            }
        });
//        SPECT.UIfolders.Search_Model.add(SPECT.uiVariables.filterObj, 'openFilt').name('Add Filter').onChange(function(e){
//            SPECT.guiCount += 1;
//            console.log(SPECT.guiCount);
//            SPECT.UIfolders.Search_Model.removeByProperty('Attribute_To_Search_For');
//            SPECT.UIfolders.Search_Model.removeByProperty('Available_Attributes');
//        });
        //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'Number_Of_Criteria').min(1).step(1);
        //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'ADD_FILTER');
        //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'SEARCH');
        SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'RESET');
        SPECT.CreateScopeList();
        SPECT.CreateAttributeList();
        
        //console.log(SPECT.uiVariables.filterObj.filterList);
    };
    
        //***********************Download Data (ADDED BY DG)********************************
    SPECT.downloadUI = function(){
        var downloadFolder = SPECT.datGui.addFolder('Download_Data');
        SPECT.UIfolders.Download_Data = downloadFolder;
        SPECT.UIfolders.Download_Data.add(SPECT.uiVariables, 'downloadComplete').name('Download Complete Data Set');
        SPECT.UIfolders.Download_Data.add(SPECT.uiVariables, 'downloadFiltered').name('Download Filtered Data Set');
    }
    
    //*****************************CREATE FILTER GUIs (ADDED BY DG)**************************
    SPECT.filterUI = function () {
        var index = SPECT.guiCount;
        //console.log(index);
        SPECT.guiList[index] = new dat.GUI({autoPlace: true ,width:300});
        SPECT.guiList[index].add(SPECT.uiVariables, 'closeFilter').name('[X] CLOSE').onChange(function(e){
            index = SPECT.guiCount;
            SPECT.filters.splice(index,1);
            SPECT.filterVals.splice(index,1);
            //console.log(SPECT.filters);
            var panels = SPECT.attributes.elementList;
            var layerL = SPECT.layerStorage;
            //check to see what layers are on
            for (i=0;i<layerL.length;i++){
                var lay = layerL[i];
                if (lay[Object.keys(lay)[0]] === true){
                    for (j=0;j<panels.length;j++){
                        var panel = panels[j];
                        //console.log(panel.userData.layer);
                        if (panel.userData.layer === Object.keys(lay)[0] && panel.visible === false){
                            panel.visible = true;
                        }
                    }
                }
            }
            if(SPECT.guiCount !== 0){
                SPECT.filteredSearch();
            }
            if(SPECT.guiCount == 1){
                $(".CounterConsole").css('visibility','hidden');
                $(".ConsoleHeader").css('visibility', 'hidden');
                //SPECT.UIfolders.Search_Model.removeByProperty('filteredSearch');
                //SPECT.UIfolders.Search_Model.removeByProperty('RESET');
                //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'SEARCH');
                //SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'RESET');
                //SPECT.CreateAttributeList();
                SPECT.uiVariables.Attribute_To_Search_For = 'a';
                SPECT.dataElements = [];
                SPECT.RESET();
            }
            SPECT.guiCount -= 1;
        });
        SPECT.CreateFilterList(index);
        
        
    }
    
    
    SPECT.closeFilter = function(){
        var index = SPECT.guiCount+1;
        SPECT.guiList[index].destroy();
    }
    
    SPECT.max_filters = function (){
        var objects = SPECT.attributes.elementList;
        var attributeList = [];
        for (i=0;i<objects.length;i++){
            var obj = objects[i];
            attL = obj.userData;
            //console.log(attL);
            //console.log(Object.keys(attL).length);
            //console.log(Object.keys(attL)[1]);
            for(j=0;j<Object.keys(attL).length;j++){
                //console.log(attL[j]);
                if (Object.keys(attL)[j] != 'layer'){
                    attributeList.push(Object.keys(attL)[j]);
                }
            }
        }
        var attributeSet = Array.from(new Set(attributeList));
        for(i=0;i<attributeSet.length;i++){
            SPECT.guiList[i] = new Object();
        }
    };
    
    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable view and selection UI
    SPECT.viewAndSelectionUI = function () {
        //add view folder
        var viewFolder = SPECT.datGui.addFolder('View_and_Selection');
        SPECT.UIfolders.View_and_Selection = viewFolder;
        //zoom extents and selected
        viewFolder.add(SPECT.uiVariables, 'zoomExtents');
        viewFolder.add(SPECT.uiVariables, 'zoomSelected');
        //change color of selected object's material
        viewFolder.addColor(SPECT.uiVariables, 'selectedObjectColor').onChange(function (e) {
            SPECT.attributes.setSelectedObjectColor(e);
        });

        //initialize object selection and attributes display
        SPECT.attributes.init();
    };

    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable the view dropdown UI
    SPECT.viewsUI = function () {
        SPECT.views.viewsEnabled = true;
        if (SPECT.views.viewList.length !== 0) {
            SPECT.views.purge();
        }
        SPECT.views.getViews();
        SPECT.views.CreateViewUI();

    };

    //**********************TOP LEVEL METHOD!!!**********************************
    //call this method to enable the view dropdown UI
    SPECT.layersUI = function () {
        SPECT.layers.layersEnabled = true;
        if (SPECT.layers.layerList.length !== 0) {
            SPECT.layers.purge();
        }
        SPECT.layers.getLayers();
        SPECT.layers.CreateLayerUI();
    };


    

    //*********************
    //*********************
    //*** JSON Model Loader

    //a function to open a file from disk
    //found this method here: http://www.javascripture.com/FileReader
    SPECT.jsonLoader.openLocalFile = function (event) {
       
        //the input object
        var input = event.target;

        //a new filereader object and onload callback
        var reader = new FileReader();
        reader.onload = function () {

            //data variable to populate
            var data = null;

            try { //get the json data
                data = $.parseJSON(reader.result);
            } catch (e) {
                console.log("something went wrong while trying to parse the json data.");
                console.log(e);
                return;
            }

            try { //load the json data into the scene

                if (data !== null) {
                    SPECT.jsonLoader.loadSceneFromJson(data);
                    SPECT.zoomExtents();
                    SPECT.views.storeDefaultView();
                }


            } catch (e) {
                console.log("something went wrong while trying to load the json data.");
                console.log(e);
            }
            //SPECT.UIfolders.Search_Model.removeByProperty('Attribute_To_Search_For');
            //SPECT.UIfolders.Search_Model.removeByProperty('Available_Attributes');
            SPECT.UIfolders.Search_Model.removeByProperty('Scopes');
            SPECT.UIfolders.Color_Coding.removeByProperty('Attribute_To_Search_For');
            SPECT.CreateScopeList();
            SPECT.CreateAttributeList();
        };

        //read the file as text - this will fire the onload function above when a user selects a file
        reader.readAsText(input.files[0]);
        SPECT.UIfolders.Color_Coding.removeByProperty('colorByAttribute');

        //hide the input form and blackout
        $("#OpenLocalFile").css("visibility", "hidden");
        $(".Spectacles_loading").show();
    };

    SPECT.jsonLoader.clearFile = function (event) {
        //the input object
        var input = event.target;
        input.value = "";

    };

    //function to open a file from url
    SPECT.jsonLoader.openUrl = function (url) {

        //hide form, show loading
        $("#OpenLocalFile").css("visibility", "hidden");
        $(".Spectacles_loading").show();

        //try to parse the json and load the scene
        try {
            $.getJSON(url, function (data) {
                try {
                    //call our load scene function
                    SPECT.jsonLoader.loadSceneFromJson(data);
                    SPECT.zoomExtents();
                    SPECT.views.storeDefaultView();
                } catch (e) {
                    $(".Spectacles_loading").hide();
                    $(".Spectacles_blackout").hide();
                    console.log("Spectacles load a scene using the json data from the URL you provided!  Here's the error:");
                    console.log(e);
                }
            })
                //some ajax errors don't throw.  this catches those errors (i think)
                .fail(function(){
                    $(".Spectacles_loading").hide();
                    $(".Spectacles_blackout").hide();
                    console.log("Spectacles could not get a json file from the URL you provided - this is probably a security thing on the json file host's end.");
                });
        } catch (e) {
            $(".Spectacles_loading").hide();
            $(".Spectacles_blackout").hide();
            console.log("Spectacles could not get a json file from the URL you provided!  Here's the error:");
            console.log(e);
        }
    };

    //function to hide the 'open file' dialogs.
    SPECT.jsonLoader.hideOpenDialog = function () {
        //hide the input form
        $(".Spectacles_openFile").css("visibility", "hidden");
    };

    //a function to populate our scene object from a json file
    SPECT.jsonLoader.loadSceneFromJson = function (jsonToLoad) {

        //show the blackout and loading message
        $(".Spectacles_blackout").show();
        $(".Spectacles_loading").show();

        //restore the initial state of the top level application objects
        if (SPECT.attributes.elementList.length > 0) {
            SPECT.attributes.purge();
        }
        if (SPECT.lightingRig.pointLights.length > 0) {
            SPECT.lightingRig.purge();
        }
        if (SPECT.views.viewList.length > 0) {
            SPECT.views.purge();
        }
        if (SPECT.layers.layerList.length > 0) {
            SPECT.layers.purge();
        }
        if (SPECT.originalMaterials.length > 0){
            SPECT.originalMaterials = [];
        }

        //parse the JSON into a THREE scene
        var loader = new THREE.ObjectLoader();
        SPECT.scene = new THREE.Scene();
        SPECT.scene = loader.parse(jsonToLoad);
        //push to global variable for pivot
        SCENE = SPECT.scene;
        //SPECT.scene.fog = new THREE.FogExp2(0x000000, 0.025);

        //call helper functions
        SPECT.jsonLoader.makeFaceMaterialsWork();
        SPECT.jsonLoader.processSceneGeometry();
        SPECT.jsonLoader.computeBoundingSphere();
        //SPECT.zoomExtents();
        //SPECT.views.storeDefaultView();

        //set up the lighting rig
        SPECT.lightingRig.createLights();//note - i think we should check to see if there is an active lighting UI and use those colors to init lights if so...

        //if those chunks have been enabled by the outside caller, call getViews and getLayers on the scene.
        if (SPECT.views.viewsEnabled) {
            //TO DO --- if a view with the same name as the open view exists in the incoming file, set that view
            SPECT.views.getViews();
            SPECT.views.CreateViewUI();
        }
        if (SPECT.layers.layersEnabled) {
            SPECT.layers.getLayers();
            SPECT.layers.CreateLayerUI();
        }

        //hide the blackout
        $(".Spectacles_blackout").hide();
        $(".Spectacles_loading").hide();

    };
    


    //a function to add a textured obj/mtl pair to a scene
    SPECT.jsonLoader.addObjMtlToScene = function (objPath, mtlPath, zoomExtentsAfterLoad){
        //hide the blackout
        $(".Spectacles_blackout").show();
        $(".Spectacles_loading").show();

        //new objmtl loader object
        var loader = new THREE.OBJMTLLoader();

        //try to load the pair
        loader.load(objPath, mtlPath,
            function(loadedObj){

                //we need to mirror the objects coming in around the X axis and the Z
                var mat = (new THREE.Matrix4()).identity();
                mat.elements[0] = -1;
                mat.elements[10] = -1;

                //process the loaded geometry - make sure faces are 2 sided, merge vertices and compute, etc
                for(var i=0; i<loadedObj.children.length; i++){
                    if(loadedObj.children[i] instanceof THREE.Mesh){

                        //apply the matrix to accurately position the mesh
                        loadedObj.children[i].geometry.applyMatrix(mat);

                        //replace phong material with Lambert.  Phonga don't play so nice with our lighting setup
                        //var lambert = new THREE.MeshLambertMaterial();
                        //lambert.map = loadedObj.children[i].material.map;
                        //loadedObj.children[i].material = lambert;

                        //set up for transparency
                        loadedObj.children[i].material.side = 2;
                        loadedObj.children[i].material.transparent = true;
                        loadedObj.children[i].material.opacity = 1;
                    }
                    if(loadedObj.children[i] instanceof THREE.Object3D){
                        //loop over the children of the object
                        for(var j=0; j<loadedObj.children[i].children.length; j++){
                            //apply the matrix to accurately position the mesh
                            loadedObj.children[i].children[j].geometry.applyMatrix(mat);

                            //replace phong material with Lambert.  Phonga don't play so nice with our lighting setup
                            //var lambert = new THREE.MeshLambertMaterial();
                            //lambert.map = loadedObj.children[i].children[j].material.map;
                            //loadedObj.children[i].children[j].material = lambert;

                            //set up for transparency
                            loadedObj.children[i].children[j].material.side = 2;
                            loadedObj.children[i].children[j].transparent = true;
                            loadedObj.children[i].children[j].opacity = 1;
                        }
                    }
                }

                //add our loaded object to the scene
                SPECT.scene.add(loadedObj);

                //update lights
                SPECT.jsonLoader.computeBoundingSphere();
                SPECT.lightingRig.updateLights();

                //zoom extents?
                if(zoomExtentsAfterLoad) { SPECT.zoomExtents(); }


                //hide the blackout
                $(".Spectacles_blackout").hide();
                $(".Spectacles_loading").hide();
            },

            // Function called when downloads progress
            function ( xhr ) {
                //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },

            // Function called when downloads error
            function ( er ) {
                //console.log( 'An error happened' );
            }
        );
    };

    //call this function to set a geometry's face material index to the same index as the face number
    //this lets meshfacematerials work - the json loader only gets us part of the way there (I think we are missing something when we create mesh faces...)
    SPECT.jsonLoader.makeFaceMaterialsWork = function () {

        for (var i = 0, iLen = SPECT.scene.children.length, items; i < iLen; i++) {
            items = SPECT.scene.children;
            if (items[i].hasOwnProperty("geometry")) {

                //the object to revise
                var geo = items[i].geometry;
                var currentMat = items[i].material;
                var userData = items[i].userData;

                //if this is a face materials object, make all of the mesh faces point to the correct material
                if (currentMat.hasOwnProperty("materials") && userData.hasOwnProperty("Spectacles_FaceColorIndexes")) {

                    //get the 'Spectacles_FaceColorIndexes' string out of the mesh's user data object,
                    //and break it into an array of face material indexes
                    var faceColors = userData.Spectacles_FaceColorIndexes.split(",");

                    //loop over the faces in the geometry and make the face.materialIndex reference the face's index
                    for (var j in geo.faces) {
                        geo.faces[j].materialIndex = faceColors[j];
                    }
                    //tell three.js to update the element in the render loop
                    geo.elementsNeedUpdate = true;

                    //remove the Spectacles_FaceColorIndexes property from the userdata object
                    delete userData['Spectacles_FaceColorIndexes'];
                }
            }
        }
    };

    //function that loops over the geometry in the scene and makes sure everything
    //renders correctly and can be selected
    SPECT.jsonLoader.processSceneGeometry = function () {

        //get all of the items in the scene
        items = SPECT.scene.children;

        //loop over all of the elements and process any geometry objects
        for (var i = 0, iLen = SPECT.scene.children.length, items; i < iLen; i++) {

            //if this is a single mesh (like ones that come from grasshopper), process the geometry and add the
            //element to the attributes elements list so selection works.
            if (items[i].hasOwnProperty("geometry")) {
                //three.js stuff
                items[i].geometry.mergeVertices();
                items[i].geometry.computeFaceNormals();
                items[i].geometry.computeVertexNormals();
                items[i].castShadow = true;
                items[i].receiveShadow = true;
                //add element to our list of elements that can be selected
                //items[i].material.transparent = true;
                //items[i].material.opacity = 1.0;
                SPECT.attributes.elementList.push(items[i]);
                SPECT.originalMaterials.push(items[i].material);


            }
                //if this is an object that contains multiple meshes (like the objects that come from Revit), process the
                //children meshes so they render correctly, and add the child to the attributes.elementList
            else if (items[i].children.length > 0) {
                //let the objects cast and receive shadows
                items[i].castShadow = true;
                items[i].receiveShadow = true;
                //the children to loop over
                var itemsChildren = items[i].children;
                for (var k = 0, kLen = itemsChildren.length; k < kLen; k++) {
                    if (itemsChildren[k].hasOwnProperty("geometry")) {
                        itemsChildren[k].geometry.mergeVertices();
                        itemsChildren[k].geometry.computeFaceNormals();
                        itemsChildren[k].geometry.computeVertexNormals();
                        itemsChildren[k].material.side = 2;
                        itemsChildren[k].castShadow = true;
                        itemsChildren[k].receiveShadow = true;
                        //itemsChildren[k].material.transparent = true;
                        //itemsChildren[k].material.opacity = 1.0;
                        SPECT.attributes.elementList.push(itemsChildren[k]);

                    }
                }
            }
        }
    };
    
    //push to global Variable
    ORIGINALMATERIALS = SPECT.originalMaterials;

    //function to compute the bounding sphere of the model
    //we use this for the zoomExtents function and in the createLights function below
    SPECT.jsonLoader.computeBoundingSphere = function () {
        //loop over the children of the THREE scene, merge them into a mesh,
        //and compute a bounding sphere for the scene
        var geo = new THREE.Geometry();
        SPECT.scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                geo.merge(child.geometry);
            }
        });
        geo.computeBoundingSphere();

        //expand the scope of the bounding sphere
        SPECT.boundingSphere = geo.boundingSphere;
        BOUNDINGSPHERE = SPECT.boundingSphere;

        //for debugging - show the sphere in the scene
        //var sphereGeo = new THREE.SphereGeometry(geo.boundingSphere.radius);
        //var sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0.25}));
        //sphereMesh.position.set(geo.boundingSphere.center.x,geo.boundingSphere.center.y,geo.boundingSphere.center.z);
        //SPECT.scene.add(sphereMesh);
    };



    //zoom extents function.  we call this when we load a file (and from the UI), so it shouldn't be in the UI constructor
    SPECT.zoomExtents = function () {

        if (SPECT.boundingSphere === undefined) SPECT.computeBoundingSphere();

        //get the radius of the sphere and use it to compute an offset.  This is a mashup of theo's method
        //and the one we use in platypus
        var r = SPECT.boundingSphere.radius;
        var offset = r / Math.tan(Math.PI / 180.0 * SPECT.orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(SPECT.orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.25);
        newPos.addVectors(SPECT.boundingSphere.center, dir);
        SPECT.orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        SPECT.orbitControls.target = new THREE.Vector3(SPECT.boundingSphere.center.x, SPECT.boundingSphere.center.y, SPECT.boundingSphere.center.z);
    };

    //set background color function.  we need this at the top level so a user can set the color of her (embedded) viewer without
    //editing our library or using our UI.
    SPECT.setBackgroundColor = function (hexColor) {
        //set top level app variable
        SPECT.backgroundColor = hexColor;
        //update renderer
        SPECT.renderer.setClearColor(SPECT.backgroundColor);
        //update internal variable
        SPECT.uiVariables.backgroundColor = SPECT.backgroundColor;
    };

    //Top level function to open a json file - As requested by Mostapha.  Essentially a wrapper for Spectacles.jsonLoader.loadSceneFromJson
    SPECT.loadNewModel = function (jsonData) {
        SPECT.jsonLoader.loadSceneFromJson(jsonData);
    };
    
    
    
    //RESIZE TIMELINE WITH WINDOW RESIZE
    document.onresize = function(){
        if(timeGUI != undefined){
            var w = $(window).innerWidth();
            if(customContainer.children.length !=0){
                timeGUI.width = w;
            }
        }
    };
    
    //Generate Slider for Timeline
    SPECT.generateTimeline = function(){
        if (SPECT.uiVariables.startDate != 'Start Date (yyyy-mm-dd)' && SPECT.uiVariables.endDate != 'End Date (yyyy-mm-dd)'){
            //console.log(timeGUI);
            if(timeGUI != undefined){
                timeGUI.destroy();
                if(customContainer.children.length != 0){
                customContainer.removeChild(timeGUI.domElement);
                }
            }
            var screenWide = $(window).innerWidth(); 
            //comment next three lines to revert to original
            timeGUI = new dat.GUI({autoPlace: false , resizable: true , width:screenWide});
            customContainer = document.getElementById('timeMove');
            customContainer.appendChild(timeGUI.domElement);
            var start = moment(SPECT.uiVariables.startDate);
            var end = moment(SPECT.uiVariables.endDate);
            var numDays = end.diff(start,"days");
            var itr = start.twix(end).iterate("days");
            var dayRange = [];
            while(itr.hasNext()){
                dayRange.push(itr.next().toDate());
            }
            
            var objs = SPECT.attributes.elementList;
            for(i=0;i<objs.length;i++){
                var obj = objs[i];
                var objData = obj.userData;
                var objStartDate = objData.START_DATE;
                //console.log(objDate);
                if (objStartDate != undefined){
                    //console.log(objDate);
                    var actualDate = moment(objStartDate);
                    
                    if(actualDate.isSameOrBefore(end)){
                        obj.visible = true;
                    }
                    else{
                        obj.visible = false;
                    }
                }
            }
            
            var activeMat = new THREE.MeshLambertMaterial({
                color: "rgb(0,255,255)",
                ambient: "rgb(0,255,255)",
                side: 2
            });
            
            //console.log(dayRange);
            SPECT.UIfolders.timeline.removeByProperty('TIMELINE');
            SPECT.UIfolders.timeline.removeByProperty('generateTimeline');
            //change next line to add to SPECT.UIfolders.timeline to go back to original
            timeGUI.add(SPECT.uiVariables,'TIMELINE',0,numDays).step(1).onChange(function(e){
                //console.log(dayRange[e]);
                var currentDate = dayRange[e];
                var dateString = currentDate.toISOString();
                var splitDate = dateString.split('T');
                $(".DateConsole").css('visibility', 'visible');
                $(".DateHeader").css('visibility', 'visible');
                updateDateCnsl(splitDate[0]);
                var currentMoment = moment(splitDate[0]);
                //console.log(currentDate);
                var objs = SPECT.attributes.elementList;
                for (i=0;i<objs.length;i++){
                    var obj = objs[i];
                    var objData = obj.userData;
                    var objStartDate = objData.START_DATE;
                    var objEndDate = objData.END_DATE;
                    var originalMat = SPECT.originalMaterials[i];
                    
                    if(objStartDate != undefined){
                        var actualDate = moment(objStartDate);
                        var finishDate = moment(objEndDate);
                        if(actualDate.isSameOrBefore(currentMoment)){
                            obj.visible = true;
                        }
                        else{
                            obj.visible = false;
                        }
                        if(actualDate.isSameOrBefore(currentMoment) && finishDate.isAfter(currentMoment)){
                            SPECT.attributes.paintElement(obj,activeMat);
                        }
                        else{
                            SPECT.attributes.paintElement(obj,originalMat);
                        }
                    }
                }
            });
            //comment next line out to go back to original
            timeGUI.add(SPECT.uiVariables, 'closeTimeline').name('[X] CLOSE');
            SPECT.UIfolders.timeline.add(SPECT.uiVariables,'generateTimeline');
        }
    }
    
    //Command for closing Timeline
    SPECT.closeTimeline = function(){
        timeGUI.destroy();
        console.log(timeGUI);
        customContainer.removeChild(timeGUI.domElement);
        SPECT.RESET();
        $(".DateConsole").css('visibility','hidden');
        $(".DateHeader").css('visibility','hidden');
    }
    
    //Rendered Display
    SPECT.Rendered = function(){
        $(".ColorConsole").css('visibility', 'hidden');
        $(".ColorHeader").css('visibility', 'hidden');
        var objs = SPECT.attributes.elementList;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var originalMat = SPECT.originalMaterials[i];
            SPECT.attributes.paintElement(obj,originalMat);
        }
    };
    
    //Generate unique colors for colorCoding taken from Al Dass Here: http://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript
    function rgbColors(t) {
        t = parseInt(t);
        if (t < 2)
        throw new Error("'t' must be greater than 1.");

        // distribute the colors evenly on
        // the hue range (the 'H' in HSV)
        var i = 360 / (t - 1);

        // hold the generated colors
        var r = [];
        var sv = 70;
        for (var x = 0; x < t; x++) {
        // alternate the s, v for more
        // contrast between the colors.
        sv = sv > 90 ? 70 : sv+10;
        r.push(hsvToRgb(i * x, sv, sv));
        }
        return r;
    };
    
    
    //Convert HSV color To RGB taken from Al Dass here: http://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript (ADDED BY DG)
    function hsvToRgb(h, s, v) {
        var r, g, b;
        var i;
        var f, p, q, t;

        // Make sure our arguments stay in-range
        h = Math.max(0, Math.min(360, h));
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));

        // We accept saturation and value arguments from 0 to 100 because that's
        // how Photoshop represents those values. Internally, however, the
        // saturation and value are calculated from a range of 0 to 1. We make
        // That conversion here.
        s /= 100;
        v /= 100;

        if (s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        h /= 60; // sector 0 to 5
        i = Math.floor(h);
        f = h - i; // factorial part of h
        p = v * (1 - s);
        q = v * (1 - s * f);
        t = v * (1 - s * (1 - f));

        switch (i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;

        case 1:
          r = q;
          g = v;
          b = p;
          break;

        case 2:
          r = p;
          g = v;
          b = t;
          break;

        case 3:
          r = p;
          g = q;
          b = v;
          break;

        case 4:
          r = t;
          g = p;
          b = v;
          break;

        default: // case 5:
          r = v;
          g = p;
          b = q;
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };
    
    
    //shuffle a list
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    //Color Code by attribute (ADDED BY DG) Not project specific
    SPECT.colorByAttribute = function(){
        var numColors = SPECT.attributeList.length;
        var colors = rgbColors(numColors);
        var colorList = shuffle(colors);
        //console.log(colorList);
//        console.log(colorList.length);
//        console.log(numColors);
        var objs = SPECT.attributes.elementList;
        var mainAttribute = SPECT.uiVariables.Attribute_To_Search_For;
        //console.log(mainAttribute);
        for (i=0;i<numColors;i++){
            var color = colorList[i];
            var colorString = "rgb("+color[0].toString()+","+color[1].toString()+","+color[2]+")";
            var material = new THREE.MeshBasicMaterial({
                color: colorString,
                side: 2
            });
            var checkAtt = SPECT.attributeList[i];
            //console.log(checkAtt);
            //console.log(colorString);
            for(j=0;j<objs.length;j++){
                var obj = objs[j];
                var objData = obj.userData;
                var objAtt = objData[mainAttribute];
                if(objAtt != null){
                    if(objAtt == checkAtt){
                        SPECT.attributes.paintElement(obj,material);
                        //console.log(objAtt);
                        //console.log(true);
                    }
                    else{
//                        console.log(objAtt);
//                        console.log(false);
                    }
                }
            }
        }
    };
    
    //Color Code By Panel Type (ADDED BY DG) Specific to Domino Project
    SPECT.colorCodeByType = function(){
        var panels = SPECT.attributes.elementList;
        for(i=0;i<panels.length;i++){
            var panel = panels[i];
            if (panel.userData.PANEL_FAMILY != null){
                var red = panel.userData.RED;
                var green = panel.userData.GREEN;
                var blue = panel.userData.BLUE;
                var stringColor = "rgb(" + red.toString()+","+green.toString()+","+blue.toString()+")";
                //var typeColor = new THREE.Color(red,green,blue);
                //var hexColor = rgbToHex(red,green,blue);
                var typeMaterial = new THREE.MeshBasicMaterial({
                    color: stringColor,
                    side: 2                
                });
                SPECT.attributes.paintElement(panel,typeMaterial);
            }
        }
        
    };
    
    //Color Code By Install Zone (ADDED BY DG) SPecific to Domino Project
    SPECT.colorCodeByZone = function(){
        var panels = SPECT.attributes.elementList;
        for (i=0;i<panels.length;i++){
            var panel = panels[i];
            if(panel.userData.PANEL_FAMILY != null){
                var zone = panel.userData.INSTALL_ZONE;
                if(zone === "A"){
                    var Acolor = new THREE.MeshBasicMaterial({
                        color:"rgb(0,255,255)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Acolor);
                }
                else if(zone === "B"){
                    var Bcolor = new THREE.MeshBasicMaterial({
                        color:"rgb(0,0,255)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Bcolor);
                }
                else if(zone === "C"){
                    var Ccolor = new THREE.MeshBasicMaterial({
                        color: "rgb(255,0,255)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Ccolor);
                }
                else if (zone === "D"){
                    var Dcolor = new THREE.MeshBasicMaterial({
                        color: "rgb(255,0,0)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Dcolor);
                }
                else if(zone === "E"){
                    var Ecolor = new THREE.MeshBasicMaterial({
                        color: "rgb(255,255,0)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Ecolor);
                }
                else if(zone === "F"){
                    var Fcolor = new THREE.MeshBasicMaterial({
                        color: "rgb(0,255,0)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Fcolor);
                }
                else if(zone === "SCAFFOLD"){
                    var Scolor = new THREE.MeshBasicMaterial({
                        color: "rgb(255,160,0)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,Scolor);
                }
                else if(zone === "EAST"){
                    var EASTcolor = new THREE.MeshBasicMaterial({
                        color: "rgb(230,230,230)",
                        side: 2
                    });
                    SPECT.attributes.paintElement(panel,EASTcolor);
                }
            }
        }
    };
    
    //SEARCH MODEL FOR PANELS ID AND HIDE OTHERS (ADDED BY DG)
    SPECT.SEARCH = function () {
        var searchAtt = SPECT.uiVariables.Attribute_To_Search_For;
        //var stringAtt = searchAtt.toString();
        //console.log(searchAtt);
        var checkAtt = SPECT.uiVariables.Available_Attributes;
        //console.log(checkAtt);
        var objs = SPECT.attributes.elementList;
        for (i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            //console.log(objData);
            //console.log(objData.hasOwnProperty(searchAtt));
            //console.log(panel.hasOwnProperty(stringAtt));
            var objAtt = objData[searchAtt];
            //console.log(objAtt);
            if (objData.hasOwnProperty(searchAtt)){
                if (objAtt !== checkAtt){
//                       var whiteOut = new THREE.MeshBasicMaterial({
//                       color: "rgb(250,250,250)",
//                       side: 2
//                        });
//                        SPECT.attributes.paintElement(panel,whiteOut);
                    obj.visible = false;
                }
                else{
                    SPECT.counter += 1;
                }
                updateCnsl();
            }
        }     
    };
    
    //SEARCH USING FILTERS (ADDED BY DG)
    SPECT.filteredSearch = function(){
        SPECT.Rendered();
        SPECT.dataElements = [];
        var filterCheck;
        var filterValCheck;
        //material for non relevant elements
        var hideMat = new THREE.MeshBasicMaterial({
            color: "rgb(125,125,125)",
            transparent: true,
            side:2,
            opacity: .5,
        })
        
        if(SPECT.uiVariables.Scopes === 'All'){
            //console.log(SPECT.filters);
            var newFilters = [];
            var newFilterVals = [];
            for(i=1;i<SPECT.filters.length;i++){
                newFilters.push(SPECT.filters[i]);
            }
            for(i=1;i<SPECT.filterVals.length;i++){
                newFilterVals.push(SPECT.filterVals[i]);
            }
            filterCheck = newFilters;
            filterValCheck = newFilterVals;
            //console.log(newFilters);
            //console.log(newFilterVals);
        }
        else{
            filterCheck = SPECT.filters;
            filterValCheck = SPECT.filterVals;
        }
        //Account for doubling up on parameters
        var filterSet = Array.from(new Set(filterCheck));
        //console.log(filterSet);
        var filterLists = [];
        for(i=0;i<filterSet.length;i++){
            var valList = [];
            valList.push(filterSet[i]);
            for(j=0;j<filterCheck.length;j++){
                if(filterCheck[j] === filterSet[i]){
                    valList.push(filterValCheck[j]);
                }
            }
            //console.log(valList);
            filterLists.push(valList);
        }
        
        var objs = SPECT.attributes.elementList;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var testList = [];
            for (j=0;j<filterLists.length;j++){
                var checkList = [];
                for(k=1;k<filterLists[j].length;k++){
                    var searchAtt = filterLists[j][0];
                    var checkAtt = filterLists[j][k];
                    var objAtt = objData[searchAtt];
                    if(objAtt !== undefined){
                        if(objAtt === checkAtt){
                            checkList.push(true);
                        }
                        else{
                            checkList.push(false);
                        }
                    }
                    else{
                        checkList.push(false);
                    }
                }
                if(checkList.indexOf(true) !== -1){
                    testList.push(true);
                }
                else{
                    testList.push(false);
                }
            }
            if(testList.indexOf(false) !== -1){
                //Attempting to make non selected elements change material
                SPECT.attributes.paintElement(obj,hideMat);
                //obj.visible = false;
            }
            else{
                SPECT.counter += 1;
                updateCnsl();
                SPECT.dataElements.push(obj);
            }
            //console.log(SPECT.guiList[1].Available_Attributes);
            if(SPECT.uiVariables.Scopes !== 'All'){
                var layer = objData.layer;
                var checkLayer = SPECT.filterVals[0];
                //console.log(checkLayer);
                if(layer !== checkLayer){
                    //obj.visible = true;
                }
            }
        }
    };
            
 
    
    //RESET MODEL TO RENDERED MODE SHOWING ALL PANELS (ADDED BY DG)
    SPECT.RESET = function (){
        //SPECT.uiVariables.Attribute_To_Search_For = 'a';
        SPECT.counter = 0;
        updateCnsl();
        $(".CounterConsole").css('visibility','hidden');
        $(".ConsoleHeader").css('visibility', 'hidden');
        $(".ColorConsole").css('visibility', 'hidden');
        $(".ColorHeader").css('visibility', 'hidden');
        SPECT.uiVariables.Available_Attributes = 'b';
        var panels = SPECT.attributes.elementList;
        var layerL = SPECT.layerStorage;
        //console.log(layerL);
        //check to see what layers are on
        for (i=0;i<layerL.length;i++){
            var lay = layerL[i];
            if (lay[Object.keys(lay)[0]] === true){
                for (j=0;j<panels.length;j++){
                    var panel = panels[j];
                    //console.log(panel.userData.layer);
                    if (panel.userData.layer === Object.keys(lay)[0] && panel.visible === false){
                        panel.visible = true;
                    }
                }
            }
        }
        SPECT.Rendered();
    };
    
    function updateCnsl() {
        var cnsl = document.getElementById('ccnsl').innerHTML = SPECT.counter.toString();
    }
    
    function updateColorCnsl(){
        var colorCnsl = document.getElementById('colCnsl').innerHTML = SPECT.attributeList.length.toString();
    }
    
    function updateDateCnsl(date){
        var dateCnsl = document.getElementById('dateCnsl').innerHTML = date.toString();
    }

    
    //DOWNLOAD DATA AS CSV FILE FOR EXCEL (ADDED BY DG)
    SPECT.downloadExcel = function(l){
        var dataElements;
        if(l.length === 0){
            dataElements = SPECT.attributes.elementList; 
        }
        else{
           dataElements = l; 
        }
        
        var dataList = [];
        var tempList = [];
        //add first row of value names
        for(i=0;i<SPECT.attributeSet.length;i++){
            tempList.push(SPECT.attributeSet[i]);
        }
        dataList.push(tempList);
        //console.log(dataList);
        //Add all attributes to file
        var objs = dataElements;
        //var objs = SPECT.attributes.elementList;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var objKeys = Object.keys(objData);
            var valList = [];
            for(j=0;j<SPECT.attributeSet.length;j++){
                var att = SPECT.attributeSet[j];
                //console.log(att);
                var attribute = objData[SPECT.attributeSet[j]];
                if (attribute == undefined){
                    valList.push('N/A');
                }
                else{
                    valList.push(attribute);
                }
            }
            dataList.push(valList);
        }
        var csvRows = [];
        for(i=0;i<dataList.length;i++){
            csvRows.push(dataList[i].join(','));
        }
        //console.log(csvRows);
        var csvString = csvRows.join("%0A");
        //console.log(csvString);
        
        var a = document.createElement('a');
        a.href = 'data:attachment/csv,' + csvString;
        a.target = '_blank';
        a.download = 'myFile.csv';
        
        document.body.appendChild(a);
        a.click();
        
    };

 //function to create interface for available attributes in model and searching by them (ADDED BY DG)
    SPECT.CreateAttributeList = function(){
        var objects = SPECT.attributes.elementList;
        //console.log(objects);
        var attributeList = [];
        for (i=0;i<objects.length;i++){
            var obj = objects[i];
            attL = obj.userData;
            //console.log(attL);
            //console.log(Object.keys(attL).length);
            //console.log(Object.keys(attL)[1]);
            for(j=0;j<Object.keys(attL).length;j++){
                //console.log(attL[j]);
                //if (Object.keys(attL)[j] != 'layer'){
                    attributeList.push(Object.keys(attL)[j]);
                //}
            }
        }
        var attributeSet = Array.from(new Set(attributeList));
        console.log(attributeSet);
        //attributeSet.shift();
        SPECT.attributeSet = attributeSet;
        //console.log(SPECT.attributeSet);
        //console.log(attributeSet);
        //attributeSet.sort();
        //console.log(attributeSet);
        SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables,'Attribute_To_Search_For',attributeSet).name('Color Code By:').onFinishChange(function (e) {
//            var functionList = SPECT.UIfolders.Search_Model.__controllers;
//            if (functionList.length !== 4){
//                SPECT.UIfolders.Search_Model.removeByProperty('colorByAttribute');
//            }
            SPECT.UIfolders.Color_Coding.removeByProperty('colorByAttribute');
            SPECT.UIfolders.Color_Coding.add(SPECT.uiVariables,'colorByAttribute').name('Color Code Model').onFinishChange(function(e){
                updateColorCnsl();
                $(".ColorConsole").css('visibility','visible');
                $(".ColorHeader").css('visibility','visible');
            });
                var attributeIndex;
                //determing the index of the attribute that we are searching for
                for (i=0;i<attributeSet.length;i++){
                    if(e === attributeSet[i]){
                        attributeIndex = i;
                    }       
                }
                //console.log(attributeIndex);
                var objs = SPECT.attributes.elementList;
                var testList = [];
                //get all unique attribute values for chosen search attribute
                for(i=0;i<objs.length;i++){
                    var obj = objs[i];
                    var objData = obj.userData;
                    //console.log(objData[e]);
                    //var listAtt = objData[Object.keys(objData)[attributeIndex]];
                    var listAtt = objData[e];
                    if (listAtt != undefined){
                        testList.push(listAtt);
                    }
                    

                    //console.log(checkAtt); 
                }
                var attSet = Array.from(new Set(testList));
                //console.log(attSet);
                //console.log(attSet);
                SPECT.UIfolders.Search_Model.removeByProperty('Available_Attributes');
                attSet.sort();
                SPECT.attributeList = attSet;
            }); 
        
        //console.log(SPECT.searchAtt);
    };
    
    //CREATE LIST OF PROJECT SCOPES defined by layers (ADDED BY DG)
    SPECT.CreateScopeList = function(){
        var objs = SPECT.attributes.elementList;
        var scopeList = [];
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var scope = objData.layer;
            scopeList.push(scope);
        }
        var scopeSet = Array.from(new Set(scopeList));
        scopeSet.unshift('All');
        SPECT.UIfolders.Search_Model.add(SPECT.uiVariables, 'Scopes', scopeSet).name('Scope').onChange(function(e){
            SPECT.filterVals[0] = e;
        });
        SPECT.filters[0] = 'layer';
    };
    //Function for adding attributes to filter GUIs Pretty much the same function as SPECT.CreateAttributeList but tweaked for filter GUIs (ADDED BY DG)
    SPECT.CreateFilterList = function(v){
            var objects = SPECT.attributes.elementList;
            var attributeList = [];
            for (i=0;i<objects.length;i++){
                var obj = objects[i];
                attL = obj.userData;
                //console.log(attL);
                //console.log(Object.keys(attL).length);
                //console.log(Object.keys(attL)[1]);
                for(j=0;j<Object.keys(attL).length;j++){
                    //console.log(attL[j]);
                    //if (Object.keys(attL)[j] != 'layer'){
                        attributeList.push(Object.keys(attL)[j]);
                    //}
                }
            }
            var attributeSet = Array.from(new Set(attributeList));
            //attributeSet.shift();
            //SPECT.attributeSet = attributeSet;
            //console.log(SPECT.attributeSet);
            //console.log(attributeSet);
            //attributeSet.sort();
            //console.log(attributeSet);
            SPECT.uiVariables.Attribute_To_Search_For = 'a';
            SPECT.guiList[v].add(SPECT.uiVariables,'Attribute_To_Search_For',attributeSet).name('Filter').onFinishChange(function (e) {
                    SPECT.filters[v] = e;
                    //console.log(e);
                    var attributeIndex;
                    //determing the index of the attribute that we are searching for
                    for (i=0;i<attributeSet.length;i++){
                        if(e === attributeSet[i]){
                            attributeIndex = i;
                        }       
                    }
                    var objs = SPECT.attributes.elementList;
                    var testList = [];
                    //get all unique attribute values for chosen search attribute
                    for(i=0;i<objs.length;i++){
                        var obj = objs[i];
                        var objData = obj.userData;
                        //var listAtt = objData[Object.keys(objData)[attributeIndex]];
                        var listAtt = objData[e];
                        if (listAtt != null){
                            testList.push(listAtt);
                        }


                        //console.log(checkAtt); 
                    }
                    var attSet = Array.from(new Set(testList));
                    SPECT.guiList[v].removeByProperty('Available_Attributes');
                    attSet.sort();
                    SPECT.guiList[v].add(SPECT.uiVariables,'Available_Attributes',attSet).onChange(function(e){
                        $(".CounterConsole").css('visibility','visible');
                        $(".ConsoleHeader").css('visibility', 'visible');
                        SPECT.filterVals[v] = e;
                        var panels = SPECT.attributes.elementList;
                        var layerL = SPECT.layerStorage;
                        //check to see what layers are on
                        for (i=0;i<layerL.length;i++){
                            var lay = layerL[i];
                            if (lay[Object.keys(lay)[0]] === true){
                                for (j=0;j<panels.length;j++){
                                    var panel = panels[j];
                                    //console.log(panel.userData.layer);
                                    if (panel.userData.layer === Object.keys(lay)[0] && panel.visible === false){
                                        panel.visible = true;
                                    }
                                }
                            }
                        }
                        SPECT.counter = 0;
                        SPECT.filteredSearch();
                    });

                    //console.log(attSet);
                    //console.log(SPECT.searchAtt);
                }); 
        //}
        
        //console.log(SPECT.searchAtt);
    };




    //*********************
    //*********************
    //*** Lighting

    //ambient light for the scene
    SPECT.lightingRig.ambientLight = {};

    //a spotlight representing the sun
    SPECT.lightingRig.sunLight = {};

    //an array of point lights to provide even coverage of the scene
    SPECT.lightingRig.pointLights = [];


    //function that creates lights in the scene
    SPECT.lightingRig.createLights = function () {

        // create ambient light
        SPECT.lightingRig.ambientLight = new THREE.AmbientLight(0x808080);
        SPECT.scene.add(SPECT.lightingRig.ambientLight);


        //using the bounding sphere calculated above, get a numeric value to position the lights away from the center
        var offset = SPECT.boundingSphere.radius * 2;
        var offset2 = SPECT.boundingSphere.radius * 5;

        //get the center of the bounding sphere.  we'll use this to center the rig
        var center = SPECT.boundingSphere.center;


        //create a series of pointlights

//        //directly above
//        var pointA = new THREE.PointLight(0x666666, 1, 0);
//        pointA.position.set(center.x, center.y + offset, center.z);
//        pointA.castShadow = false;
//        SPECT.scene.add(pointA);
//        SPECT.lightingRig.pointLights.push(pointA);
//
//        //directly below
//        var pointB = new THREE.PointLight(0x666666, 0.66, 0);
//        pointB.position.set(center.x, center.y - offset, center.z);
//        pointB.castShadow = false;
//        SPECT.scene.add(pointB);
//        SPECT.lightingRig.pointLights.push(pointB);
//
//
//        //4 from the cardinal directions, at roughly 45deg
//        var pointC = new THREE.PointLight(0x666666, 0.33, 0);
//        pointC.position.set(center.x + offset, center.y, center.z);
//        pointC.castShadow = false;
//        SPECT.scene.add(pointC);
//        SPECT.lightingRig.pointLights.push(pointC);
//
//        var pointD = new THREE.PointLight(0x666666, 0.33, 0);
//        pointD.position.set(center.x, center.y, center.z + offset);
//        pointD.castShadow = false;
//        SPECT.scene.add(pointD);
//        SPECT.lightingRig.pointLights.push(pointD);
//
//        var pointE = new THREE.PointLight(0x666666, 0.33, 0);
//        pointE.position.set(center.x - offset, center.y, center.z);
//        pointE.castShadow = false;
//        SPECT.scene.add(pointE);
//        SPECT.lightingRig.pointLights.push(pointE);
//
//        //var pointF = new THREE.PointLight(0x666666, 0.33, 0);
//        pointF.position.set(center.x, center.y, center.z - offset);
//        pointF.castShadow = false;
//        SPECT.scene.add(pointF);
//        SPECT.lightingRig.pointLights.push(pointF);



        //directional light - the sun
//        var light = new THREE.DirectionalLight(0xffffff, .8);
//        light.position.set(center.x - 40, center.y +20, center.z - 100);
//        light.target.position.set(center.x, center.y , center.z);
//        light.castShadow = true;
//        light.shadowCameraNear = 1;
//        light.shadowCameraFar = 100;
//        light.shadowCameraTop = 50;
//        light.shadowCameraRight = 50;
//        light.shadowCameraBottom = -50;
//        light.shadowCameraLeft = -50;
//        light.distance = 0;
//        light.intensity = 0;
//        light.shadowBias = 0.001;
//        light.shadowMapHeight = SPECT.viewerDiv.innerHeight();
//        light.shadowMapWidth = SPECT.viewerDiv.innerWidth();
//        light.shadowDarkness = 0.75;
//        light.shadowCameraVisible = true;
     
        //hemilight 
        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
        hemiLight.color.setHSL( 225, 231, 242);
        hemiLight.groundColor.setHSL( 0, 0, 0 );
        hemiLight.position.set( 0, 500, 0 );
        SPECT.lightingRig.sunLight = hemiLight;
        SPECT.scene.add( hemiLight );

        
        //add the light to our scene and to our app object
//        SPECT.lightingRig.sunLight = light;
//        SPECT.scene.add(light);

        
    };

    //function to update lights in the scene.
    //should be called when new geometry is added to a running scene (.obj for instance)
    SPECT.lightingRig.updateLights = function () {

        //remove lights from scene
        SPECT.scene.remove(this.ambientLight);
        SPECT.scene.remove(this.sunLight);
        for(var i=0; i<this.pointLights.length; i++){
            SPECT.scene.remove(this.pointLights[i]);
        }

        //call purge and create
        this.purge();
        this.createLights();

        //call update materials - this counts as a deep update for sure!
        this.updateSceneMaterials();
    };

    //function that adjusts the point lights' color
    //this is a handler for a UI variable
    SPECT.lightingRig.setPointLightsColor = function (col) {

        for (var i in SPECT.lightingRig.pointLights) {

            SPECT.lightingRig.pointLights[i].color = new THREE.Color(col);
        }
    };

    //function that adjusts the ambient light color
    //another handler for a UI element
    SPECT.lightingRig.setAmbientLightColor = function (col) {
        //console.log(col);

        //remove the old ambient light
        SPECT.scene.remove(SPECT.lightingRig.ambientLight);

        //replace the ambient light with a new one, and add it to the scene
        SPECT.lightingRig.ambientLight = new THREE.AmbientLight(new THREE.Color(col));
        SPECT.scene.add(SPECT.lightingRig.ambientLight);


    };

    //function that sets the position of the directional light (the sun)
    SPECT.lightingRig.setSunPosition = function (az, alt) {

    };

    //function to turn the sun on and off
    SPECT.lightingRig.shadowsOnOff = function (shad) {
        if (shad) {
            SPECT.lightingRig.sunLight.castShadow = true;
            SPECT.lightingRig.sunLight.intensity = 1;
            SPECT.lightingRig.updateSceneMaterials();
        }
        else {
            SPECT.lightingRig.sunLight.castShadow = false;
            SPECT.lightingRig.sunLight.intensity = 0;
            SPECT.lightingRig.updateSceneMaterials();
        }
    };
    


    //function that sets the fog amount in the scene
    //doesn't seem like this should live in the lighting rig ... if we get more scene variables we may need a sceneFunctions
    //object or something.
    SPECT.lightingRig.setFog = function (n) {

        //if false, set fog to null and return
        if (!n) {
            SPECT.scene.fog = null;
        }

            //if true, set up some fog in the scene using the backgound color and the bounding sphere's radius
        else {
            SPECT.scene.fog = new THREE.FogExp2(new THREE.Color(SPECT.uiVariables.backgroundColor), 0.00025);
        }

    };

    //function to traverse materials in the scene when deep updates are needed - fog on off/ shadows on / off, etc
    SPECT.lightingRig.updateSceneMaterials = function () {
        SPECT.scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.needsUpdate = true;
            }
            else if (child.type === 'Object3D') {
                try {
                    for (var i = 0; i < child.children.length; i++) {
                        for (var j = 0; j < child.children[i].children.length; j++) {
                            child.children[i].children[j].material.needsUpdate = true;
                        }
                    }
                } catch (e) { }
            }
        });
    };

    //function to purge lighting variables.  called when we load a new scene
    SPECT.lightingRig.purge = function () {
        this.ambientLight = {};
        this.sunLight = {};
        this.pointLights = [];
    };
    






    //*********************
    //*********************
    //*** User Interface.

    //dat.gui Constructor object
    // an instance of this is class created to store UI variables and functions
    SPECT.UiConstructor = function () {

        //OPEN FILE
        this.openLocalFile = function () {

            //If an object is selected, this will make sure to hide the attributes. 
            SPECT.attributes.attributeListDiv.hide("slow");

            //this should show a form that lets a user open a file
            $("#OpenLocalFile").css("visibility", "visible");
            $(".Spectacles_blackout").show();


            $(document).keyup(function (e) {
                //if the escape key  is pressed
                if (e.keyCode == 27) {
                    $("#OpenLocalFile").css("visibility", "hidden");
                    $(".Spectacles_blackout").hide();
                }
            });

        };
        
//        //PIVOT UI CONTROLS
//        //PIVOT zoom extents
//        var PIVOTzoomExtents =
//            document.getElementById('PIVOTzoomExtents').onclick = function () {
//            SPECT.zoomExtents();
//        };
        

     
                
        //SCENE VARIABLES

        //background color
        this.backgroundColor = SPECT.backgroundColor;

        //ambient light color
        this.ambientLightColor = '#9ba6aa';

        //fog
        this.fog = true;

        this.view = "v";
        
        //test for dropdown
        this.IDList = 't';
        
        //testing dropdown for test folder
        this.test_List = 'n';
        
        //number of search criteria
        //this.Number_Of_Criteria = 2;
        
        //attribute dropdown
        this.Available_Attributes = 'b';
        
        this.Scopes = 's';
        
        //what attribute to search for
        this.Attribute_To_Search_For = 'a';

        this.layers = "layers";

        //VIEW AND SELECTION VARIABLES

        //zoom extents
        this.zoomExtents = function () {
            SPECT.zoomExtents();
        };

        //zoom selected
        this.zoomSelected = function () {
            SPECT.zoomSelected();
        };
        
    
        //Rendered Mode
        this.Rendered = function(){
            SPECT.Rendered();
        };
        
//        this.Textured = function(){
//            SPECT.Textured();
//        };
        
        //start date
        this.startDate = 'Start Date (yyyy-mm-dd)';
        
        //end date 
        this.endDate = 'End Date (yyyy-mm-dd)';
        
        this.TIMELINE = 0.0;
        
        this.closeTimeline = function(){
            SPECT.closeTimeline();
        }
        
        this.generateTimeline = function(){
            SPECT.generateTimeline();
        }
        
        //orcodebor Code By Type
        this.colorCodeByType = function(){
            SPECT.colorCodeByType();
        };
        
        //Color Code By Install Zone
        this.colorCodeByZone = function(){
            SPECT.colorCodeByZone();
        };
        
        //Color Code based on selected attribute
        this.colorByAttribute = function(){
            SPECT.colorByAttribute();
        }
        
        //Search Model by One Attribute
        this.SEARCH = function (){
            SPECT.SEARCH();
        };
        
        //Search model by multiple attributes
        this.filteredSearch = function (){
            SPECT.filteredSearch();
        };
        
        //RESET MODEL VISIBILITY
        this.RESET = function (){
            SPECT.RESET();
        };
        
        //filterUI
        this.filterUI = function (){
            SPECT.filterUI();
        };
        
        this.closeFilter = function(){
            SPECT.closeFilter();
        };
        
        this.downloadComplete = function(){
            SPECT.downloadExcel(SPECT.attributes.elementList);
        };
        
        this.downloadFiltered = function(){
            SPECT.downloadExcel(SPECT.dataElements);
        }

        //this.filterObj = new FilterObj();
        
        //selected object color
        this.selectedObjectColor = "#FFFF00";

        //show stats?
        this.showStats = false;


        //LIGHTING VARIABLES

        //point lights color
        this.pointLightsColor = '#ffffff';

        //sun light on / off
        this.shadows = false;

        //sun azimuth and altitude
        this.solarAzimuth = 160;
        this.solarAltitude = 45;

    };

    //an object to store the live application variables and functions controlled by the UI
    //this is instantiated in the APP_INIT document.ready function
    SPECT.uiVariables = {};

    //this is the actual dat.gui object.  We'll add folders and UI objects in the APP_INIT document.ready function
    SPECT.datGui = {};
    //FILTER.datGui = {};

    //an object to hold all of our GUI folders, which will be keyed by name.  We need these from other places in the app
    //now that we are dynamically adding and subtracting UI elements.
    SPECT.UIfolders = {};




    //*********************
    //*********************
    //*** Element Selection and attribute (user data) display.

    //attributes object.  Contains logic for element selection and attribute list population
    SPECT.attributes = {};

    //top level property to track whether or not element attributes have been enabled
    SPECT.attributesEnabled = false;

    //element list.  This gets populated after a json file is loaded, and is used to check for intersections
    SPECT.attributes.elementList = [];

    //attributes list div - the div that we populate with attributes when an item is selected
    SPECT.attributes.attributeListDiv = {};

    //initialize attribtes function.  Call this once when initializing Spectacles to set up all of the
    //event handlers and application logic.
    SPECT.attributes.init = function () {

        //attribute properties used throughout attribute / selection code

        //set the state of this guy to true
        SPECT.attributesEnabled = true;

        //the three projector object used for turning a mouse click into a selection
        SPECT.attributes.projector = new THREE.Projector();
        //send to global variable for pivot
        PROJECTOR = SPECT.attributes.projector;

        //a material used to represent a clicked object
        SPECT.attributes.clickedMaterial = new THREE.MeshLambertMaterial({
            color: "rgb(255,255,0)",
            ambient: "rgb(255,255,0)",
            side: 2
        });

        //an object used to store the state of a selected element.
        SPECT.attributes.previousClickedElement = new SPECT.attributes.SelectedElement();

//        //Append a div to the parent for us to populate with attributes.  handle any jquery.ui initialization here too
//        //SPECT.viewerDiv.append("<div class='Spectacles_attributeList'></div>");
//        SPECT.viewerDiv.append("<div class='.panel panel-default col-sm-3'></div>");
        //function to position and size the blackout div
//        var setAttributeList = function () {
//            //set the position of the UI relative to the viewer div
//            //var targetDiv = $('.Spectacles_attributeList');
//            var targetDiv = $('.Spectacles_attributeList');
//            
//            //get upper left coordinates of the viewer div - we'll use these for positioning
//            var win = $(window);
//            var x = SPECT.viewerDiv.offset().left - win.scrollLeft();
//            var y = SPECT.viewerDiv.offset().top - win.scrollTop();
//
//            //set the position and size
//            targetDiv.css('left', x.toString() + "px");
//            targetDiv.css('top', y.toString() + "px");
//        };
        //call this the first time through
//        setAttributeList();

        //respond to resize of Parent div
//        SPECT.viewerDiv.resize(function () {
//            setAttributeList();
//        });

//        //set our local variable to the div we just created
//        SPECT.attributes.attributeListDiv = $('.Spectacles_attributeList');
//        //make the attributes div draggable and resizeable
//        SPECT.attributes.attributeListDiv.draggable({ containment: "parent" });

        //set up mouse event
        SPECT.viewerDiv.click(SPECT.attributes.onMouseClick);
    };

    //Constructor that creates an object to represent a selected element.
    //Used to store state of a previously selected element
    SPECT.attributes.SelectedElement = function () {
        this.materials = [];    //array of materials.  Holds one mat for each Mesh that the selected object contains
        this.id = -1;           //the ID of the element.  We use this to test whether something was already selected on a click
        this.object = {};       //the actual object that was selected.  This has been painted with our 'selected' material
        //and needs to be painted back with the materials in the materials array
    };

    //Mouse Click event handler for selection.  When a user clicks on the viewer, this gets called
    SPECT.attributes.onMouseClick = function (event) {

        //prevent the default event from triggering ... BH question - what is that event?  Test me.
        event.preventDefault();

        //call our checkIfSelected function
        SPECT.attributes.checkIfSelected(event);
    };

    //Function that checks whether the click should select an element, de-select an element, or do nothing.
    //This is called on a mouse click from the handler function directly above
    SPECT.attributes.checkIfSelected = function (event) {
        var clicky;
        //get the canvas where three.js is running - it will be one of the children of our parent div
        var children = SPECT.viewerDiv.children();
        var canvas = {};
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName === "CANVAS") {
                //once we've found the element, wrap it in a jQuery object so we can call .position() and such.
                canvas = jQuery(children[i]);
                break;
            }
        }

        //get X and Y offset values for our div.  We do this every time in case the viewer is moving around
        var win = $(window);
        var offsetX = canvas.offset().left - win.scrollLeft();
        var offsetY = canvas.offset().top - win.scrollTop();


        //get a vector representing the mouse position in 3D
        //NEW - from here: https://stackoverflow.com/questions/11036106/three-js-projector-and-ray-objects/23492823#23492823
        var mouse3D = new THREE.Vector3(((event.clientX - offsetX) / canvas.width()) * 2 - 1, -((event.clientY - offsetY) / canvas.height()) * 2 + 1, 0.5);    //OFFSET THE MOUSE CURSOR BY -7PX!!!!
        mouse3D.unproject(SPECT.camera);
        mouse3D.sub(SPECT.camera.position);
        mouse3D.normalize();

        //Get a list of objects that intersect with the selection vector.  We'll take the first one (the closest)
        //the Spectacles element list is populated in the Spectacles.jsonLoader.processSceneGeometry function
        //which is called every time a scene is loaded
        var raycaster = new THREE.Raycaster(SPECT.camera.position, mouse3D);
        var intersects = raycaster.intersectObjects(SPECT.attributes.elementList);

        //are there any intersections?
        if (intersects.length > 0) {

            //get the closest intesected object
            var myIntersect;
            var i = 0;

            while (i < intersects.length) {
                myIntersect = intersects[i].object;
                i++;
                //get the first object that is visible
                if (myIntersect.visible == true) break;
            }

            // was this element hidden by clicking on its layer checkbox?
            if (myIntersect.visible == true) {
                //was this element already selected?  if so, do nothing.
                if (myIntersect.id === SPECT.attributes.previousClickedElement.id) return;

                //was another element already selected?
                if (SPECT.attributes.previousClickedElement.id !== -1) {
                    //restore previously selected object's state
                    SPECT.attributes.restorePreviouslySelectedObject();
                }


                //var to track whether the intersect is an object3d or a mesh
                var isObject3D = false;

                //did we intersect a mesh that belongs to an Object3D or a Geometry?  The former comes from Revit, the latter from GH
                if (myIntersect.parent.type === "Object3D") {
                    isObject3D = true;
                }


                //store the selected object
                SPECT.attributes.storeSelectedObject(myIntersect, isObject3D);

                //paint the selected object[s] with the application's 'selected' material
                if (isObject3D) {
                    //loop over the children and paint each one
                    for (var i = 0; i < myIntersect.parent.children.length; i++) {
                        SPECT.attributes.paintElement(myIntersect.parent.children[i], SPECT.attributes.clickedMaterial);
                    }
                }

                else {
                    //paint the mesh with the clicked material
                    SPECT.attributes.paintElement(myIntersect, SPECT.attributes.clickedMaterial);
                }


                //populate the attribute list with the object's user data
                if (isObject3D) {
                    SPECT.attributes.populateAttributeList(myIntersect.parent.userData);
                }
                else {
                    SPECT.attributes.populateAttributeList(myIntersect.userData);
                }
            }

            else {
                //if an item was already selected
                if (SPECT.attributes.previousClickedElement.id !== -1) {
                    //restore the previously selected object
                    SPECT.attributes.restorePreviouslySelectedObject();

                    //hide the attributes
                    SPECT.attributes.attributeListDiv.hide("slow");
                }
            }
            clicky = myIntersect;
        }

            //no selection.  Repaint previously selected item if required
        else {

            //if an item was already selected
            if (SPECT.attributes.previousClickedElement.id !== -1) {
                //restore the previously selected object
                SPECT.attributes.restorePreviouslySelectedObject();
                clicky = undefined;
                //console.log(CLICKEDELEMENT);

                //hide the attributes
                //SPECT.attributes.attributeListDiv.hide("slow");
            }
        }
        CLICKEDELEMENT = clicky;
    };

    //Function to restore the state of a previously selected object.
    SPECT.attributes.restorePreviouslySelectedObject = function () {

        //if nothing was selected, return
        if (SPECT.attributes.previousClickedElement.id === -1) return;

        //apply the stored materials to the meshes in the object.

        //are we working with an object3d?  if so we need to reset all of the children materials
        if (SPECT.attributes.previousClickedElement.object.type === "Object3D") {

            //loop over the children and repaint each one
            for (var i = 0; i < SPECT.attributes.previousClickedElement.materials.length; i++) {
                SPECT.attributes.paintElement(
                    SPECT.attributes.previousClickedElement.object.children[i],
                    SPECT.attributes.previousClickedElement.materials[i]
                );
            }


        }
        else { // we have a mesh

            //paint the mesh with it's original material
            SPECT.attributes.paintElement(
                SPECT.attributes.previousClickedElement.object,
                SPECT.attributes.previousClickedElement.materials[0]
            );
        }


        //set id to -1 and clear the other vars so they can be populated during hte next selection
        SPECT.attributes.previousClickedElement.id = -1;
        SPECT.attributes.previousClickedElement.materials = [];
        SPECT.attributes.previousClickedElement.object = {};

    };

    //Function to store a selected object in our attributes.PreviouslySelectedObject property.  Essentially a property setter
    //selected arg is the selected object
    //isObject3D arg is a bool describing whether  the selected object is of typeObject3D.  If so, we need to store it's children
    SPECT.attributes.storeSelectedObject = function (selected, isObject3D) {

        if (isObject3D) {
            //store the ID of the parent object.
            SPECT.attributes.previousClickedElement.id = selected.parent.id;

            //store the material of each child
            for (var i = 0; i < selected.parent.children.length; i++) {
                SPECT.attributes.previousClickedElement.materials.push(selected.parent.children[i].material);
            }

            //store the entire parent object
            SPECT.attributes.previousClickedElement.object = selected.parent;
        }
        else {
            //store the ID of the parent object.
            SPECT.attributes.previousClickedElement.id = selected.id;

            //store the material of the selection
            SPECT.attributes.previousClickedElement.materials.push(selected.material);

            //store the entire object
            SPECT.attributes.previousClickedElement.object = selected;
        }

    };

    //function to paint an element with a material.  Called when an element is selected or de-selected
    SPECT.attributes.paintElement = function (elementToPaint, material) {

        elementToPaint.material = material;

    };

    //function to populate the attribute list ( the user-facing html element ) with the selected element's attributes
    SPECT.attributes.populateAttributeList = function (jsonData) {

//        //empty the contents of the html element
//        SPECT.attributes.attributeListDiv.empty();
//
//        //create a header
//        SPECT.attributes.attributeListDiv.append('<div class="Spectacles_attributeListHeader">Element Attributes</div>');
//
//        //add an empty item for some breathing room
//        SPECT.attributes.attributeListDiv.append('<div class="item">-------</div>');

        //loop through json object attributes and create a new line for each property
//        var rowCounter = 1;
//        var longestString = 0;
//        for (var key in jsonData) {
//            if (jsonData.hasOwnProperty(key)) {
//
//                //add the key value pair
//                if (jsonData[key].substr(0, 4) !== 'http') {
//                    SPECT.attributes.attributeListDiv.append('<div class="item">' + key + "  :  " + jsonData[key] + '</div>');
//                } else {
//                    var link = '<a href=' + jsonData[key] + ' target=_blank>' + jsonData[key] + '</a>';
//                    SPECT.attributes.attributeListDiv.append('<div class="item">' + key + "  :  " + link + '</div>');
//                }
//
//                //compute the length of the key value pair
//                var len = (key + "  :  " + jsonData[key]).length;
//                if (len > longestString) longestString = len;
//            }
//
//            //increment the counter
//            rowCounter++;
//        }
        //add data to global variable ....PIVOT
        SELATTRIBUTES = [];
        //CLICKEDELEMENT = SPECT.attributes.previousClickedElement;
        //console.log(CLICKEDELEMENT);
        var rowCounter = 1;
        var longestString = 0;
        for (var key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                //add the key value pair
                if (jsonData[key].substr(0, 4) !== 'http') {
                    SELATTRIBUTES.push(key+":"+jsonData[key]);
                } else {
                    var link = '<a href=' + jsonData[key] + ' target=_blank>' + jsonData[key] + '</a>';
                    SELATTRIBUTES.push(key + ";" + jsonData[key]);
                    //SELATTRIBUTES.push[key+":"+link];
                }
                //compute the length of the key value pair
                var len = (key + "  :  " + jsonData[key]).length;
                if (len > longestString) longestString = len;
            }
            //increment the counter
            rowCounter++;
        }
        //console.log(SELATTRIBUTES);

//        //change height based on # rows
//        SPECT.attributes.attributeListDiv.height(rowCounter * 12 + 43);
//
//        //set the width
//        if (longestString > 50) {
//            SPECT.attributes.attributeListDiv.width(longestString * 5 + 43);
//        }
//        else {
//            SPECT.attributes.attributeListDiv.width(360);
//        }
//
//        //Show the html element
//        SPECT.attributes.attributeListDiv.show("slow");
    };

    //function to handle changing the color of a selected element
    SPECT.attributes.setSelectedObjectColor = function (col) {
        SPECT.attributes.clickedMaterial.color = new THREE.Color(col);
        SPECT.attributes.clickedMaterial.ambient = new THREE.Color(col);
    };

    //function to purge local variables within this object.  When a user loads a new scene, we have to clear out the old stuff
    SPECT.attributes.purge = function () {
        if (SPECT.attributesEnabled) {
            this.restorePreviouslySelectedObject();
        }
        this.elementList = [];
    };

    //function to zoom to the selected object
    SPECT.zoomSelected = function(){

        //return if init has not been called
        if ( SPECT.attributes.previousClickedElement === undefined) return;

        //return if no selection
        if (SPECT.attributes.previousClickedElement.id === -1) return;

        //get selected item and it's bounding sphere
        var bndSphere;
        var sel = SPECT.attributes.previousClickedElement.object;

        //if the object is a mesh, grab the sphere
        if (sel.hasOwnProperty('geometry')) {
            //sel.computeBoundingSphere();
            bndSphere = sel.geometry.boundingSphere;
        }

        //if the object is object3d, merge all of it's geometries and compute the sphere of the merge
        else {
            var geo = new THREE.Geometry();
            for (var i in sel.children) {
                geo.merge(sel.children[i].geometry);
            }
            geo.computeBoundingSphere();
            bndSphere = geo.boundingSphere;
        }


        //get the radius of the sphere and use it to compute an offset.  This is a mashup of theo's method and ours from platypus
        var r = bndSphere.radius;
        var offset = r / Math.tan(Math.PI / 180.0 * SPECT.orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(SPECT.orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.1);
        newPos.addVectors(bndSphere.center, dir);
        SPECT.orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        SPECT.orbitControls.target = new THREE.Vector3(bndSphere.center.x, bndSphere.center.y, bndSphere.center.z);

    };



    //*********************
    //*********************
    //*** Views - camera positions can be stored in the .json file, and we provide UI to switch between views.
    SPECT.views = {};

    //the active array of views
    SPECT.views.viewList = [];

    //a bool to track whether or not views have been enabled by the user
    SPECT.viewsEnabled = false;

    //function to get views from the active scene and populate our list of views
    SPECT.views.getViews = function () {
        try {
            if (SPECT.scene.userData.views.length > 0) {
                //create a default view

                SPECT.views.defaultView.name = "DefaultView";
                SPECT.views.viewList.push(SPECT.views.defaultView);

                //add the views in the json file
                //if the project was exported from Revit, there is only one view
                if (SPECT.scene.name.indexOf("BIM") != -1) {

                    var v = SPECT.scene.userData.views.split(",");
                    for (var k = 0; k < v.length; k+=7) {
                        var revitView = {}
                        revitView.name = v[k];
                        revitView.eye = {};
                        revitView.eye.X = parseFloat(v[k + 1]);
                        revitView.eye.Y = parseFloat(v[k + 2]);
                        revitView.eye.Z = parseFloat(v[k + 3]);
                        revitView.target = {};
                        revitView.target.X = parseFloat(v[k + 4]);
                        revitView.target.Y = parseFloat(v[k + 5]);
                        revitView.target.Z = parseFloat(v[k + 6]);
                        SPECT.views.viewList.push(revitView);
                    }
                }

                    //for Grasshopper files
                else {

                    for (var k = 0, kLen = SPECT.scene.userData.views.length; k < kLen; k++) {
                        var itemView = SPECT.scene.userData.views[k];
                        SPECT.views.viewList.push(itemView);
                    }
                }
            }
        }
        catch (err) { }
    };

    //funciton to create the user interface for view selection
    SPECT.views.CreateViewUI = function () {

        //if there are saved views, get their names and create a dat.GUI controller
        if (SPECT.views.viewList.length > 0) {

            //get an array of all of the view names
            viewStrings = [];
            for (var i = 0; i < SPECT.views.viewList.length; i++) {
                viewStrings.push(SPECT.views.viewList[i].name);
            }
            viewStrings.sort();

            //set the first view to be the current view
            this.setView('DefaultView');

            //make sure the view and selection folder exists - if it doesn't, throw an error
            if (SPECT.UIfolders.View_and_Selection === undefined) throw "View and selection folder must be initialized";

            //add the view dropdown, and call our reset view function on a change
            SPECT.UIfolders.View_and_Selection.add(SPECT.uiVariables, 'view', viewStrings).onFinishChange(function (e) {
                SPECT.views.resetView();
            });
        }
    };
    
   
    //function to set the current view
    SPECT.views.setView = function (v) {
        if (this.viewList.length > 0) {
            SPECT.uiVariables.view = v;
        }
    };

    //function to reset the view ... not sure why we need both - AGP?
    //function to reset the view ... not sure why we need both - AGP?
    SPECT.views.resetView = function () {
        var vector = new THREE.Vector3(0, 0, 1);
        var up = vector.applyQuaternion(SPECT.orbitControls.object.quaternion);

        //get the current camera by name
        var view;
        for (var i = 0; i < this.viewList.length; i++) {
            var v = this.viewList[i];
            if (v.name === SPECT.uiVariables.view) {
                view = v;
                break;
            }
        }

        //if we found a view, activate it
        if (view) {
            //get the eyePos from the current view
            var eyePos = new THREE.Vector3(view.eye.X, view.eye.Y, view.eye.Z);

            //get the targetPos from the current view
            //var dir = new THREE.Vector3(-view.target.X, view.target.Z, view.target.Y);

            var dir = new THREE.Vector3(view.target.X, view.target.Y, view.target.Z);


            SPECT.orbitControls.target.set(dir.x, dir.y, dir.z);
            SPECT.orbitControls.object.position.set(eyePos.x, eyePos.y, eyePos.z);

        }
    };

    //function to purge the list of views
    SPECT.views.purge = function () {
        //reset the list
        if (this.viewList.length > 0) this.viewList = [];

        try { //purge view controller
            var viewFolder = SPECT.datGui.__folders.View_and_Selection;

            for (var i = 0; i < viewFolder.__controllers.length; i++) {
                if (viewFolder.__controllers[i].property == "view") {
                    viewFolder.__controllers[i].remove();
                    break;
                }
            }
        } catch (e) {
        }
    };
    SPECT.views.defaultView = {};

    SPECT.views.storeDefaultView = function () {
        SPECT.views.defaultView.eye = {};
        SPECT.views.defaultView.target = {};
        SPECT.views.defaultView.eye.X = SPECT.orbitControls.object.position.x;
        SPECT.views.defaultView.eye.Y = SPECT.orbitControls.object.position.y;
        SPECT.views.defaultView.eye.Z = SPECT.orbitControls.object.position.z;
        SPECT.views.defaultView.target.X = SPECT.orbitControls.target.x;
        SPECT.views.defaultView.target.Y = SPECT.orbitControls.target.y;
        SPECT.views.defaultView.target.Z = SPECT.orbitControls.target.z;

    };
    



    //*********************
    //*********************
    //*** Layers - [exported] objects can contain a user data attribute called 'layer' which we use to provide a layers interface.
    SPECT.layers = {};

    //the active array of layers
    SPECT.layers.layerList = [];

    //a bool to track whether or not layers have been enabled by the user
    SPECT.layersEnabled = false;

    //function to get layers from the active scene and populate our list
    SPECT.layers.getLayers = function () {
        try {
            if (SPECT.scene.userData.layers.length > 0) {
                //if the project was exported from Revit
                if (SPECT.scene.name.indexOf("BIM") != -1) {

                    var lay = SPECT.scene.userData.layers.split(',');
                    SPECT.layers.layerList = lay;

                }
                    //for Grasshopper files
                else {
                    for (var k = 0, kLen = SPECT.scene.userData.layers.length; k < kLen; k++) {
                        var itemLayer = SPECT.scene.userData.layers[k];
                        SPECT.layers.layerList.push(itemLayer);
                    }
                }
            }
        }
        catch (err) { }
    };
    
    //add to global scope -- PIVOT --
    ELEMENTS = SPECT.attributes.elementList;

    //function to create the user interface for view selection
    SPECT.layers.CreateLayerUI = function () {
        //if there are saved layers, create a checkbox for each of them
        if (SPECT.layers.layerList.length > 0) {
            layerStrings = [];
            for (var i = 0; i < SPECT.layers.layerList.length; i++) {
                //for Grasshopper files, this will return the name of the layer
                var lName = SPECT.layers.layerList[i].name;
                // for Revit files, this will be undefined. We need to grab the object itself
                if (lName == null) {
                    lName = SPECT.layers.layerList[i];
                }
                if (lName != "Cameras") layerStrings.push(lName);
            }
            //sort layers by name
            layerStrings.sort();
            
            for (var i = 0; i < layerStrings.length; i++) {
                
                //create an layer object that has a boolean property with its name
                var layer = {};
                layer[layerStrings[i]] = true;
                SPECT.layerStorage.push(layer);
                
                //add to global scope -- PIVOT --
                LAYERLIST=layerStrings;
                LAYERSTART=layer;

                //add a checkbox per layer
                layerFolder.add(layer, layerStrings[i]).onChange(function (e) {
                
                    // get the name of the controller that fired the event -- there must be a different way of doing this...
                    var layerName = this.domElement.parentElement.firstChild.innerHTML;
                    for (var i = 0; i < SPECT.attributes.elementList.length; i++) {
                        var element = SPECT.attributes.elementList[i];

                        var changeVisibility = false;
                        // if it is a project created in Revit, we need to get the parent of the element, the 3D object to get the user data recorded
                        if (SPECT.scene.name.indexOf("BIM") != -1) {
                            var parent = element.parent;
                            if (parent.userData.layer == layerName) changeVisibility = true;
                        }
                            //for GH objects
                        else {
                            if (element.userData.layer == layerName) changeVisibility = true;
                        }
                        if (changeVisibility) {
                            //if unchecked, make it invisible
                            if (element.visible == true) element.visible = false;
                                //otherwise, show it
                            else element.visible = true;
                        }
                    }
                });
            }
        }
    };

    //function to purge the list of layers
    SPECT.layers.purge = function () {
        //reset our list
        if (this.layerList.length > 0) this.layerList = [];

        //purge layer folder
        try {
            var layerFolder = SPECT.datGui.__folders.Layers;
            var layerCount = layerFolder.__controllers.length;
            for (var i = 0; i < layerCount; i++) {
                layerFolder.__controllers[0].remove();
            }

            //remove the Layers folder -- this is not working
            SPECT.datGui.removeFolder('Layers');

        }

        catch (err) { }
    };
    
    //now all functions have been initialized.  Call init viewer to start the application
    SPECT.initViewer(SPECT.viewerDiv);

    //if the user passed in a json file, load it.
    if (jsonFileData !== undefined) {
        SPECT.jsonLoader.loadSceneFromJson(jsonFileData);
        SPECT.zoomExtents();
        SPECT.views.storeDefaultView();
    }

    //if the user supplied a callback function, call it and pass our application object (this)
    if (callback !== undefined) {
        try {
            callback(SPECT);
        } catch (e) {
        }
    }
    //console.log(SPECT.viewerDiv);
    VIEWERDIV = SPECT.viewerDiv;
};



//global variables defined in Pivot


var PIVOT = function(divToBind,callback){
    //*******************Pulling in Global Variables and creating local ones//
    var elements = ELEMENTS;
    var allAttributes;
    var orbitControls = ORBITCONTROLS;
    var boundingSphere = BOUNDINGSPHERE;
    var camera = CAMERA;
    var projector = PROJECTOR;
    var elements = ELEMENTS;
    var container = document.getElementById('Spectacles_output');
    var children = container.children;
    var canvas = {};
    var sidebar = $("#sidebar").offcanvas({autohide: false, toggle:false});
    var sideList = document.getElementById("side");
    var filterBar = $("#filterbar").offcanvas({autohide:false, toggle:false});
    var filterList = document.getElementById("filters");
    var populated;
    var picked;
    var attributeSet;
    var originalMaterials = ORIGINALMATERIALS;
    var pickedMat = new THREE.MeshLambertMaterial({
            color: "rgb(0,255,255)",
            ambient: "rgb(0,255,255)",
            side: 2
        });
    var scopes = [];
    var filterNames = [];
    var filterVals = [];
    
    //***************generate list of all available attributes*********//
    var tempList = [];
    for(i=0;i<elements.length;i++){
        var obj = elements[0];
        attL = obj.userData;
            //console.log(attL);
            //console.log(Object.keys(attL).length);
            //console.log(Object.keys(attL)[1]);
            for(j=0;j<Object.keys(attL).length;j++){
                //console.log(attL[j]);
                //if (Object.keys(attL)[j] != 'layer'){
                    tempList.push(Object.keys(attL)[j]);
                //}
            }
    }
    var allAttributes = Array.from(new Set(tempList));
    //console.log(allAttributes);
    
    //***************************object selection**********************//
    
    container.onclick = function(e){
        e.preventDefault();
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName === "CANVAS") {
                //once we've found the element, wrap it in a jQuery object so we can call .position() and such.
                canvas = jQuery(children[i]);
                break;
            }
        }
        var containerWidth = container.width;
        var containerHeight = container.height;
        //window.addEventListener('mousedown', onMouseDown, false);

        var win = $(window);
        var offsetX = canvas.offset().left - win.scrollLeft();
        var offsetY = canvas.offset().top - win.scrollTop();
        //******************Generate Mouse Vector*****************************//
        var mouse3D = new THREE.Vector3();
        mouse3D.x = 2*((e.clientX - offsetX)/canvas.width())-1;
        mouse3D.y = 1-2*((e.clientY - offsetY)/canvas.height());
        mouse3D.unproject(camera);
        mouse3D.sub(camera.position);
        mouse3D.normalize();
        var raycaster = new THREE.Raycaster(camera.position, mouse3D);
        var intersects = raycaster.intersectObjects(elements);
        //********************If something was clicked on********************//
        if(intersects[0] != undefined){
            picked = intersects[0].object;
            picked.material = pickedMat;
        }
        
        if(intersects[0] !== undefined){
            if(sideList.children.length === 0){
                $("#sidebar").offcanvas("toggle");
                //$("#wrapper").toggleClass("toggled");
                //$("#side").css("visibility","hidden");
                populated = false;
            }
            else{
                populated = true;
            }
            //Clear sideBar
            while(sideList.children.length > 0){
                sideList.removeChild(sideList.lastChild);
            }
            //add attributes to sidebar
            var originalMat = picked.material;
            var data = picked.userData;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    //add the key value pair
                    if (data[key].substr(0, 4) !== 'http') {
                        var attribute = key+":"+data[key];
                        var li = document.createElement("li");
                        var link = document.createElement("a");
                        var text = document.createTextNode(attribute);
                        link.appendChild(text);
                        li.appendChild(link);
                        sideList.appendChild(li);                
                    }
                }
            }
        }
        else if(intersects[0] === undefined && sideList.children.length > 0){
            picked = undefined;
            while(sideList.children.length > 0){
                sideList.removeChild(sideList.lastChild);
            }
            $("#sidebar").offcanvas("toggle");
            //$(.side-toggle).click();
            //$("#wrapper").toggleClass("toggled");
            //$("#side").css.visibility = "visible"
        }
    }
    

    //modify Bootstrap dropdown behavior 
    //from http://www.benknowscode.com/2014/09/option-picker-bootstrap-dropdown-checkbox.html
    var options = [];
    $( '.PIVOTlayers a' ).on( 'click', function( event ) {
       var $target = $( event.currentTarget ),
           val = $target.attr( 'data-value' ),
           $inp = $target.find( 'input' ),
           idx;
       if ( ( idx = options.indexOf( val ) ) > -1 ) {
          options.splice( idx, 1 );
          $inp.prop( 'checked', false );
       } else {
          options.push( val );
          $inp.prop( 'checked', true );
       }
       $target.blur();
       return false;
    });
    
    //Populate Bootstrap layer drop-down dynamically with layers and checkboxes
    document.getElementById("PIVOTlayers").onclick = function(){
        var layerListing = document.getElementById('LayersListing')
        if (layerListing.childElementCount == 0) 
        {
            for (var i = 0; i < LAYERLIST.length; i++){
                var opt = LAYERLIST[i];
                var li = document.createElement("li");
                var link = document.createElement("a");
                var checkbox = document.createElement("input");
                var text = document.createTextNode(opt);

                checkbox.type="checkbox";
                checkbox.checked=LAYERSTART;
                checkbox.id=opt
                checkbox.onclick = function(){
                    //control visibliity of elements
                    for (var i = 0; i < ELEMENTS.length; i++){
                        var element = ELEMENTS[i];
                        var changeVisibility = false;
                        if (element.userData.layer == this.id) changeVisibility = true;
                        if (changeVisibility) {
                            //if unchecked, make it invisible
                            if (element.visible == true) element.visible = false;
                                //otherwise, show it
                            else element.visible = true;
                        }
                    }
                }
                link.appendChild(checkbox);
                link.appendChild(text);
                link.href = "#";
                li.appendChild(link);
                layerListing.appendChild(li); 
            }
        }
    }
    
    //**************ZOOM EXTENTS FUNCTION*************************//
    zoomExtents = function () {

//        if (BOUNDINGSPHERE === undefined) SPECT.computeBoundingSphere();

        //get the radius of the sphere and use it to compute an offset.  This is a mashup of theo's method
        //and the one we use in platypus
        var r = boundingSphere.radius;
        var offset = r / Math.tan(Math.PI / 180.0 * orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.25);
        newPos.addVectors(boundingSphere.center, dir);
        orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        orbitControls.target = new THREE.Vector3(boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z);
    };
    
    //************CALL ZOOM EXTENTS WHEN CLICKING ON MENU ITEM*************//
    document.getElementById("PIVOTzoomExtents").onclick = function(){
        zoomExtents();
    }
    
    //******************ZOOM SELECTED FUNCTION**********//
    zoomSelected = function(){

        //return if init has not been called
        //if ( SPECT.attributes.previousClickedElement === undefined) return;

        //return if no selection
        if (picked === undefined) return;

        //get selected item and it's bounding sphere
        var bndSphere;
        var sel = picked;

        //if the object is a mesh, grab the sphere
        if (sel.hasOwnProperty('geometry')) {
            //sel.computeBoundingSphere();
            bndSphere = sel.geometry.boundingSphere;
        }

        //if the object is object3d, merge all of it's geometries and compute the sphere of the merge
        else {
            var geo = new THREE.Geometry();
            for (var i in sel.children) {
                geo.merge(sel.children[i].geometry);
            }
            geo.computeBoundingSphere();
            bndSphere = geo.boundingSphere;
        }


        //get the radius of the sphere and use it to compute an offset.  This is a mashup of theo's method and ours from platypus
        var r = bndSphere.radius;
        var offset = r / Math.tan(Math.PI / 180.0 * orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.1);
        newPos.addVectors(bndSphere.center, dir);
        orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        orbitControls.target = new THREE.Vector3(bndSphere.center.x, bndSphere.center.y, bndSphere.center.z);

    };
    
    //****************CALL ZOOM EXTENTS WHEN MENU ITEM IS CLICKED************//
    document.getElementById("PIVOTzoomSelected").onclick = function(){
        zoomSelected();
    }
    
    
    //********************GENERATE LIST OF AVAILABLE ATTRIBUTES***********//
    CreateAttributeList = function(){
        var objects = elements;
        //console.log(objects);
        var attributeList = [];
        for (i=0;i<objects.length;i++){
            var obj = objects[i];
            attL = obj.userData;
            //console.log(attL);
            //console.log(Object.keys(attL).length);
            //console.log(Object.keys(attL)[1]);
            for(j=0;j<Object.keys(attL).length;j++){
                //console.log(attL[j]);
                //if (Object.keys(attL)[j] != 'layer'){
                    attributeList.push(Object.keys(attL)[j]);
                //}
            }
        }
        attributeSet = Array.from(new Set(attributeList));
    }
    
    //******************POPULATE ATTRIBUTE LIST FOR COLOR CODING****************************//
    document.getElementById("PIVOTrendering").onclick = function(){
        var attL = document.getElementById("PIVOTattributeList");
        while(attL.children.length > 2){
            attL.removeChild(attL.lastChild);
        }
        CreateAttributeList();
        for (var i=0;i<attributeSet.length;i++){
            var attribute = attributeSet[i];
            //console.log(attribute);
            var li = document.createElement("li");
            var link = document.createElement("a");
            var text = document.createTextNode(attribute);
            link.id = attribute;
            link.href = "#";
            link.appendChild(text);
            link.onclick = function(){
                //console.log(link);
                colorByAttribute(this.id);
            }
            li.appendChild(link);
            attL.appendChild(li); 
        }
        //console.log(attL);
    }
    
    
    //********************COLOR CODE BY ATTRIBUTE*************************//
    //Color Code by attribute (ADDED BY DG) Not project specific
    colorByAttribute = function(c){
        var testList = [];
        for(i=0;i<elements.length;i++){
            var el = elements[i];
            var elData = el.userData;
            var listAtt = elData[c];
            if (listAtt != undefined){
                testList.push(listAtt);
            }
        }
        var attSet = Array.from(new Set(testList));
    
        var numColors = attSet.length;
        var colors = rgbColors(numColors);
        var colorList = shuffle(colors);
        var objs = elements;
        var mainAttribute = c;
        for (i=0;i<numColors;i++){
            var color = colorList[i];
            var colorString = "rgb("+color[0].toString()+","+color[1].toString()+","+color[2]+")";
            var material = new THREE.MeshLambertMaterial({
                color: colorString,
                side: 2
            });
            var checkAtt = attSet[i];
            for(j=0;j<objs.length;j++){
                var obj = objs[j];
                var objData = obj.userData;
                var objAtt = objData[mainAttribute];
                if(objAtt != null){
                    if(objAtt == checkAtt){
                        obj.material = material;
                    }
                }
            }
        }
    };
    
    //*********************RENDERED DISPLAY***************************//
    rendered = function(){
//        $(".ColorConsole").css('visibility', 'hidden');
//        $(".ColorHeader").css('visibility', 'hidden');
        var objs = elements;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var originalMat = originalMaterials[i];
            obj.material = originalMat;
        }
    };
    
    //**********************CALL RENDERED FUNCTION WHEN MENU ITEM IS CLICKED******************//
    document.getElementById("PIVOTrenderByMaterial").onclick = function(){
        rendered();
    }
    
    
    //*****************SHOW FILTER BAR**************//
    enableFilters = function(){
        filterBar.offcanvas("show");
    }
    
    
    //***************ACTIVATE FILTER BAR WHEN MENU ITEM IS CLICKED****************//
    document.getElementById("PIVOTenableFilters").onclick = function(){
        enableFilters();
        createScopeList();
    }
    
    //*******************Deactivate FILTER BAR*************************************//
    disableFilters = function(){
        filterBar.offcanvas("hide");
        rendered();
        //reset filter lists
        filterNames = [];
        filterVals = [];
        while (filterList.childElementCount>0){
            filterList.removeChild(filterList.firstChild);
        }
    }
    //*******************DEACTIVATE FILTERS WHEN MENU ITEM IS CLICKED**************//
    document.getElementById("filterClose").onclick = function(){
        disableFilters();
    }
    
    //******************CREATE LIST OF PROJECT SCOPES defined by layers (ADDED BY DG)***********//
    createScopeList = function(){
        var objs = elements;
        var scopeList = [];
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var scope = objData.layer;
            scopeList.push(scope);
        }
        var scopeSet = Array.from(new Set(scopeList));
        scopeSet.unshift('All');
        var dropdown = document.createElement("li");
        var name = document.createTextNode("SCOPE");
        dropdown.setAttribute("class","dropdown");
        var a = document.createElement("a");
        a.appendChild(name);
        a.setAttribute("href","#");
        a.setAttribute("class","dropdown-toggle-Scope-TDG");
        a.setAttribute("data-toggle","dropdown");
        a.setAttribute("role","button");
        a.setAttribute("aria-expanded","false");
        a.setAttribute("aria-haspopup","true");
        var span = document.createElement("span");
        span.setAttribute("class","caret");
        a.appendChild(span);
        dropdown.appendChild(a);
        var menu = document.createElement("ul");
        menu.setAttribute("class","dropdown-menu navmenu-nav");
        menu.setAttribute("aria-expanded","false");
        menu.setAttribute("aria-haspopup","true");
        menu.setAttribute("role","menu");
        for (i=0;i<scopeSet.length;i++){
            var text = document.createTextNode(scopeSet[i]);
            var li = document.createElement("li");
            var link = document.createElement("a");
            link.setAttribute("href","#");
            link.appendChild(text);
            link.onclick = function(){
                filterVals[0] = this.innerHTML;
                var filt = "SCOPE: " + this.innerHTML;
                //filterNames.push(this.innerHTML);
                var parentDropdown = this.parentElement.parentElement.parentElement;
                parentDropdown.firstChild.innerHTML = filt;
                var newSpan = document.createElement("span");
                newSpan.setAttribute("class","caret");
                parentDropdown.firstChild.appendChild(newSpan);
            }
            li.appendChild(link);
            menu.appendChild(li);
            
        }
        dropdown.appendChild(menu);
        filterList.appendChild(dropdown);
        filterNames[0] = 'layer';
    };
    
    //*******************ADD A FILTER TO FILTER BAR*****************************//
    addFilter = function(){
        CreateAttributeList();
        //**CREATING HTML FOR DROPDOWN MENUS**//
        //var DIV = document.createElement("div");
        var numFilt = (filterList.childElementCount - 1)/2;
        //console.log(numFilt);
        
        //FIRST DROPDOWN
        var dropdown  = document.createElement("li");
        var name = document.createTextNode("Filter");
        dropdown.setAttribute("class","dropdown");
        var a = document.createElement("a");
        a.appendChild(name);
        a.setAttribute("href","#");
        a.setAttribute("num",numFilt.toString());
        a.setAttribute("class","dropdown-toggle-filterName-TDG");
        a.setAttribute("data-toggle","dropdown");
        a.setAttribute("role","button");
        a.setAttribute("aria-expanded","false");
        a.setAttribute("aria-haspopup","true");
        var span = document.createElement("span");
        span.setAttribute("class","caret");
        a.appendChild(span);
        dropdown.appendChild(a);
        var menu = document.createElement("ul");
        menu.setAttribute("class","dropdown-menu navmenu-nav");
        menu.setAttribute("role","menu");
        dropdown.appendChild(menu);
        filterList.appendChild(dropdown);
        //SECOND DROPDOWN
        var filterDrop = document.createElement("li");
        var filterName = document.createTextNode("Filter Value");
        filterDrop.setAttribute("class","dropdown");
        var clicker = document.createElement("a");
        clicker.appendChild(filterName);
        clicker.setAttribute("href","#");
        clicker.setAttribute("class","dropdown-toggle-filterVal-TDG");
        clicker.setAttribute("data-toggle","dropdown");
        clicker.setAttribute("role","button");
        clicker.setAttribute("aria-expanded","false");
        clicker.setAttribute("aria-haspopup","true");
        clicker.setAttribute("num",numFilt.toString());
        var carrot = document.createElement("span");
        carrot.setAttribute("class","caret");
        clicker.appendChild(carrot);
        filterDrop.appendChild(clicker);
        var filterMenu = document.createElement("ul");
        filterMenu.setAttribute("class","dropdown-menu navmenu-nav");
        filterMenu.setAttribute("role","menu");
        filterMenu.setAttribute("id","filterValue");
        filterMenu.setAttribute("num",numFilt.toString());
        filterDrop.appendChild(filterMenu);
        filterList.appendChild(filterDrop);
        for(i=0;i<attributeSet.length;i++){
            var text = document.createTextNode(attributeSet[i]);
            var li = document.createElement("li");
            li.setAttribute("num",numFilt.toString());
            var link = document.createElement("a");
            link.setAttribute("num",numFilt.toString());
            link.setAttribute("href","#");
            link.appendChild(text);
            //UPON CLICKING ATTRIBUTE, GENERATE SECOND DROPDOWN FOR FILTER VALUES
            link.onclick = function(){
                var testIndex = this.getAttribute("num");
                for(i=0;i<$("#filters").find('*').length;i++){
                    var child = $("#filters").find('*')[i];
                    var childIndex = child.getAttribute("num");
                    var childId = child.getAttribute("id");
                    if(childIndex === testIndex && childId === "filterValue"){
                        var targetIndex = i;
                        var targetMenu = $("#filters").find('*')[targetIndex];
                    }
                }
                var filt = this.innerHTML;
                filterNames[numFilt] = filt;
                //filterNames.push(filt);
                var parentDropdown = this.parentElement.parentElement.parentElement;
                parentDropdown.firstChild.innerHTML = this.innerHTML;
                var newSpan = document.createElement("span");
                newSpan.setAttribute("class","caret");
                parentDropdown.firstChild.appendChild(newSpan);
                //make list of all values for selected filter
                var valList = [];
                for (j=0;j<elements.length;j++){
                    var obj = elements[j];
                    var objData = obj.userData;
                    if(objData[filt] !== undefined){
                        valList.push(objData[filt]);
                    }
                }
                var valSet = Array.from(new Set(valList));
                //add values to filter val dropdown
                for(j=0;j<valSet.length;j++){
                    var filtText = document.createTextNode(valSet[j]);
                    var item = document.createElement("li");
                    var anchor = document.createElement("a");
                    anchor.setAttribute("href","#");
                    anchor.setAttribute("num",numFilt.toString());
                    anchor.appendChild(filtText);
                    anchor.onclick = function(){
                        index = this.getAttribute("num");
                        var filtVal = this.innerHTML;
                        filterVals[numFilt] = filtVal;
                        //filterVals.push(filtVal);
                        //console.log(filterNames);
                        //console.log(filterVals);
                        filteredSearch();
                    }
                    item.appendChild(anchor);
                    targetMenu.appendChild(item);
                }
                
                //filterList.appendChild(filterDrop);
                //DIV.appendChild(filterDrop);
            }
            li.appendChild(link);
            menu.appendChild(li);        
        }
        //DIV.appendChild(dropdown);
        //filterList.appendChild(DIV);
    }
    
    //********************FILTERED SEARCH FUNCTION********************************//
    filteredSearch = function(){
        rendered();
        var dataElements = [];
        var filterCheck;
        var filterValCheck;
        //material for non relevant elements
        var hideMat = new THREE.MeshBasicMaterial({
            color: "rgb(125,125,125)",
            transparent: true,
            side:2,
            opacity: .5,
        })
        
        if(filterVals[0] === 'All'){
            //console.log(SPECT.filters);
            var newFilters = [];
            var newFilterVals = [];
            for(i=1;i<filterNames.length;i++){
                newFilters.push(filterNames[i]);
            }
            for(i=1;i<filterVals.length;i++){
                newFilterVals.push(filterVals[i]);
            }
            filterCheck = newFilters;
            filterValCheck = newFilterVals;
            //console.log(newFilters);
            //console.log(newFilterVals);
        }
        else{
            filterCheck = filterNames;
            filterValCheck = filterVals;
        }
        //Account for doubling up on parameters
        var filterSet = Array.from(new Set(filterCheck));
        //console.log(filterSet);
        var filterLists = [];
        for(i=0;i<filterSet.length;i++){
            var valList = [];
            valList.push(filterSet[i]);
            for(j=0;j<filterCheck.length;j++){
                if(filterCheck[j] === filterSet[i]){
                    valList.push(filterValCheck[j]);
                }
            }
            //console.log(valList);
            filterLists.push(valList);
        }
        //console.log(filterLists);
        var objs = elements;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var testList = [];
            for (j=0;j<filterLists.length;j++){
                var checkList = [];
                for(k=1;k<filterLists[j].length;k++){
                    var searchAtt = filterLists[j][0];
                    var checkAtt = filterLists[j][k];
                    var objAtt = objData[searchAtt];
                    if(objAtt !== undefined){
                        if(objAtt === checkAtt){
                            checkList.push(true);
                        }
                        else{
                            checkList.push(false);
                        }
                    }
                    else{
                        checkList.push(false);
                    }
                }
                if(checkList.indexOf(true) !== -1){
                    testList.push(true);
                }
                else{
                    testList.push(false);
                }
            }
            if(testList.indexOf(false) !== -1){
                //Attempting to make non selected elements change material
                obj.material = hideMat;
                //SPECT.attributes.paintElement(obj,hideMat);
                //obj.visible = false;
            }
            else{
                //SPECT.counter += 1;
                //updateCnsl();
                dataElements.push(obj);
            }
            //console.log(SPECT.guiList[1].Available_Attributes);
            if(filterVals[0] !== 'All'){
                var layer = objData.layer;
                var checkLayer = filterVals[0];
                //console.log(checkLayer);
                if(layer !== checkLayer){
                    //obj.visible = true;
                }
            }
        }
    }
    
    //*******************CALL addFilter WHEN MENU ITEM IS CLICKED****************//
    document.getElementById("filterAdd").onclick = function(){
        addFilter();
        //console.log(filterList.childElementCount);
    }
    
    //********************REMOVE FILTER*********************************//
    removeFilter = function(){
        //console.log(filterList.childElementCount);
        if(filterList.childElementCount>1){
            filterList.removeChild(filterList.lastChild);
            filterNames.pop();
            filterVals.pop();
            filterList.removeChild(filterList.lastChild);
            filteredSearch();
        }
    }
    
    //*********************CALL removeFilter WHEN MENU ITEM IS CLICKED**************//
    document.getElementById("filterRemove").onclick = function(){
        removeFilter();
    }
};



function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

//Generate unique colors for colorCoding taken from Al Dass Here: http://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript
function rgbColors(t) {
    t = parseInt(t);
    if (t < 2)
    throw new Error("'t' must be greater than 1.");

    // distribute the colors evenly on
    // the hue range (the 'H' in HSV)
    var i = 360 / (t - 1);

    // hold the generated colors
    var r = [];
    var sv = 70;
    for (var x = 0; x < t; x++) {
    // alternate the s, v for more
    // contrast between the colors.
    sv = sv > 90 ? 70 : sv+10;
    r.push(hsvToRgb(i * x, sv, sv));
    }
    return r;
};
    
    
//Convert HSV color To RGB taken from Al Dass here: http://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript (ADDED BY DG)
function hsvToRgb(h, s, v) {
        var r, g, b;
        var i;
        var f, p, q, t;

        // Make sure our arguments stay in-range
        h = Math.max(0, Math.min(360, h));
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));

        // We accept saturation and value arguments from 0 to 100 because that's
        // how Photoshop represents those values. Internally, however, the
        // saturation and value are calculated from a range of 0 to 1. We make
        // That conversion here.
        s /= 100;
        v /= 100;

        if (s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        h /= 60; // sector 0 to 5
        i = Math.floor(h);
        f = h - i; // factorial part of h
        p = v * (1 - s);
        q = v * (1 - s * f);
        t = v * (1 - s * (1 - f));

        switch (i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;

        case 1:
          r = q;
          g = v;
          b = p;
          break;

        case 2:
          r = p;
          g = v;
          b = t;
          break;

        case 3:
          r = p;
          g = q;
          b = v;
          break;

        case 4:
          r = t;
          g = p;
          b = v;
          break;

        default: // case 5:
          r = v;
          g = p;
          b = q;
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

//*****************SHUFFLE AN ARRAY ***********************************//
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


