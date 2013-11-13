var console = console || {
    log: function(msg){
        
    }
};

var clientLibraryManager = (function(jq,sources,specs){
    var jsLibraries = [];
    function toJSArray(param){
        if(param){
            return param.replace(/\[|\]/g,'').split(',');
        }
        else{
            return [];
        }
    };
    
    var loadedScripts = [];
    function loadScript(src, callback) {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = src;
        s.charset = 'utf-8';
        s.async = true;
    
        s.onreadystatechange = s.onload = function () {
            var state = s.readyState;
    
            if (!callback.done && (!state || /loaded|complete/.test(state))) {
                callback.done = true;
                callback(src);
            }
        };
    
        // use body if available. more safe in IE
        if(jq.inArray(src,loadedScripts<0)){
            loadedScripts.push(src);
            var head = document.body || document.head;
            head.appendChild(s);
        }
    }
    
    function JSLibrary(path,txtContent,xmlContent){
        var categories = toJSArray(xmlContent.attr('categories'));
        console.log('JSLibrary categories: '+categories.join(','));
        var dependencies = xmlContent.attr('dependencies');
        var hasDependencies = false;
        if(typeof dependencies !== 'undefined'){
            dependencies = toJSArray(dependencies);
            hasDependencies = dependencies.length>0;
        }
        
        txtContent = txtContent.split('\n');
        var base = jq.trim(txtContent[0].replace('#base=',''));

        var files = [];
        for(var i=1;i<txtContent.length;i++){
            var filePath = jq.trim(txtContent[i]);
            if(filePath != ''){
                filePath = path+'/'+base+'/'+filePath;
                files.push(filePath);
            }
        }
        
        return {
            files: files,
            path: path,
            loaded: false,
            categories: categories,
            dependencies: dependencies,
            hasDependencies: hasDependencies,
            loadedFiles: [],
            isA: function(categoryName){
                console.log('IsA for: '+categoryName+':'+this.categories.join(','));
                return jq.inArray(categoryName,categories)>=0;
            },
            load: function(callback){
                if(this.loaded){
                    console.log('Library at path: '+this.path+' already loaded.');
                    callback();
                    return;
                }
                var me = this;
                function loadLibraryFiles(){
                    var loadString = 'Loading library at: '+me.path+'\n';
                    for(var i=0;i<files.length;i++){
                        var file = files[i];
                        loadString += '\tLoading file '+file+'\n';
                        loadScript(file, function(url){
                            me.loadedFiles.push(url);
                            loadString += '\tFile '+url+' loaded.\n';
                            if(me.loadedFiles.length==me.files.length){
                                me.loaded = true;
                                loadString+='Library at: '+me.path+' loaded.\n';
                                
                                console.log(loadString);
                                callback();
                            }
                        });
                    }
                }
                
                if(this.hasDependencies){
                    console.log('Loading dependencies first: '+this.dependencies);
                    loadLibraries(this.dependencies,loadLibraryFiles);
                }
                else{
                    loadLibraryFiles();
                }
            }
        };
    };
    
    function getCategoryFromSpec(spec){
        return (spec.split('/')[1]).replace('test','').replace('\.js','');
    }
    
    var loadedSpecs = [];
    function loadSpecs(callback){
        jq(specs).each(function(index,spec){
            console.log('Loading spec: '+spec);
            loadScript(spec, function(){
                loadedSpecs.push(spec);
                console.log('Spec: '+spec+' loaded.');
            });
        });
        
        var interval = window.setInterval(function(){
            if(loadedSpecs.length==specs.length){
                window.clearInterval(interval);
                interval = undefined;
                console.log('All specs loaded');
                callback();
            }
            else{
                console.log(loadedSpecs.length+' from '+specs.length+' specs Loaded');
            }
        },100);
    }
    
    function cleanSources(){
        var result = [];
        for(var i=0;i<sources.length;i++){
            if(sources[i].indexOf('js\.txt')>0){
                result.push(sources[i]);
            }
        }
        
        return result;
    }
    
    function init(callback){
        var sources = cleanSources();
        jq.each(sources, function(index,source){
            jq.get(source, function(txtContent){
                var contentXml = source.replace('js.txt','.content.xml');
                var path = source.replace('/js\.txt','')
                jq.get(contentXml, function(data,status,response){
                    var jqData = jq(response.responseText).last();
                    console.log('Data from load: '+jqData.attr('categories'));
                    var xmlContent = jqData;
                    var jsLibrary = new JSLibrary(path,txtContent,xmlContent);
                    jsLibraries.push(jsLibrary);
                    
                    var allLibrariesInitialized = jsLibraries.length==sources.length;
                    if(allLibrariesInitialized){
                        console.log('All libraries initialized --> Load specs');
                        
                        loadSpecs(function(){
                            var interval = window.setInterval(function(){
                            console.log('Loading libraries '+librariesFromSpecs.length+' for specs.');
                            var loadingStatus = getLibrariesLoadingStatus(librariesFromSpecs);
                            if(loadingStatus.allLoaded){
                                window.clearInterval(interval);
                                interval = undefined;
                                callback();
                            }
                            else{
                                console.log(loadingStatus.loadedCounter+' from specs '+librariesFromSpecs.length+' libraries Loaded');
                            }
                        },500);
                        });
                    }
                });
            });
        });
    };
    
    function getJSLibrariesByCategories(categories,loadStatus){
        console.log('Called getJSLibrariesByCategories for categories: '+categories+' and loadStatus: '+loadStatus);
        var result = [];
        var categories = [].concat(categories);
        
        for(var i=0;i<categories.length;i++){
            var category = categories[i];
            for(var j=0;j<jsLibraries.length;j++){
                var jsLibrary = jsLibraries[j];
                console.log('Analyzing library at path: '+jsLibrary.path+' and from category: '+category+' and loadstatus: '+jsLibrary.loaded);
                if(jsLibrary.isA(category)){
                    console.log('Found library at path: '+jsLibrary.path+' and from category: '+category+' and loadstatus: '+jsLibrary.loaded);
                    if(typeof loadStatus==='undefined'){
                        result.push(jsLibrary);
                    }
                    else if(jsLibrary.loaded===loadStatus){
                        result.push(jsLibrary);
                    }
                }
            }
        }
        
        return result;
    }
    
    function getNotLoadedJSLibrariesByCategory(categories){
        return getJSLibrariesByCategories(categories,false);
    };
    
    function loadLibraries(categories,callback){
        var librariesToLoad = getNotLoadedJSLibrariesByCategory(categories);
        if(librariesToLoad.length==0){
            callback();
            return;
        }
        else{
            var loadedLibraries = [];
            jq(librariesToLoad).each(function(index,library){
                library.load(function(){
                    loadedLibraries.push(library);
                });
            });
            
            var interval = window.setInterval(function(){
                var loadingStatus = getLibrariesLoadingStatus(librariesToLoad);
                if(loadingStatus.allLoaded){
                    window.clearInterval(interval);
                    interval = undefined;
                    callback();
                }
                else{
                    console.log(loadingStatus.loadedCounter+' from '+librariesToLoad.length+' libraries Loaded');
                }
            },100);
        }
    }
    
    function getLibrariesLoadingStatus(librariesToLoad){
        var allLoaded = true;
        var loadedCounter = 0;
        for(var i=0;i<librariesToLoad.length;i++){
            if(librariesToLoad[i].loaded){
                loadedCounter++;
            }
            allLoaded = librariesToLoad[i].loaded && allLoaded;
        }
        
        return {allLoaded:allLoaded,loadedCounter:loadedCounter};
    }
    
    var librariesFromSpecs = [];
    
    return {
        load: function(categories,callback){
            console.log('Load called for categories: '+categories);
            librariesFromSpecs = librariesFromSpecs.concat(getJSLibrariesByCategories(categories));
            console.log('Libraries for categories: '+categories+' '+librariesFromSpecs.length);
            loadLibraries(categories,callback);
        },
        init: function(callback){
            console.log('Called init from clientLibraryManager');
            init(function(){
                console.log('Now running specs.');
                callback();
            });
        }
    }
    
})(jQuery,sources,specs);
