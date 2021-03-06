/*
 *  @module Game
 *  @desc Represents a Glue game
 *  @copyright (C) 2013 SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/game', [
    'glue',
    'glue/domready',
    'glue/math/vector',
    'glue/math/rectangle',
    'glue/event/system',
    'glue/loader',
    'glue/preloader'
], function (Glue, DomReady, Vector, Rectangle, Event, Loader, Preloader) {
    'use strict';
    var Sugar = Glue.sugar,
        win = null,
        doc = null,
        gameInfo,
        fps = 60,
        objects = [],
        addedObjects = [],
        removedObjects = [],
        addCallbacks = [],
        removeCallbacks = [],
        lastFrameTime = new Date().getTime(),
        canvas = null,
        canvasId,
        context2D = null,
        useDoubleBuffering = false,
        backBuffer = null,
        backBufferContext2D = null,
        canvasSupported = false,
        viewport = Rectangle(0, 0, 640, 480),
        canvasScale = {},
        isRunning = false,
        isPaused = false,
        debug = false,
        debugBar = null,
        fpsAccumulator = 0,
        fpsTicks = 0,
        fpsMaxAverage = 500000,
        useSort = true,
        sortType = 0,
        autoResize = true,
        smoothing = false,
        gameData = {},
        quickAccess = {},
        initCanvas = function () {
            canvas = document.getElementById(canvasId);
            // create canvas if it doesn't exist
            if (canvas === null) {
                canvas = document.createElement('canvas');
                canvas.id = canvasId;
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                if (document.getElementById('wrapper') !== null) {
                    document.getElementById('wrapper').appendChild(canvas);
                } else {
                    document.body.appendChild(canvas);
                }
            }
            resizeGame();
            if (canvas.getContext) {
                canvasSupported = true;
                context2D = canvas.getContext('2d');
                if (useDoubleBuffering) {
                    backBuffer = document.createElement('canvas');
                    backBuffer.width = canvas.width;
                    backBuffer.height = canvas.height;
                    backBufferContext2D = backBuffer.getContext('2d');
                }
                if (!smoothing) {
                    if (context2D.imageSmoothingEnabled) {
                        context2D.imageSmoothingEnabled = false;
                    }
                    if (context2D.webkitImageSmoothingEnabled) {
                        context2D.webkitImageSmoothingEnabled = false;
                    }
                    if (context2D.mozImageSmoothingEnabled) {
                        context2D.mozImageSmoothingEnabled = false;
                    }
                }
            }
            gameData = {
                canvas: canvas,
                context: useDoubleBuffering ? backBufferContext2D : context2D,
                backBufferCanvas: useDoubleBuffering ? backBuffer : canvas,
                canvasScale: canvasScale,
                viewport: viewport
            };
        },
        resizeGame = function () {
            var canvasRatio = canvas.height / canvas.width,
                windowRatio = window.innerHeight / window.innerWidth,
                width,
                height;

            if (!autoResize) {
                return;
            }

            if (windowRatio < canvasRatio) {
                height = window.innerHeight;
                width = height / canvasRatio;
            } else {
                width = window.innerWidth;
                height = width * canvasRatio;
            }

            canvasScale.x = width / viewport.width;
            canvasScale.y = height / viewport.height;
            if (useDoubleBuffering) {
                canvas.width = width;
                canvas.height = height;
            } else {
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            }
        },
        sort = function () {
            if (sortType === game.SORT_TYPE_STABLE) {
                Sugar.sort.stable.inplace(objects, function (a, b) {
                    return a.z - b.z;
                });
            } else {
                // default behavior
                objects.sort(function (a, b) {
                    return a.z - b.z;
                });
            }
        },
        cleanObjects = function () {
            var i;
            // loop objects array from end to start and remove null elements
            for (i = objects.length - 1; i >= 0; --i) {
                if (objects[i] === null) {
                    objects.splice(i, 1);
                }
            }
        },
        predraw = function () {
            if (useDoubleBuffering) {
                backBufferContext2D.clear(true);
            }
            context2D.clear(true);
        },
        postdraw = function () {},
        lastTime = new Date().getTime(),
        cumulativeTime = 0,
        minimumFps = 30,
        cycle = function (time) {
            var fps,
                component,
                avg,
                i,
                currentTime = new Date().getTime(),
                deltaT = currentTime - lastTime;

            if (canvasSupported) {
                lastTime = currentTime;
                cumulativeTime += deltaT;
                if (debug) {
                    fps = Math.round(1000 / (time - lastFrameTime), 2);
                    fpsAccumulator += fps;
                    ++fpsTicks;
                    avg = Math.round(fpsAccumulator / fpsTicks);
                    if (fpsAccumulator > fpsMaxAverage) {
                        fpsAccumulator = fpsTicks = 0;
                    }
                    debugBar.innerHTML = '<strong>Glue debug bar</strong>';
                    debugBar.innerHTML += '<br />version: 0.9.7';
                    debugBar.innerHTML += '<br />frame rate: ' + fps + ' fps';
                    debugBar.innerHTML += '<br />average frame rate: ' + avg + 'fps';
                    debugBar.innerHTML += '<br />objects: ' + objects.length;
                    if (gameInfo && gameInfo.name) {
                        debugBar.innerHTML += '<br />game name: ' + gameInfo.name;
                    }
                }
                gameData.deltaT = deltaT;
                gameData.fps = fps;
                gameData.avg = avg;
                while (cumulativeTime >= 1000 / 60) {
                    cumulativeTime -= 1000 / 60;
                    if (cumulativeTime > 1000 / minimumFps) {
                        // deplete cumulative time
                        while (cumulativeTime >= 1000 / 60) {
                            cumulativeTime -= 1000 / 60;
                        }
                    }
                    gameData.objectLength = objects.length;
                    for (i = 0; i < objects.length; ++i) {
                        component = objects[i];
                        if (!component) {
                            continue;
                        }
                        if (component.update && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                            component.update(gameData);
                        }
                    };
                }
                cleanObjects();
                if (useSort) {
                    sort();
                }
                predraw();
                for (i = 0; i < objects.length; ++i) {
                    component = objects[i];
                    if (!component) {
                        continue;
                    }
                    if (component.draw) {
                        component.draw(gameData);
                    }
                };
                postdraw();

                if (useDoubleBuffering) {
                    context2D.save();
                    context2D.scale(canvasScale.x, canvasScale.y);
                    context2D.drawImage(backBuffer, 0, 0);
                    context2D.restore();
                }
                lastFrameTime = time;
            }
            if (isRunning) {
                requestAnimationFrame(cycle);
            }
        },
        startup = function () {
            initCanvas();
            setupEventListeners();
            cycle(0);
        },
        pointerDown = function (e) {
            // console.log('Pointer down: ', e.position);
            var i,
                l,
                component;

            if (!isRunning) {
                return;
            }
            for (i = 0, l = objects.length; i < l; ++i) {
                component = objects[i];
                if (component && component.pointerDown && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                    component.pointerDown(e);
                }
            }
        },
        pointerMove = function (e) {
            //console.log('Pointer move: ', e.position);
            var i,
                l,
                component;

            if (!isRunning) {
                return;
            }
            for (i = 0, l = objects.length; i < l; ++i) {
                component = objects[i];
                if (component && component.pointerMove && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                    component.pointerMove(e);
                }
            }
        },
        pointerUp = function (e) {
            //console.log('Pointer up: ', e.position);
            var i,
                l,
                component;

            if (!isRunning) {
                return;
            }
            for (i = 0, l = objects.length; i < l; ++i) {
                component = objects[i];
                if (component.pointerUp && ((isPaused && component.updateWhenPaused) || !isPaused)) {
                    component.pointerUp(e);
                }
            }
        },
        addTouchPosition = function (e, n) {
            var touch = e.changedTouches[n];
            e.preventDefault();
            e.changedTouches[n].position = Vector(
                (touch.pageX - canvas.offsetLeft) / canvasScale.x, (touch.pageY - canvas.offsetTop) / canvasScale.y
            );
            e.changedTouches[n].worldPosition = e.changedTouches[n].position.clone();
            e.changedTouches[n].worldPosition.x += viewport.x;
            e.changedTouches[n].worldPosition.y += viewport.y;
            // add 'normal' position
            e.position = e.changedTouches[n].position.clone();
            e.worldPosition = e.changedTouches[n].position.clone();            
        },
        addMousePosition = function (e) {
            e.position = Vector(
                (e.clientX - canvas.offsetLeft) / canvasScale.x, (e.clientY - canvas.offsetTop) / canvasScale.y
            );
            e.worldPosition = e.position.clone();
            e.worldPosition.x += viewport.x;
            e.worldPosition.y += viewport.y;
        },
        touchStart = function (e) {
            var id, i;
            e.preventDefault();
            for (i = 0; i < e.changedTouches.length; ++i) {
                addTouchPosition(e, i);
            }
            pointerDown(e);
        },
        touchMove = function (e) {
            var id, i;
            e.preventDefault();
            for (i = 0; i < e.changedTouches.length; ++i) {
                addTouchPosition(e, i);
            }
            pointerMove(e);
        },
        touchEnd = function (e) {
            var id, i;
            e.preventDefault();
            for (i = 0; i < e.changedTouches.length; ++i) {
                addTouchPosition(e, i);
            }
            pointerUp(e);
        },
        mouseDown = function (e) {
            e.preventDefault();
            addMousePosition(e);
            pointerDown(e);
        },
        mouseMove = function (e) {
            e.preventDefault();
            addMousePosition(e);
            pointerMove(e);
        },
        mouseUp = function (e) {
            e.preventDefault();
            addMousePosition(e);
            pointerUp(e);
        },
        setupEventListeners = function () {
            // main input listeners
            canvas.addEventListener('touchstart', touchStart);
            canvas.addEventListener('touchmove', touchMove);
            canvas.addEventListener('touchend', touchEnd);
            canvas.addEventListener('mousedown', mouseDown);
            canvas.addEventListener('mousemove', mouseMove);
            canvas.addEventListener('mouseup', mouseUp);
            // automated test listeners
            Event.on('glue.pointer.down', pointerDown);
            Event.on('glue.pointer.move', pointerMove);
            Event.on('glue.pointer.up', pointerUp);

            // window resize listeners
            window.addEventListener('resize', resizeGame, false);
            window.addEventListener('orientationchange', resizeGame, false);

            // touch device listeners to stop default behaviour
            document.body.addEventListener('touchstart', function (e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
                if (e && e.stopPropagation) {
                    e.stopPropagation();
                }
                return false;
            });
            document.body.addEventListener('touchmove', function (e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
                if (e && e.stopPropagation) {
                    e.stopPropagation();
                }
                return false;
            });
        },
        shutdown = function () {
            canvas.removeEventListener('touchstart', touchStart);
            canvas.removeEventListener('touchmove', touchMove);
            canvas.removeEventListener('touchend', touchEnd);
            Event.off('glue.pointer.down', pointerDown);
            Event.off('glue.pointer.move', pointerMove);
            Event.off('glue.pointer.up', pointerUp);
            objects = [];
        },
        game = {
            SORT_TYPE_DEFAULT: 0,
            SORT_TYPE_STABLE: 1,
            setup: function (config, onReady) {
                DomReady(function () {
                    if (isRunning) {
                        throw ('Glue: The main game is already running');
                    }
                    isRunning = true;
                    win = window;
                    doc = win.document;
                    // config.canvas is mandatory
                    canvasId = config.canvas.id;
                    if (config.canvas.viewport) {
                        viewport = config.canvas.viewport;
                    }
                    if (config.game) {
                        gameInfo = config.game;
                    }
                    if (config.predraw) {
                        predraw = config.predraw;
                    }
                    if (config.postdraw) {
                        postdraw = config.postdraw;
                    }
                    if (config.develop && config.develop.debug) {
                        debug = true;
                        debugBar = document.createElement('div');
                        debugBar.id = 'debugBar';
                        document.body.appendChild(debugBar);
                    }
                    if (Sugar.isDefined(config.doubleBuffering)) {
                        useDoubleBuffering = config.doubleBuffering;
                    }
                    if (Sugar.isDefined(config.sort)) {
                        useSort = config.sort;
                    }
                    if (Sugar.isDefined(config.autoResize)) {
                        autoResize = config.autoResize;
                    }
                    if (Sugar.isDefined(config.minimumFps)) {
                        minimumFps = config.minimumFps;
                    }
                    if (Sugar.isDefined(config.sortType)) {
                        sortType = config.sortType;
                    }
                    if (config.asset && config.asset.path) {
                        Loader.setAssetPath(config.asset.path);
                        if (config.asset.image) {
                            Loader.setAssets(Loader.ASSET_TYPE_IMAGE, config.asset.image);
                        }
                        if (config.asset.audio) {
                            if (config.asset.audio.sprite) {
                                Loader.setAssets(Loader.ASSET_TYPE_AUDIOSPRITE, config.asset.audio.sprite);
                            }
                            Loader.setAssets(Loader.ASSET_TYPE_AUDIO, config.asset.audio);
                        }
                        if (config.asset.json) {
                            Loader.setAssets(Loader.ASSET_TYPE_JSON, config.asset.json);
                        }
                        if (config.asset.binary) {
                            Loader.setAssets(Loader.ASSET_TYPE_BINARY, config.asset.binary);
                        }
                        if (config.asset.spine) {
                            Loader.setAssets(Loader.ASSET_TYPE_SPINE, config.asset.spine);
                        }
                        if (config.asset.remoteImage) {
                            Loader.setAssets(Loader.ASSET_TYPE_IMAGE_REMOTE, config.asset.remoteImage);
                        }
                        Loader.load(function () {
                            Preloader.onReady();
                            startup();
                            if (onReady) {
                                onReady();
                            }
                        }, Preloader.onAssetLoad);
                    } else {
                        startup();
                        if (onReady) {
                            onReady();
                        }
                    }
                });
            },
            shutdown: function () {
                shutdown();
                isRunning = false;
            },
            add: function (object) {
                var i, type;
                object.z = object.z || 0;
                objects.push(object);
                if (object.init) {
                    object.init();
                }
                // add object to access pools
                if (object.family) {
                    for (i = 0; i < object.family.length; ++i) {
                        type = object.family[i];
                        if (!quickAccess[type]) {
                            quickAccess[type] = [];
                        }
                        quickAccess[type].push(object);
                    }
                }
            },
            remove: function (object) {
                var i, type, index;
                if (!object) {
                    return;
                }
                index = objects.indexOf(object);
                if (index >= 0) {
                    objects[index] = null;
                    if (Sugar.isFunction(object.destroy)) {
                        object.destroy();
                    }
                }
                // remove from access pools
                if (object.family) {
                    for (i = 0; i < object.family.length; ++i) {
                        type = object.family[i];
                        Sugar.removeObject(quickAccess[type], object);
                    }
                }
            },
            removeAll: function (removeGlobal) {
                var i,
                    object;
                for (i = 0; i < objects.length; ++i) {
                    object = objects[i];
                    if (!object) {
                        continue;
                    }
                    if (!object.global || removeGlobal) {
                        this.remove(object);
                    }
                }
            },
            get: function (componentName) {
                var i,
                    l,
                    component,
                    name;

                for (i = 0, l = objects.length; i < l; ++i) {
                    component = objects[i];
                    if (!component) {
                        continue;
                    }
                    name = component.getName();
                    if (!Sugar.isEmpty(name) && name === componentName) {
                        return component;
                    }
                }
                return null;
            },
            getByName: function (componentName) {
                var i,
                    component,
                    name,
                    array = [];

                for (i = 0; i < objects.length; ++i) {
                    component = objects[i];
                    if (!component) {
                        continue;
                    }
                    name = component.getName();
                    if (!Sugar.isEmpty(name) && name === componentName) {
                        array.push(component);
                    }
                }
                return array;
            },
            getByFamily: function (type) {
                var array = quickAccess[type];
                return array ? array : [];
            },
            canvas: {
                getViewport: function () {
                    return viewport;
                },
                getScale: function () {
                    return canvasScale;
                },
                getContext: function () {
                    return useDoubleBuffering ? context : backBufferContext2D;
                }
            },
            getObjectCount: function () {
                return objects.length;
            },
            pause: function (force) {
                isPaused = true;
                isRunning = !force;
            },
            resume: function () {
                isPaused = false;
                if (!isRunning) {
                    isRunning = true;
                    startup();
                }
            }
        };
    return game;
});