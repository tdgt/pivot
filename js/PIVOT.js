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


var PIVOT = function(divToBind, jsonFileData, callback){
    //***********************The Pivot App****************//
    var PIV = this;
    PIV.viewerDiv = divToBind;  //a reference to the div for use throughout the app

    PIV.scene = {};          //the THREE.js scene object
    PIV.jsonLoader = {};     //the object that will take care of loading a THREE.js scene from a json file
    PIV.boundingSphere = undefined;      //a sphere that encompasses everything in the scene
    PIV.lightingRig = {};    //a parent object to hold our lights.  We'll be setting properties with UI
    PIV.orbitControls = {};  //the THREE.js orbit controls object
    PIV.camera = {};         //the THREE.js camera object
    PIV.renderer = {};       //the THREE.js renderer object
    PIV.clock = {};          //the THREE.js clock
    PIV.stats = undefined;               //the Stats object
    PIV.backgroundColor = 0xFFFFFF;
    PIV.layerStorage = [];
    
    PIV.originalMaterials = [];
    
    //attributes object.  Contains logic for element selection and attribute list population
    PIV.attributes = {};

    //top level property to track whether or not element attributes have been enabled
    PIV.attributesEnabled = false;

    //element list.  This gets populated after a json file is loaded, and is used to check for intersections
    PIV.attributes.elementList = [];

    //attributes list div - the div that we populate with attributes when an item is selected
    PIV.attributes.attributeListDiv = {};

    //initialize attribtes function.  Call this once when initializing Spectacles to set up all of the
    //event handlers and application logic.
    PIV.attributes.init = function () {

        //attribute properties used throughout attribute / selection code

        //set the state of this guy to true
        PIV.attributesEnabled = true;

        //the three projector object used for turning a mouse click into a selection
        PIV.attributes.projector = new THREE.Projector();
        //send to global variable for pivot
    };
    
    
    //***********************INITIATE SCENE*************************************************//
    initViewer = function (viewerDiv) {
        //empty scene
        PIV.scene = new THREE.Scene();

        //set up the THREE.js div and renderer
        PIV.container = viewerDiv;
        PIV.renderer = new THREE.WebGLRenderer(
            {
                maxLights: 10,
                antialias: true
            }
        );
        PIV.renderer.setClearColor(PIV.backgroundColor, 1.0);
        PIV.renderer.setSize(viewerDiv.innerWidth(), viewerDiv.innerHeight());
        PIV.renderer.shadowMap.enabled = true;
        //SPECT.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        PIV.container.append(PIV.renderer.domElement);

        //set up the camera and orbit controls
        PIV.camera = new THREE.PerspectiveCamera(45, viewerDiv.innerWidth() / viewerDiv.innerHeight(), 1, 1000000);
        PIV.camera.position.set(1000, 1000, 1000);
        PIV.orbitControls = new THREE.OrbitControls(PIV.camera, PIV.renderer.domElement);
        PIV.orbitControls.target.set(0, 100, 0);
        //push to global variable for pivot
//        CAMERA = SPECT.camera;
//        ORBITCONTROLS = SPECT.orbitControls;

        //a clock.  the camera uses this
        PIV.clock = new THREE.Clock();

        //respond to resize
        viewerDiv.resize(function () {
            var WIDTH = viewerDiv.innerWidth(),
                HEIGHT = viewerDiv.innerHeight();
            PIV.renderer.setSize(WIDTH, HEIGHT);
            PIV.orbitControls.object.aspect = WIDTH / HEIGHT;
            PIV.orbitControls.object.updateProjectionMatrix();
        });

        //respond to window resize and scrolling.  when the window resizes, sometimes it moves our parent div ... and all of our
        //children need to be repositioned (maybe I'm just horrible with CSS?).  On a resize, trigger the resize
        //event on our parent DIV, which should reposition all of the children.
        window.addEventListener('resize', function () {
            PIV.viewerDiv.resize();
        });
        window.addEventListener('scroll', function () {
            PIV.viewerDiv.resize();
        });


        //call the render function - this starts the webgl render loop
        PIV.render();
    };

    //function that starts the THREE.js renderer
    PIV.render = function () {
        if (PIV.stats !== undefined) {
            PIV.stats.update();
        }
        var delta = PIV.clock.getDelta();
        PIV.orbitControls.update(delta); //getting a warning here - look into it

        requestAnimationFrame(PIV.render);// same here - look into this warning
        PIV.renderer.render(PIV.scene, PIV.orbitControls.object);
        $("#BLACKOUT").hide(); 
    };
    
    PIV.attributes.init();
    
    //*************************FUNCTIONS FOR OPENING JSON FILE********************//
    PIV.jsonLoader.openLocalFile = function (event) {
       $("BLACKOUT").show();
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
                    PIV.jsonLoader.loadSceneFromJson(data);
                    zoomExtents();
                    //SPECT.views.storeDefaultView();
                }


            } catch (e) {
                console.log("something went wrong while trying to load the json data.");
                console.log(e);
            }
            //SPECT.UIfolders.Search_Model.removeByProperty('Attribute_To_Search_For');
            //SPECT.UIfolders.Search_Model.removeByProperty('Available_Attributes');
//            SPECT.UIfolders.Search_Model.removeByProperty('Scopes');
//            SPECT.UIfolders.Color_Coding.removeByProperty('Attribute_To_Search_For');
            createScopeList();
            CreateAttributeList();
        };

        //read the file as text - this will fire the onload function above when a user selects a file
        reader.readAsText(input.files[0]);

        //hide the input form and blackout
//        $("#OpenLocalFile").css("visibility", "hidden");
//        $(".Spectacles_loading").show();
        $("BLAKOUT").hide();
    };
    
    PIV.jsonLoader.clearFile = function (event) {
        //the input object
        var input = event.target;
        input.value = "";

    };

    //function to open a file from url
    PIV.jsonLoader.openUrl = function (url) {

        //hide form, show loading
        $("#BLACKOUT").show();

        //try to parse the json and load the scene
        try {
            $.getJSON(url, function (data) {
                try {
                    //call our load scene function
                    PIV.jsonLoader.loadSceneFromJson(data);
                    zoomExtents();
                    PIV.views.storeDefaultView();
                } catch (e) {
                    $("#BLACKOUT").hide();
                    console.log("Spectacles could not load a scene using the json data from the URL you provided!  Here's the error:");
                    console.log(e);
                }
            })
                //some ajax errors don't throw.  this catches those errors (i think)
                .fail(function(){
                    $("#BLACKOUT").hide();
                    console.log("Spectacles could not get a json file from the URL you provided - this is probably a security thing on the json file host's end.");
                });
        } catch (e) {
            $("#BLACKOUT").hide();
            console.log("Spectacles could not get a json file from the URL you provided!  Here's the error:");
            console.log(e);
        }
    };

    //function to hide the 'open file' dialogs.
    hideOpenDialog = function () {
        //hide the input form
        $(".Spectacles_openFile").css("visibility", "hidden");
    };

    //a function to populate our scene object from a json file
    PIV.jsonLoader.loadSceneFromJson = function (jsonToLoad) {
        //show the blackout and loading message
        $("#BLACKOUT").show();

        //restore the initial state of the top level application objects
        if (PIV.attributes.elementList.length > 0) {
            PIV.attributes.purge();
        }
        if (PIV.lightingRig.pointLights.length > 0) {
            PIV.lightingRig.purge();
        }
//        if (SPECT.views.viewList.length > 0) {
//            SPECT.views.purge();
//        }
        if (PIV.layers.layerList.length > 0) {
            PIV.layers.purge();
        }
        if (PIV.originalMaterials.length > 0){
            PIV.originalMaterials = [];
        }

        //parse the JSON into a THREE scene
        var loader = new THREE.ObjectLoader();
        PIV.scene = new THREE.Scene();
        PIV.scene = loader.parse(jsonToLoad);
        //push to global variable for pivot
        //SCENE = PIV.scene;
        //SPECT.scene.fog = new THREE.FogExp2(0x000000, 0.025);

        //call helper functions
        PIV.jsonLoader.makeFaceMaterialsWork();
        PIV.jsonLoader.processSceneGeometry();
        PIV.jsonLoader.computeBoundingSphere();
        //SPECT.zoomExtents();
        //SPECT.views.storeDefaultView();

        //set up the lighting rig
        PIV.lightingRig.createLights();//note - i think we should check to see if there is an active lighting UI and use those colors to init lights if so...

        //if those chunks have been enabled by the outside caller, call getViews and getLayers on the scene.
        if (PIV.views.viewsEnabled) {
            //TO DO --- if a view with the same name as the open view exists in the incoming file, set that view
            PIV.views.getViews();
            PIV.views.CreateViewUI();
        }
        if (PIV.layers.layersEnabled) {
            PIV.layers.getLayers();
            PIV.layers.CreateLayerUI();
        }

        //hide the blackout
        $(".Spectacles_blackout").hide();
        $(".Spectacles_loading").hide();

    };
    


    //a function to add a textured obj/mtl pair to a scene
    PIV.jsonLoader.addObjMtlToScene = function (objPath, mtlPath, zoomExtentsAfterLoad){
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
//                        var lambert = new THREE.MeshLambertMaterial();
//                        lambert.map = loadedObj.children[i].material.map;
//                        console.log(lambert.wireframe);
//                        lambert.wireframe = true;
//                        loadedObj.children[i].material = lambert;

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
                PIV.scene.add(loadedObj);

                //update lights
                PIV.jsonLoader.computeBoundingSphere();
                PIV.lightingRig.updateLights();

                //zoom extents?
                if(zoomExtentsAfterLoad) { zoomExtents(); }


                //hide the blackout
                $("#BLACKOUT").hide();
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
    PIV.jsonLoader.makeFaceMaterialsWork = function () {

        for (var i = 0, iLen = PIV.scene.children.length, items; i < iLen; i++) {
            items = PIV.scene.children;
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
    PIV.jsonLoader.processSceneGeometry = function () {

        //get all of the items in the scene
        items = PIV.scene.children;
        
        //loop over all of the elements and process any geometry objects
        for (var i = 0, iLen = PIV.scene.children.length, items; i < iLen; i++) {

            //if this is a single mesh (like ones that come from grasshopper), process the geometry and add the
            //element to the attributes elements list so selection works.
            if (items[i].hasOwnProperty("geometry")) {
                //three.js stuff
                //items[i].geometry.mergeVertices();
                items[i].geometry.computeFaceNormals();
                items[i].geometry.computeVertexNormals();
                items[i].castShadow = true;
                items[i].receiveShadow = true;
                //add element to our list of elements that can be selected
                //items[i].material.transparent = true;
                //items[i].material.opacity = 1.0;
                PIV.attributes.elementList.push(items[i]);
                PIV.originalMaterials.push(items[i].material);


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
                        PIV.attributes.elementList.push(itemsChildren[k]);

                    }
                }
            }
        }
    };
    
    //push to global Variable
    //ORIGINALMATERIALS = SPECT.originalMaterials;

    //function to compute the bounding sphere of the model
    //we use this for the zoomExtents function and in the createLights function below
    PIV.jsonLoader.computeBoundingSphere = function () {
        //loop over the children of the THREE scene, merge them into a mesh,
        //and compute a bounding sphere for the scene
        var geo = new THREE.Geometry();
        PIV.scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                geo.merge(child.geometry);
            }
        });
        geo.computeBoundingSphere();

        //expand the scope of the bounding sphere
        PIV.boundingSphere = geo.boundingSphere;
        //BOUNDINGSPHERE = SPECT.boundingSphere;

        //for debugging - show the sphere in the scene
        //var sphereGeo = new THREE.SphereGeometry(geo.boundingSphere.radius);
        //var sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0.25}));
        //sphereMesh.position.set(geo.boundingSphere.center.x,geo.boundingSphere.center.y,geo.boundingSphere.center.z);
        //SPECT.scene.add(sphereMesh);
    };
    
    //*********************
    //*********************
    //*** Lighting

    //ambient light for the scene
    PIV.lightingRig.ambientLight = {};

    //a spotlight representing the sun
    PIV.lightingRig.sunLight = {};

    //an array of point lights to provide even coverage of the scene
    PIV.lightingRig.pointLights = [];


    //function that creates lights in the scene
    PIV.lightingRig.createLights = function () {

        // create ambient light
        PIV.lightingRig.ambientLight = new THREE.AmbientLight(0x808080);
        PIV.scene.add(PIV.lightingRig.ambientLight);


        //using the bounding sphere calculated above, get a numeric value to position the lights away from the center
        var offset = PIV.boundingSphere.radius * 2;
        var offset2 = PIV.boundingSphere.radius * 5;

        //get the center of the bounding sphere.  we'll use this to center the rig
        var center = PIV.boundingSphere.center;


        //create a series of pointlights

        //directly above
        var pointA = new THREE.PointLight(0x666666, 1, 0);
        pointA.position.set(center.x, center.y + offset, center.z);
        pointA.castShadow = false;
        PIV.scene.add(pointA);
        PIV.lightingRig.pointLights.push(pointA);

        //directly below
        var pointB = new THREE.PointLight(0x666666, 0.66, 0);
        pointB.position.set(center.x, center.y - offset, center.z);
        pointB.castShadow = false;
        PIV.scene.add(pointB);
        PIV.lightingRig.pointLights.push(pointB);


        //4 from the cardinal directions, at roughly 45deg
        var pointC = new THREE.PointLight(0x666666, 0.33, 0);
        pointC.position.set(center.x + offset, center.y, center.z);
        pointC.castShadow = false;
        PIV.scene.add(pointC);
        PIV.lightingRig.pointLights.push(pointC);

        var pointD = new THREE.PointLight(0x666666, 1, 0);
        pointD.position.set(center.x, center.y, center.z + offset);
        pointD.castShadow = false;
        PIV.scene.add(pointD);
        PIV.lightingRig.pointLights.push(pointD);

        var pointE = new THREE.PointLight(0x666666, 0.33, 0);
        pointE.position.set(center.x - offset, center.y, center.z);
        pointE.castShadow = false;
        PIV.scene.add(pointE);
        PIV.lightingRig.pointLights.push(pointE);

        var pointF = new THREE.PointLight(0x666666, 0.33, 0);
        pointF.position.set(center.x, center.y, center.z - offset);
        pointF.castShadow = false;
        PIV.scene.add(pointF);
        PIV.lightingRig.pointLights.push(pointF);



        //directional light - the sun
        var light = new THREE.DirectionalLight(0xffffff, .8);
        light.position.set(center.x - 40, center.y +20, center.z - 100);
        light.target.position.set(center.x, center.y , center.z);
        light.castShadow = true;
        //THREE.CameraHelper(light.shadow.camera);
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 25;
        light.shadow.camera.top = 50;
        light.shadow.camera.right = 50;
        light.shadow.camera.bottom = -50;
        light.shadow.camera.left = -50;
        light.distance = 0;
        light.intensity = 0;
        light.shadow.bias = 0.001;
        light.shadow.mapSize.height = PIV.viewerDiv.innerHeight();
        light.shadow.mapSize.width = PIV.viewerDiv.innerWidth();
        var helper = new THREE.CameraHelper(light.shadow.camera);
//     
//        //hemilight 
//        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
//        hemiLight.color.setHSL( 225, 231, 242);
//        hemiLight.groundColor.setHSL( 0, 0, 0 );
//        hemiLight.position.set( 0, 500, 0 );
//        PIV.lightingRig.sunLight = hemiLight;
//        PIV.scene.add( hemiLight );
//
//        
        //add the light to our scene and to our app object
        PIV.lightingRig.sunLight = light;
        PIV.scene.add(light);

        
    };

    //function to update lights in the scene.
    //should be called when new geometry is added to a running scene (.obj for instance)
    PIV.lightingRig.updateLights = function () {

        //remove lights from scene
        PIV.scene.remove(this.ambientLight);
        PIV.scene.remove(this.sunLight);
        for(var i=0; i<this.pointLights.length; i++){
            PIV.scene.remove(this.pointLights[i]);
        }

        //call purge and create
        this.purge();
        this.createLights();

        //call update materials - this counts as a deep update for sure!
        this.updateSceneMaterials();
    };

    //function that adjusts the point lights' color
    //this is a handler for a UI variable
    PIV.lightingRig.setPointLightsColor = function (col) {

        for (var i in SPECT.lightingRig.pointLights) {

            PIV.lightingRig.pointLights[i].color = new THREE.Color(col);
        }
    };

    //function that adjusts the ambient light color
    //another handler for a UI element
    PIV.lightingRig.setAmbientLightColor = function (col) {
        //console.log(col);

        //remove the old ambient light
        PIV.scene.remove(SPECT.lightingRig.ambientLight);

        //replace the ambient light with a new one, and add it to the scene
        PIV.lightingRig.ambientLight = new THREE.AmbientLight(new THREE.Color(col));
        PIV.scene.add(PIV.lightingRig.ambientLight);


    };

    //function that sets the position of the directional light (the sun)
    PIV.lightingRig.setSunPosition = function (az, alt) {

    };

    //function to turn the sun on and off
    PIV.lightingRig.shadowsOnOff = function (shad) {
        if (shad) {
            PIV.lightingRig.sunLight.castShadow = true;
            PIV.lightingRig.sunLight.intensity = .5;
            PIV.lightingRig.updateSceneMaterials();
        }
        else {
            PIV.lightingRig.sunLight.castShadow = false;
            PIV.lightingRig.sunLight.intensity = 0;
            PIV.lightingRig.updateSceneMaterials();
        }
    };
    


    //function that sets the fog amount in the scene
    //doesn't seem like this should live in the lighting rig ... if we get more scene variables we may need a sceneFunctions
    //object or something.
    PIV.lightingRig.setFog = function (n) {

        //if false, set fog to null and return
        if (!n) {
            PIV.scene.fog = null;
        }

            //if true, set up some fog in the scene using the backgound color and the bounding sphere's radius
        else {
            PIV.scene.fog = new THREE.FogExp2(new THREE.Color(SPECT.uiVariables.backgroundColor), 0.00025);
        }

    };

    //function to traverse materials in the scene when deep updates are needed - fog on off/ shadows on / off, etc
    PIV.lightingRig.updateSceneMaterials = function () {
        console.log(PIV.scene);
        PIV.scene.traverse(function (child) {
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
    PIV.lightingRig.purge = function () {
        this.ambientLight = {};
        this.sunLight = {};
        this.pointLights = [];
    };
    
    
    
    PIV.views = {};

    //the active array of views
    PIV.views.viewList = [];

    //a bool to track whether or not views have been enabled by the user
    PIV.viewsEnabled = false;

    //function to get views from the active scene and populate our list of views
    PIV.views.getViews = function () {
        try {
            if (PIV.scene.userData.views.length > 0) {
                //create a default view

                PIV.views.defaultView.name = "DefaultView";
                PIV.views.viewList.push(PIV.views.defaultView);

                //add the views in the json file
                //if the project was exported from Revit, there is only one view
                if (PIV.scene.name.indexOf("BIM") != -1) {

                    var v = PIV.scene.userData.views.split(",");
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

                    for (var k = 0, kLen = PIV.scene.userData.views.length; k < kLen; k++) {
                        var itemView = PIV.scene.userData.views[k];
                        PIV.views.viewList.push(itemView);
                    }
                }
            }
        }
        catch (err) { }
    };

    //funciton to create the user interface for view selection
    PIV.views.CreateViewUI = function () {

        //if there are saved views, get their names and create a dat.GUI controller
        if (PIV.views.viewList.length > 0) {

            //get an array of all of the view names
            viewStrings = [];
            for (var i = 0; i < PIV.views.viewList.length; i++) {
                viewStrings.push(PIV.views.viewList[i].name);
            }
            viewStrings.sort();

            //set the first view to be the current view
            this.setView('DefaultView');

            //make sure the view and selection folder exists - if it doesn't, throw an error
            if (PIV.UIfolders.View_and_Selection === undefined) throw "View and selection folder must be initialized";

            //add the view dropdown, and call our reset view function on a change
            PIV.UIfolders.View_and_Selection.add(SPECT.uiVariables, 'view', viewStrings).onFinishChange(function (e) {
                PIV.views.resetView();
            });
        }
    };
    
   
    //function to set the current view
    PIV.views.setView = function (v) {
        if (this.viewList.length > 0) {
            PIV.uiVariables.view = v;
        }
    };

    //function to reset the view ... not sure why we need both - AGP?
    //function to reset the view ... not sure why we need both - AGP?
    PIV.views.resetView = function () {
        var vector = new THREE.Vector3(0, 0, 1);
        var up = vector.applyQuaternion(PIV.orbitControls.object.quaternion);

        //get the current camera by name
        var view;
        for (var i = 0; i < this.viewList.length; i++) {
            var v = this.viewList[i];
            if (v.name === PIV.uiVariables.view) {
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


            PIV.orbitControls.target.set(dir.x, dir.y, dir.z);
            PIV.orbitControls.object.position.set(eyePos.x, eyePos.y, eyePos.z);

        }
    };

    //function to purge the list of views
    PIV.views.purge = function () {
        //reset the list
        if (this.viewList.length > 0) this.viewList = [];

        try { //purge view controller
            var viewFolder = PIV.datGui.__folders.View_and_Selection;

            for (var i = 0; i < viewFolder.__controllers.length; i++) {
                if (viewFolder.__controllers[i].property == "view") {
                    viewFolder.__controllers[i].remove();
                    break;
                }
            }
        } catch (e) {
        }
    };
    PIV.views.defaultView = {};

    PIV.views.storeDefaultView = function () {
        PIV.views.defaultView.eye = {};
        PIV.views.defaultView.target = {};
        PIV.views.defaultView.eye.X = SPECT.orbitControls.object.position.x;
        PIV.views.defaultView.eye.Y = SPECT.orbitControls.object.position.y;
        PIV.views.defaultView.eye.Z = SPECT.orbitControls.object.position.z;
        PIV.views.defaultView.target.X = SPECT.orbitControls.target.x;
        PIV.views.defaultView.target.Y = SPECT.orbitControls.target.y;
        PIV.views.defaultView.target.Z = SPECT.orbitControls.target.z;

    };
    
    
    
    //*********************
    //*********************
    //*** Layers - [exported] objects can contain a user data attribute called 'layer' which we use to provide a layers interface.
    PIV.layers = {};

    //the active array of layers
    PIV.layers.layerList = [];

    //a bool to track whether or not layers have been enabled by the user
    PIV.layersEnabled = false;

    //function to get layers from the active scene and populate our list
    PIV.layers.getLayers = function () {
        try {
            if (PIV.scene.userData.layers.length > 0) {
                //if the project was exported from Revit
                if (PIV.scene.name.indexOf("BIM") != -1) {

                    var lay = PIV.scene.userData.layers.split(',');
                    PIV.layers.layerList = lay;

                }
                    //for Grasshopper files
                else {
                    for (var k = 0, kLen = PIV.scene.userData.layers.length; k < kLen; k++) {
                        var itemLayer = PIV.scene.userData.layers[k];
                        PIV.layers.layerList.push(itemLayer);
                    }
                }
            }
        }
        catch (err) { }
    };

    //function to create the user interface for view selection
    PIV.layers.CreateLayerUI = function () {
        //if there are saved layers, create a checkbox for each of them
        if (PIV.layers.layerList.length > 0) {
            layerStrings = [];
            for (var i = 0; i < PIV.layers.layerList.length; i++) {
                //for Grasshopper files, this will return the name of the layer
                var lName = PIV.layers.layerList[i].name;
                // for Revit files, this will be undefined. We need to grab the object itself
                if (lName == null) {
                    lName = PIV.layers.layerList[i];
                }
                if (lName != "Cameras") layerStrings.push(lName);
            }
            //sort layers by name
            layerStrings.sort();
            
            for (var i = 0; i < layerStrings.length; i++) {
                
                //create an layer object that has a boolean property with its name
                var layer = {};
                layer[layerStrings[i]] = true;
                PIV.layerStorage.push(layer);
                
                //add to global scope -- PIVOT --
                LAYERLIST=layerStrings;
                LAYERSTART=layer;
            }
        }
    };

    //function to purge the list of layers
    PIV.layers.purge = function () {
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
    
    PIV.layersUI = function () {
        PIV.layers.layersEnabled = true;
        if (PIV.layers.layerList.length !== 0) {
            PIV.layers.purge();
        }
        PIV.layers.getLayers();
        PIV.layers.CreateLayerUI();
    };
    
    
    
    //*******************Pulling in Global Variables and creating local ones//
    var scene = PIV.scene;
    var elements = PIV.attributes.elementList;
    var allAttributes;
    var orbitControls = PIV.orbitControls;
    var boundingSphere = PIV.boundingSphere;
    var camera = PIV.camera;
    var projector = PIV.attributes.projector;
    var container = document.getElementById('PIVOT_output');
    var children = container.children;
    var canvas = {};
    var sidebar = $("#sidebar").offcanvas({autohide: false, toggle:false});
    var sideList = document.getElementById("side");
    var filterBar = $("#filterbar").offcanvas({autohide:false, toggle:false});
    var filterList = document.getElementById("filters");
    var measureButton = document.getElementById("PIVOTmeasure");
    var populated;
    var picked;
    var pickedOriginal;
    var pickedL = [];
    var originalPickMats = [];
    var attributeSet;
    var originalMaterials = PIV.originalMaterials;
    var pickedMat = new THREE.MeshLambertMaterial({
            color: "rgb(0,255,255)",
            //ambient: "rgb(0,255,255)",
            side: 2
        });
    var scopes = [];
    var filterNames = [];
    var filterVals = [];
    var vertexList = []; 
    var measuring = false;
    var assemblyMode = false;
    var numMeasurePoints = 0;
    var spriteL = [];
    var geometry = new THREE.Geometry();
    var dataExport = [];
    var startDate;
    var endDate;
    var hideL = [];
    var hideMats = [];
    var hideMat = new THREE.MeshBasicMaterial({
            color: "rgb(200,200,200)",
            transparent: true,
            side:2,
            opacity: .5,
        });
    var timelineToggled = false;
    
    
    //PIV.layers.CreateLayerUI();
    //var dataElements = [];
    
    //var mainSlider = $("#dateSlider").bootstrapSlider({formatter: function(value){return 'Current Value: ' + value;}});
    //mainSlider.bootstrapSlider("enable");
    
    //PIV.lightingRig.shadowsOnOff(true);
//    var sunLight = new THREE.DirectionalLight(0xffffff, .8);
//    sunLight.castShadow = true;
//    SCENE.add(sunLight);
    
    PIV.attributes.purge = function () {
        this.elementList = [];
    };
    
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
    
    
    
    //**********HIGHLIGHTING NEAREST VERTEX WHEN MEASURING***************//
    container.onmousemove = function(e){
        e.preventDefault();
        //console.log(measuring);
        if(measuring ){
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
            mouse3D.unproject(PIV.camera);
            mouse3D.sub(PIV.camera.position);
            mouse3D.normalize();
            var raycaster = new THREE.Raycaster(PIV.camera.position, mouse3D);
            var intersects = raycaster.intersectObjects(elements);
            if(intersects[0]!==undefined){
                var intObj = intersects[0].object;
                var vertices = intObj.geometry.vertices;
                var location = intersects[0].point;
                var objList = [];
                for (i=0;i<vertices.length;i++){
                    var distance = vertices[i].distanceTo(location);
                    var distObj = { obj: vertices[i], dist: distance};
                    objList.push(distObj);
                }
                var sortObj = sortByKey(objList,"dist");
                var closeDist = sortObj[0].dist;
                var closeVertex = sortObj[0].obj;
                if(closeDist <= 1 && spriteL.length === 0 && numMeasurePoints<2){
                    var material = new THREE.SpriteMaterial({
                        color: 0xff0000
                    });
                    var pointMat = new THREE.PointsMaterial({
                        color: 0xff0000
                    });
                    sprite = new THREE.Sprite(material);
                    sprite.name = 'snap';
                    sprite.scale.set(.25, .25, 1);
                    sprite.position.copy(closeVertex);
                    intObj.add(sprite);
                    spriteL.push(sprite);
                }
                else{
                    //console.log("NOPE");
                    for(i=0;i<elements.length;i++){
                        if(elements[i].children.length>0){
                            for(j=0;j<elements[i].children.length;j++){
                                if (elements[i].children[j].name !== "KEEPER"){
                                    elements[i].remove(elements[i].children[j]);
                                }
                            }
                        }
                    }
                    spriteL = [];
                }
            }
            else{
                for(i=0;i<elements.length;i++){
                        if(elements[i].children.length>0){
                            for(j=0;j<elements[i].children.length;j++){
                                if (elements[i].children[j].name !== "KEEPER"){
                                    elements[i].remove(elements[i].children[j]);
                                }
                            }
                        }
                    }
                spriteL = [];
            }
        }
    }
    
    
    //***************************object selection**********************//
    
    container.onclick = function(e){
        e.preventDefault();
        //console.log(e.button);
        if(e.button === 0){
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
            mouse3D.unproject(PIV.camera);
            mouse3D.sub(PIV.camera.position);
            mouse3D.normalize();
            var raycaster = new THREE.Raycaster(PIV.camera.position, mouse3D);
            var intersects = raycaster.intersectObjects(elements);
            //********************If something was clicked on********************//
            if(!measuring){
                //If an object is selected, clear out any previsouly clicked items
                if(intersects[0] !== undefined){
                    if(intersects[0].object.material !== hideMat){
                        if(pickedL.length !==0){
                            for(i=0;i<pickedL.length;i++){
                                pickedL[i].material = originalPickMats[i];
                            }
                            pickedL = [];
                            originalPickMats = [];
                        }
                        if(picked !== undefined){
                            picked.material = pickedOriginal;
                            picked = undefined;
                            pickedOriginal = undefined;
                        }
                        //define picked item and store its current material
                        picked = intersects[0].object;
                        pickedOriginal = picked.material;
                        //toggle attributes bar
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
                        var attVals = [];
                        if(!assemblyMode){
                            picked.material = pickedMat;
                            for (var key in data) {
                                if (data.hasOwnProperty(key)) {
                                    //add the key value pair
                                    if (key !== "LINK") {
                                        var attribute = key+":"+data[key];
                                        var li = document.createElement("li");
                                        var link = document.createElement("a");
                                        var text = document.createTextNode(attribute);
                                        link.appendChild(text);
                                        li.appendChild(link);
                                        sideList.appendChild(li);                
                                    }
                                    else{
                                        var attribute = key+":"+data[key];
                                        var li = document.createElement("li");
                                        li.setAttribute("class","a-TDG-Hyperlink");
                                        var link = document.createElement("a");
                                        link.setAttribute("href",data[key]);
                                        link.setAttribute("target","_blank");
                                        var text = document.createTextNode("CLICK HERE FOR DETAIL");
                                        link.appendChild(text);
                                        link.setAttribute("id","LINK");
                                        //link.setAttribute("class","a-TDG-Hyperlink");
                                        link.onclick = function(){
                                            console.log(this.getAttribute("class"));
                                        }
                                        li.appendChild(link);
                                        sideList.appendChild(li);
                                    }
                                }
                            }
                        }
                        //if picking in assembly mode
                        else{
                            for(var key in data){
                                if (data.hasOwnProperty(key)){
                                    attVals.push(data[key]);
                                    if (key !== "LINK") {
                                        var attribute = key+":"+data[key];
                                        var li = document.createElement("li");
                                        var link = document.createElement("a");
                                        var text = document.createTextNode(attribute);
                                        link.appendChild(text);
                                        li.appendChild(link);
                                        sideList.appendChild(li);                
                                    }
                                    else{
                                        var attribute = key+":"+data[key];
                                        var li = document.createElement("li");
                                        li.setAttribute("class","a-TDG-Hyperlink");
                                        var link = document.createElement("a");
                                        link.setAttribute("href",data[key]);
                                        link.setAttribute("target","_blank");
                                        var text = document.createTextNode("CLICK HERE FOR DETAIL");
                                        link.appendChild(text);
                                        link.setAttribute("id","LINK");
                                        //link.setAttribute("class","a-TDG-Hyperlink");
                                        link.onclick = function(){
                                            console.log(this.getAttribute("class"));
                                        }
                                        li.appendChild(link);
                                        sideList.appendChild(li);
                                    }
                                }
                            }
                            //check if Item is part of assembly and for items within assembly i.e. with identical attributes
                            if(data.ASSEMBLY){
                                var objs = elements;
                                for(i=0;i<objs.length;i++){
                                    var tempL = [];
                                    var obj = objs[i];
                                    var objData = obj.userData;
                                    var objKeys = Object.keys(objData);
                                    for(var key in objData){
                                        if (objData.hasOwnProperty(key)){
                                            tempL.push(objData[key]);
                                        }   
                                    }
                                    if(attVals.toString() === tempL.toString()){
                                        pickedL.push(obj);
                                    }
                                }
                                console.log(pickedL.length);
                                for(i=0;i<pickedL.length;i++){
                                    originalPickMats.push(pickedL[i].material);
                                    pickedL[i].material = pickedMat;
                                }
                            }
                            //If item is not part of an assembly
                            else{
                                picked.material = pickedMat;
                            }
                        }
                    }
                }
                //If nothing was selected
                else if(intersects[0] === undefined && sideList.children.length > 0){
                    if(!assemblyMode){
                        //rendered();
                        picked.material = pickedOriginal;
                        picked = undefined;
                        while(sideList.children.length > 0){
                            sideList.removeChild(sideList.lastChild);
                        }
                        $("#sidebar").offcanvas("toggle");
                        //$(.side-toggle).click();
                        //$("#wrapper").toggleClass("toggled");
                        //$("#side").css.visibility = "visible"
                    }
                    else{
                        picked.material = pickedOriginal;
                        picked = undefined;
                        for(i=0;i<pickedL.length;i++){
                            pickedL[i].material = originalPickMats[i];
                        }
                        pickedL = [];
                        while(sideList.children.length > 0){
                            sideList.removeChild(sideList.lastChild);
                        }
                        $("#sidebar").offcanvas("toggle");
                    }
                }
            }
            //***************FOR MEASUREMENT PURPOSES*************//
            else{
                if(intersects[0]!==undefined){
                    var intObj = intersects[0].object;
                    var vertices = intObj.geometry.vertices;
                    var location = intersects[0].point;
                    var objList = [];
                    for (i=0;i<vertices.length;i++){
                        var distance = vertices[i].distanceTo(location);
                        var distObj = { obj: vertices[i], dist: distance};
                        objList.push(distObj);
                    }
                    var sortObj = sortByKey(objList,"dist");
                    var closeDist = sortObj[0].dist;
                    var closeVertex = sortObj[0].obj;
                    if(closeDist <= 1){
                        numMeasurePoints += 1;
                        if(numMeasurePoints <= 2){
                            var local = intObj.localToWorld(closeVertex);
                            vertexList.push(local);
                            geometry.vertices.push(closeVertex);
                            var material = new THREE.SpriteMaterial({
                                color: 0xff0000
                            });
                            sprite = new THREE.Sprite(material);
                            sprite.name = 'KEEPER';
                            sprite.scale.set(.25, .25, 1.0);
                            sprite.position.copy(closeVertex);
                            intObj.add(sprite);
                        spriteL.push(sprite);
                        }
                        if(numMeasurePoints === 2){
                            var DISTANCE = vertexList[0].distanceTo(vertexList[1]);
                            var feet = Math.floor(DISTANCE);
                            var inches = Math.round((DISTANCE-feet)*12);
                            window.alert("Distance : " + feet.toString()+"'"+inches.toString()+"\"");
                            for(i=0;i<elements.length;i++){
                                if(elements[i].children.length>0){
                                    for(j=0;j<elements[i].children.length;j++){
                                        elements[i].remove(elements[i].children[j]);
                                    }
                                }
                            }
                        }
                    }
                }
                if(numMeasurePoints === 2){
                    console.log(numMeasurePoints);
                    for(i=0;i<elements.length;i++){
                        if(elements[i].children.length > 0){
                            for(j=0;j<elements[i].children.length;j++){
                                elements[i].remove(elements[i].children[j]);
                            }
                        }
                    }
                    vertexList = [];
                    numMeasurePoints = 0;
                }
            }
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
        var layerTable = document.getElementById("layerTable");
        if (layerTable.childElementCount == 0) 
        {
            for (var i = 0; i < LAYERLIST.length; i++){
                var opt = LAYERLIST[i];                
                //table switch
                var tr = document.createElement("tr");
                var layerName = document.createElement("td");
                var visibility = document.createElement("td");
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                if(opt === "ANNOTATION"){
                    checkbox.checked = false;
                }
                else{
                    checkbox.checked = LAYERSTART;
                }
                checkbox.id = opt;
                checkbox.onclick = function(){
                    for (var i = 0; i < elements.length; i++){
                        var element = elements[i];
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
                visibility.appendChild(checkbox);
                visibility.setAttribute("class","centeredCheckbox");
                var a = document.createElement("a");
                var layerText = document.createTextNode(opt);
                layerName.appendChild(layerText);
                tr.appendChild(layerName);
                tr.appendChild(visibility);
                layerTable.appendChild(tr);
            }
        }
    }
    
    //**************ZOOM EXTENTS FUNCTION*************************//
    zoomExtents = function () {

//        if (BOUNDINGSPHERE === undefined) SPECT.computeBoundingSphere();

        //get the radius of the sphere and use it to compute an offset.  This is a mashup of theo's method
        //and the one we use in platypus
        var r = PIV.boundingSphere.radius;
        var offset = r / Math.tan(Math.PI / 180.0 * PIV.orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(PIV.orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.25);
        newPos.addVectors(PIV.boundingSphere.center, dir);
        PIV.orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        PIV.orbitControls.target = new THREE.Vector3(PIV.boundingSphere.center.x, PIV.boundingSphere.center.y, PIV.boundingSphere.center.z);
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
        var offset = r / Math.tan(Math.PI / 180.0 * PIV.orbitControls.object.fov * 0.5);
        var vector = new THREE.Vector3(0, 0, 1);
        var dir = vector.applyQuaternion(PIV.orbitControls.object.quaternion);
        var newPos = new THREE.Vector3();
        dir.multiplyScalar(offset * 1.1);
        newPos.addVectors(bndSphere.center, dir);
        PIV.orbitControls.object.position.set(newPos.x, newPos.y, newPos.z);
        PIV.orbitControls.target = new THREE.Vector3(bndSphere.center.x, bndSphere.center.y, bndSphere.center.z);

    };
    
    //****************CALL ZOOM EXTENTS WHEN MENU ITEM IS CLICKED************//
    document.getElementById("PIVOTzoomSelected").onclick = function(){
        zoomSelected();
    }
    
    //**********************HIDE SELECTED OBJECT****************************//
    hideSelected = function(){
        if(picked === undefined) return;
        
        picked.visible=false;
        hideL.push(picked);
        hideMats.push(pickedOriginal);
    }
    
    //****************CALL HIDE SELECTED WHEN MENU ITEM IS CLICKED*****************************************//
    document.getElementById("PIVOThideSelected").onclick = function(){
        hideSelected();
    }
    
    //*********************SHOW HIDDEN ITEMS****************************//
    showHidden = function(){
        for(i=0;i<hideL.length;i++){
            hideL[i].material = hideMats[i];
            hideL[i].visible = true;
        }
        hideL = [];
        hideMats = [];
    }
    
    //********************CALL SHOW HIDDEN WHEN MENU ITEM IS CLICKED***********************//
    document.getElementById("PIVOTshowHidden").onclick = function(){
        showHidden();
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
    document.getElementById("PIVOTcolorByAttribute").onclick = function(){
        var attTable = document.getElementById("attTable");
        var attModal = document.getElementById("attModal");
        while(attTable.children.length > 0){
            attTable.removeChild(attTable.lastChild);
        }
        CreateAttributeList();
        for (var i=0;i<attributeSet.length;i++){
            var attribute = attributeSet[i];
            
            //table instead of dropdown
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var a = document.createElement("a");
            a.href = "#";
            a.id = attribute;
            var tableText = document.createTextNode(attribute);
            a.appendChild(tableText);
            a.onclick = function(){
                colorByAttribute(this.id);
            }
            td.appendChild(a);
            tr.appendChild(td);
            tr.id = attribute;
            attTable.appendChild(tr);
        }
        //alert($("#content").width());
    }

    
//    document.getElementById("PIVOTcolorByAttribute").onclick = function(){
//        alert($("#content").width());
//    }

    //********************COLOR CODE BY ATTRIBUTE*************************//
    //Color Code by attribute (ADDED BY DG) Not project specific
    colorByAttribute = function(c){
        rendered();
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
        if(filterList.childElementCount === 0){
           createScopeList(); 
        }
        
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
                filteredSearch();
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
        var numFilt = ((filterList.childElementCount - 1)/2)+1;
        //console.log(numFilt);
        
        //FIRST DROPDOWN
        var dropdown  = document.createElement("li");
        var name = document.createTextNode("Filter");
        dropdown.setAttribute("class","dropdown");
        var a = document.createElement("a");
        a.appendChild(name);
        a.setAttribute("id","FILTERNAME");
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
        menu.setAttribute("class","dropdown-menu-TDG navmenu-nav");
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
        clicker.setAttribute("id","FILTERVAL");
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
        filterMenu.setAttribute("class","dropdown-menu-TDG navmenu-nav");
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
                while(targetMenu.childElementCount>0){
                    targetMenu.removeChild(targetMenu.lastChild);
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
                valSet.sort();
                //add values to filter val dropdown
                for(j=0;j<valSet.length;j++){
                    var filtText = document.createTextNode(valSet[j]);
                    var item = document.createElement("li");
                    var anchor = document.createElement("a");
                    anchor.setAttribute("href","#");
                    anchor.setAttribute("num",numFilt.toString());
                    anchor.appendChild(filtText);
                    anchor.onclick = function(){
                        var parentDrop= this.parentElement.parentElement.parentElement;
                        parentDrop.firstChild.innerHTML = this.innerHTML;
                        var spanUpdate = document.createElement("span");
                        spanUpdate.setAttribute("class","caret");
                        parentDrop.firstChild.appendChild(spanUpdate);
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
            //console.log(filterNames);
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
                dataExport.push(obj);
//                var tempMat = obj.material.clone();
//                tempMat.emissive.r = 0;
//                tempMat.emissive.g = 0;
//                tempMat.emissive.b = 10;
//                obj.material = tempMat;
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
    
    //*********************Create a Sprite at a Vertex****************************//
    createSprite = function(position){
        var material = new THREE.SpriteMaterial({
        color: 0xffffff
        });
        sprite = new THREE.Sprite(material);
        sprite.name = 'snap';
        sprite.scale.set(.1, .1, 1.0);
        sprite.position.copy(position);
        return sprite;
    }
    
    //********************Call Download ALL when menu clicked*******************************//
    document.getElementById("exportAll").onclick = function(){
        console.log("YO");
        downloadExcel(elements);
    }
    
    
    //**********************Call Download Filter on menuClick***************************//
    document.getElementById("exportVisible").onclick = function(){
        downloadExcel(dataExport);
    }
    //********************Download Excel************************************************//
    downloadExcel = function(l){
        CreateAttributeList();
        dataExport = [];
        var dataObjs;
        if(l.length === 0){
            dataObjs = elements;
            console.log("wrong");
        }
        else{
           dataObjs = l; 
        }
        
        var dataList = [];
        var tempList = [];
        //add first row of value names
        for(i=0;i<elements.length;i++){
            tempList.push(attributeSet[i]);
        }
        dataList.push(tempList);
        //console.log(dataList);
        //Add all attributes to file
        var objs = dataObjs;
        //var objs = SPECT.attributes.elementList;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var objKeys = Object.keys(objData);
            var valList = [];
            for(j=0;j<attributeSet.length;j++){
                var att = attributeSet[j];
                //console.log(att);
                var attribute = objData[attributeSet[j]];
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
    }
    //********************ADD VERTICES WHEN MEASURE BUTTON CLICKED*****************//
    measureButton.onclick = function(){
        if(measuring){
            $("#PIVOTmeasure").blur();
        }
        measuring = !measuring;
        if(!measuring){
            for(i=0;i<elements.length;i++){
                if(elements[i].children.length > 0){
                    for(j=0;j<elements[i].children.length;j++){
                        elements[i].remove(elements[i].children[j]);
                    }
                }
            }
        }
    }
    
    //*******************GENERATE START DATES FOR TIMELINE*************//
    var calendars = [];
    
    $('.input-daterange input').each(function() {
        if(calendars.length === 0){
            calendars.push($(this).datepicker({clearBtn:"true",autoclose:"true"}).on("changeDate",function(e){
                if(e.date !== undefined){
                    var month = e.date.getMonth() + 1;
                    var day = e.date.getDate().toString();
                    if(day.length === 1){
                        var realDay = "0"+day;
                    }
                    else{
                        var realDay = day;
                    }
                    var year = e.date.getYear() -100 +2000;
                    var date = year.toString()+"-"+month.toString()+"-"+realDay;
                    startDate = date;
                    console.log("start is " + startDate);
                    generateTimeline();
                    $("#dateSlider").bootstrapSlider("enable");
                }
                else{
                    startDate = undefined;
                    generateTimeline();
                    $("#dateSlider").bootstrapSlider("disable");
                }
            }));
        }
        else{
            calendars.push($(this).datepicker({clearBtn:"true",autoclose:"true"}).on("changeDate",function(e){
                if(e.date !== undefined){
                    var month = e.date.getMonth() + 1;
                    var day = e.date.getDate().toString();
                    if(day.length === 1){
                        var realDay = "0"+day;
                    }
                    else{
                        var realDay = day;
                    }
                    var year = e.date.getYear() -100 +2000;
                    var date = year.toString()+"-"+month.toString()+"-"+realDay;
                    endDate = date;
                    console.log("end is " + endDate);
                    generateTimeline();
                    $("#dateSlider").bootstrapSlider("enable");
                }
                else{
                    endDate = undefined;
                    generateTimeline();
                    $("#dateSlider").bootstrapSlider("disable");
                }
            }));
        }
    });
    
    //********************GENERATE SLIDER FROM TIMELINE DATES****************//

    generateTimeline = function(){
        if (startDate != undefined && endDate != undefined){
            var start = moment(startDate);
            var end = moment(endDate);
            var numDays = end.diff(start,"days");
            var itr = start.twix(end).iterate("days");
            var dayRange = [];
            while(itr.hasNext()){
                dayRange.push(itr.next().toDate());
            }
            
            var objs = elements;
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
                side: 2
            });
            
            //mainSlider.bootstrapSlider("enable");
            var sliderHolder = document.getElementById("sliderHolder");
            if (sliderHolder.childElementCount === 0){
                var baseSlider = document.createElement("input");
                baseSlider.setAttribute("id","dateSlider");
                baseSlider.setAttribute("data-slider-id","slider1");
                baseSlider.setAttribute("type","text");
                baseSlider.setAttribute("data-provide","slider");
                baseSlider.setAttribute("data-slider-min","0");
                baseSlider.setAttribute("data-slider-max",numDays.toString());
                baseSlider.setAttribute("data-slider","1");
                baseSlider.setAttribute("data-slider-value","0");
                baseSlider.setAttribute("style","width:500px; padding:20px");
                sliderHolder.appendChild(baseSlider);
                $("#dateSlider").bootstrapSlider({tooltip:'always',formatter: function(value){return 'Current Date: ' + dayRange[value].toString();}});
                $("#dateSlider").on("slide", function(e){
                    checkTimeline(e,dayRange);
                });
            }
            else{
                $("#dateSlider").bootstrapSlider('destroy');
                while(sliderHolder.childElementCount>0){
                    sliderHolder.removeChild(sliderHolder.lastChild);
                }
                var baseSlider = document.createElement("input");
                baseSlider.setAttribute("id","dateSlider");
                baseSlider.setAttribute("data-slider-id","slider1");
                baseSlider.setAttribute("type","text");
                baseSlider.setAttribute("data-provide","slider");
                baseSlider.setAttribute("data-slider-min","0");
                baseSlider.setAttribute("data-slider-max",numDays.toString());
                baseSlider.setAttribute("data-slider","1");
                baseSlider.setAttribute("data-slider-value","0");
                baseSlider.setAttribute("style","width:500px; padding:20px");
                sliderHolder.appendChild(baseSlider);
                $("#dateSlider").bootstrapSlider({tooltip:'always',formatter: function(value){return 'Current Date: ' + dayRange[value].toString();}});
                $("#dateSlider").on("slide", function(e){
                    checkTimeline(e,dayRange);
                });
            }
        }
        else{
            //mainSlider.bootstrapSlider("disable");
        }
    }
    
    //***************************Hide Elements based on Timeline***********//
    checkTimeline = function(v,list){
        var activeMat = new THREE.MeshLambertMaterial({
            color: "rgb(0,255,0)",
            side: 2,
            transparent: true,
            opacity:.5
        });
        var dayRange = list;
        var currentDate = dayRange[v.value];
        var dateString = currentDate.toISOString();
        var splitDate = dateString.split('T');
        var currentMoment = moment(splitDate[0]);
        var objs = elements;
        for(i=0;i<objs.length;i++){
            var obj = objs[i];
            var objData = obj.userData;
            var objStartDate = objData.START_DATE;
            var objEndDate = objData.END_DATE;
            var originalMat = originalMaterials[i];
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
                    obj.material = activeMat;
                }
                else{
                    obj.material = originalMat;
                }
            }
        }
    }
    
    //*************************DISPLAY/HIDE TIMELINE ON CLICK**************//
    var visibilityStates = [];
    var materialState = [];
    document.getElementById("toggleBottom").onclick = function(){
        if(timelineToggled === false){
            $("#bottomBar").css("visibility","visible");
            timelineToggled = true;
            var objs = elements;
            for(i=0;i<objs.length;i++){
                visibilityStates.push(objs[i].visible);
                materialState.push(objs[i].material);
            }
        }
        else{
            $("#bottomBar").css("visibility","hidden"); 
            timelineToggled = false;
            var objs = elements;
            for(i=0;i<objs.length;i++){
                objs[i].visible = visibilityStates[i];
                objs[i].material = materialState[i];
            }
        }
    }
    
     
    //*************************Toggle Assembly Selection On click**************//
    document.getElementById("PIVOTassembly").onclick = function(){
        if(assemblyMode){
            $("#PIVOTassembly").blur();
        }
        assemblyMode = !assemblyMode;
    }
    
    //*************************ADD CLIPPING PLANE****************************//
    addClippingPlane = function(axes){
//        var sphereGeo = new THREE.SphereGeometry(PIV.boundingSphere.radius);
//        var sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0.25}));
//        sphereMesh.position.set(PIV.boundingSphere.center.x,PIV.boundingSphere.center.y,PIV.boundingSphere.center.z);
//        PIV.scene.add(sphereMesh);
        if(axes === "xz"){
            var localPlane = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), (PIV.boundingSphere.center.y));
            for(i=0;i<elements.length;i++){
                var obj = elements[i];
                if(obj.hasOwnProperty("material")){
                    obj.material.clippingPlanes = [localPlane];
                    obj.material.clipShadows = true;
                }
            }
            PIV.renderer.localClippingEnabled = true;
            //PIV.scene.add(localPlane);
        }
    }
    
    //****************ADD CLIPPING PLANE WHEN MENU ITEM IS CLICKED***********//
//    document.getElementById("PIVOTplane").onclick = function(){
//        addClippingPlane("xz");
//    }
    
    //**************************INITIATE VIEWER******************************//
    initViewer(PIV.viewerDiv);
    
    if (jsonFileData !== undefined) {
        PIV.jsonLoader.loadSceneFromJson(jsonFileData);
        zoomExtents();
        //SPECT.views.storeDefaultView();
    }
    
    //************FOR DEMO PURPOSES ONLY*********************************//
    for(i=0;i<elements.length;i++){
        var obj = elements[i];
        var objData = obj.userData;
        var objLayer = objData.layer;
        if (objLayer === "ANNOTATION"){
            obj.visible = false;
        }
                
    }
    
    if (callback !== undefined) {
        try {
            callback(PIV);
        } catch (e) {
        }
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
//********************SORT ARRAY OF OBJECTS BY KEY*********************//
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}