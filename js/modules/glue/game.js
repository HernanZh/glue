/*
 *  @module Game
 *  @desc Represents a Glue game
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/game',
    [
        'glue',
        'glue/domready',
        'glue/math/vector',
        'glue/event/system',
        'glue/loader'
    ],
    function (Glue, DomReady, Vector, Event, Loader) {
        'use strict';
        var Sugar = Glue.sugar,
            win = null,
            doc = null,
            gameInfo,
            fps = 60,
            objects = [],
            addedObjects = [],
            removedObjects = [],
            lastFrameTime = new Date().getTime(),
            canvas = null,
            canvasId,
            context2D = null,
            backBuffer = null,
            backBufferContext2D = null,
            canvasSupported = false,
            canvasDimension = null,
            canvasScale = {},
            scroll = Vector(0, 0),
            isRunning = false,
            debug = false,
            debugBar = null,
            fpsAccumulator = 0,
            fpsTicks = 0,
            fpsMaxAverage = 500000,
            useSort = true,
            sortType = 0,
            stable = (function() {
                // https://github.com/Two-Screen/stable
                // A stable array sort, because `Array#sort()` is not guaranteed stable.
                // This is an implementation of merge sort, without recursion.
                var stable = function(arr, comp) {
                    return exec(arr.slice(), comp);
                };

                stable.inplace = function(arr, comp) {
                    var result = exec(arr, comp);

                    // This simply copies back if the result isn't in the original array,
                    // which happens on an odd number of passes.
                    if (result !== arr) {
                        pass(result, null, arr.length, arr);
                    }

                    return arr;
                };

                // Execute the sort using the input array and a second buffer as work space.
                // Returns one of those two, containing the final result.
                function exec(arr, comp) {
                    if (typeof(comp) !== 'function') {
                        comp = function(a, b) {
                            return String(a).localeCompare(b);
                        };
                    }

                    // Short-circuit when there's nothing to sort.
                    var len = arr.length;
                    if (len <= 1) {
                        return arr;
                    }

                    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
                    // Chunks are the size of the left or right hand in merge sort.
                    // Stop when the left-hand covers all of the array.
                    var buffer = new Array(len);
                    for (var chk = 1; chk < len; chk *= 2) {
                        pass(arr, comp, chk, buffer);

                        var tmp = arr;
                        arr = buffer;
                        buffer = tmp;
                    }

                    return arr;
                }

                // Run a single pass with the given chunk size.
                var pass = function(arr, comp, chk, result) {
                    var len = arr.length;
                    var i = 0;
                    // Step size / double chunk size.
                    var dbl = chk * 2;
                    // Bounds of the left and right chunks.
                    var l, r, e;
                    // Iterators over the left and right chunk.
                    var li, ri;

                    // Iterate over pairs of chunks.
                    for (l = 0; l < len; l += dbl) {
                        r = l + chk;
                        e = r + chk;
                        if (r > len) r = len;
                        if (e > len) e = len;

                        // Iterate both chunks in parallel.
                        li = l;
                        ri = r;
                        while (true) {
                            // Compare the chunks.
                            if (li < r && ri < e) {
                                // This works for a regular `sort()` compatible comparator,
                                // but also for a simple comparator like: `a > b`
                                if (comp(arr[li], arr[ri]) <= 0) {
                                    result[i++] = arr[li++];
                                }
                                else {
                                    result[i++] = arr[ri++];
                                }
                            }
                            // Nothing to compare, just flush what's left.
                            else if (li < r) {
                                result[i++] = arr[li++];
                            }
                            else if (ri < e) {
                                result[i++] = arr[ri++];
                            }
                            // Both iterators are at the chunk ends.
                            else {
                                break;
                            }
                        }
                    }
                };
                // Export using CommonJS or to the window.
                /*if (typeof(module) !== 'undefined') {
                    module.exports = stable;
                }
                else {
                    window.stable = stable;
                }*/
                // return it instead and keep the method local to this scope
                return stable;
            })(),
            initCanvas = function () {
                canvas = document.querySelector('#' + canvasId);
                // create canvas if it doesn't exist
                if (canvas === null) {
                    canvas = document.createElement('canvas');
                    canvas.id = canvasId;
                    canvas.width = canvasDimension.width;
                    canvas.height = canvasDimension.height;
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
                    backBuffer = document.createElement('canvas');
                    backBuffer.width = canvas.width;
                    backBuffer.height = canvas.height;
                    backBufferContext2D = backBuffer.getContext('2d');
                }
            },
            resizeGame = function () {
                var canvasRatio = canvas.height / canvas.width,
                    windowRatio = window.innerHeight / window.innerWidth,
                    width,
                    height;

                if (windowRatio < canvasRatio) {
                    height = window.innerHeight;
                    width = height / canvasRatio;
                } else {
                    width = window.innerWidth;
                    height = width * canvasRatio;
                }

                canvasScale.x = width / canvasDimension.width;
                canvasScale.y = height / canvasDimension.height;

                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            },
            sort = function () {
                if (sortType === game.SORT_TYPE_STABLE) {
                    stable.inplace(objects, function (a, b) {
                        return a.z > b.z;
                    });
                } else {
                    // default behavior
                    objects.sort(function (a, b) {
                        return a.z - b.z;
                    });
                }
            },
            addObjects = function () {
                var object;
                if (addedObjects.length) {
                    for (var i = 0; i < addedObjects.length; ++i) {
                        object = addedObjects[i];
                        objects.push(addedObjects[i]);
                        if (object.init) {
                            object.init();
                        }
                    };
                    addedObjects = [];
                }
            },
            removeObjects = function () {
                var object;
                if (removedObjects.length) {
                    for (var i = 0; i < removedObjects.length; ++i) {
                        object = removedObjects[i];
                        if (object.destroy) {
                            object.destroy();
                        }
                        Sugar.removeObject(objects, object);
                    };
                    removedObjects = [];
                }
            },
            redraw = function () {
                backBufferContext2D.clear(true);
                context2D.clear(true);
            },
            cycle = function (time) {
                var deltaT,
                    fps,
                    component,
                    avg;

                if (isRunning) {
                    requestAnimationFrame(cycle);
                }
                if (canvasSupported) {
                    redraw();
                    removeObjects();
                    addObjects();

                    deltaT = (time - lastFrameTime) / 1000;
                    if (debug) {
                        fps = Math.round(1000 / (time - lastFrameTime), 2);
                        fpsAccumulator += fps;
                        ++fpsTicks;
                        avg = Math.round(fpsAccumulator / fpsTicks);
                        if (fpsAccumulator > fpsMaxAverage) {
                            fpsAccumulator = fpsTicks = 0;
                        }
                        debugBar.innerHTML = '<strong>Glue debug bar</strong>';
                        debugBar.innerHTML += '<br />version: 0.9.5';
                        debugBar.innerHTML += '<br />frame rate: ' + fps + ' fps';
                        debugBar.innerHTML += '<br />average frame rate: ' + avg + 'fps';
                        debugBar.innerHTML += '<br />objects: ' + objects.length;
                        if (gameInfo && gameInfo.name) {
                            debugBar.innerHTML += '<br />game name: ' + gameInfo.name;    
                        }
                    }
                    if (useSort) {
                        sort();
                    }
                    if (deltaT < 1) {
                        for (var i = 0; i < objects.length; ++i) {
                            component = objects[i];
                            if (component.update) {
                                component.update(deltaT, scroll);
                            }
                            if (component.draw) {
                                component.draw(deltaT, backBufferContext2D, scroll);
                            }
                        };
                    }
                    context2D.drawImage(backBuffer, 0, 0);
                    lastFrameTime = time;
                }
            },
            startup = function () {
                initCanvas();
                setupEventListeners();
                cycle(0);
            },
            pointerDown = function (e) {
                //console.log('Pointer down: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = objects.length; i < l; ++i) {
                    component = objects[i];
                    if (component.pointerDown) {
                        component.pointerDown(e);
                    }
                }
            },
            pointerMove = function (e) {
                //console.log('Pointer move: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = objects.length; i < l; ++i) {
                    component = objects[i];
                    if (component.pointerMove) {
                        component.pointerMove(e);
                    }
                }
            },
            pointerUp = function (e) {
                //console.log('Pointer up: ', e.position);
                var i,
                    l,
                    component;

                for (i = 0, l = objects.length; i < l; ++i) {
                    component = objects[i];
                    if (component.pointerUp) {
                        component.pointerUp(e);
                    }
                }
            },
            addTouchPosition = function (e, isTouchEnd) {
                var touch = !isTouchEnd ? e.targetTouches[0] : e.changedTouches[0];
                e.preventDefault();
                e.position = Vector(
                    (touch.pageX - canvas.offsetLeft) / canvasScale.x,
                    (touch.pageY - canvas.offsetTop) / canvasScale.y
                );
            },
            addMousePosition = function (e) {
                e.position = Vector(
                    (e.clientX - canvas.offsetLeft) / canvasScale.x,
                    (e.clientY - canvas.offsetTop) / canvasScale.y
                );
            },
            touchStart = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerDown(e);
            },
            touchMove = function (e) {
                e.preventDefault();
                addTouchPosition(e);
                pointerMove(e);
            },
            touchEnd = function (e) {
                e.preventDefault();
                addTouchPosition(e, true);
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
                if ('ontouchstart' in win) {
                    canvas.addEventListener('touchstart', touchStart);
                    canvas.addEventListener('touchmove', touchMove);
                    canvas.addEventListener('touchend', touchEnd);
                } else {
                    canvas.addEventListener('mousedown', mouseDown);
                    canvas.addEventListener('mousemove', mouseMove);
                    canvas.addEventListener('mouseup', mouseUp);
                }
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
            },
            game = {
                SORT_TYPE_DEFAULT: 0,
                SORT_TYPE_STABLE: 1,
                setup: function (config, onReady) {
                    DomReady(function () {
                        if (isRunning) {
                            throw('Glue: The main game is already running');
                        }
                        isRunning = true;
                        win = window;
                        doc = win.document;
                        // config.canvas is mandatory
                        canvasId = config.canvas.id;
                        canvasDimension = config.canvas.dimension;
                        if (config.game) {
                            gameInfo = config.game;
                        }
                        if (config.develop && config.develop.debug) {
                            debug = true;
                            debugBar = document.createElement('div');
                            debugBar.id = 'debugBar';
                            document.body.appendChild(debugBar);
                        }
                        if (Sugar.isDefined(config.sort)) {
                            useSort = config.sort;
                        }
                        if (Sugar.isDefined(config.sortType)) {
                            sortType = config.sortType;
                        }
                        /*
                        // save color in variable and move code before calling other draw functions
                        if (config.canvas.color) {
                            backBufferContext2D.fillStyle = config.canvas.color;
                            backBufferContext2D.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        */
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
                            Loader.load(function () {
                                startup();
                                if (onReady) {
                                    onReady();
                                }
                            });
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
                add: function (component) {
                    addedObjects.push(component);
                },
                remove: function (component) {
                    removedObjects.push(component);
                },
                get: function (componentName) {
                    var i,
                        l,
                        component,
                        name;

                    for (i = 0, l = objects.length; i < l; ++i) {
                        component = objects[i];
                        name = component.getName();
                        if (!Sugar.isEmpty(name) && name === componentName) {
                            return component;
                        }
                    }
                },
                canvas: {
                    getDimension: function () {
                        return canvasDimension;
                    },
                    getScale: function () {
                        return canvasScale;
                    },
                    getContext: function () {
                        return backBufferContext2D;
                    }
                },
                getObjectCount: function () {
                    return objects.length;
                },
                getScroll: function () {
                    return scroll;
                }
            };
        return game;
    }
);
