/**
 *  @module Director
 *  @desc Directs a game
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/director',
    [
        'glue',
        'glue/game',
        'glue/screen'
    ],
    function (Glue, Game, Screen) {
        'use strict';
        var Sugar = Glue.sugar,
            screens = {},
            activeScreen = null,
            getScreen = function (name) {
                if (Sugar.isString(name)) {
                    if (Sugar.isObject(screens[name])) {
                        return screens[name]
                    }
                }
            },
            toggleScreen = function (name, action) {
                var screen,
                    objects,
                    i = 0,
                    l;

                if (Sugar.isString(name)) {
                    screen = getScreen(name);
                    if (action === 'show') {
                        Game.add(screen);
                        screen.setShown(true);
                    }
                    if (action === 'hide') {
                        Game.remove(screen);
                        screen.setShown(false);
                    }
                    objects = screen.getObjects();
                    l = objects.length;
                    for (i; i < l; ++i) {
                        if (action === 'show') {
                            Game.add(objects[i]);
                        } else if (action === 'hide') {
                            Game.remove(objects[i]);
                        }
                    }
                    if (action === 'show') {
                        activeScreen = screen;
                    }
                }
            },
            module = {
                /**
                 * Add a screen to the Director
                 * @name addScreen
                 * @memberOf Director
                 * @function
                 */
                addScreen: function (screen) {
                    if (Sugar.isFunction(screen.getName) && Sugar.isObject(screen)) {
                        screens[screen.getName()] = screen;
                    }                    
                },
                /**
                 * Remove a screen from the Director
                 * @name removeScreen
                 * @memberOf Director
                 * @function
                 */
                removeScreen: function (screen) {
                    var screenName;
                    if (Sugar.isFunction(screen.getName) && Sugar.isObject(screen)) {
                        screenName = screen.getName();
                        toggleScreen(screenName, 'hide');
                    }
                    if (Sugar.isObject(screens[screenName])) {
                        delete screens[screenName];
                    }
                },
                /**
                 * Get all screens that are added to the Director
                 * @name getScreens
                 * @memberOf Director
                 * @function
                 */
                getScreens: function () {
                    return screens;
                },
                /**
                 * Show a screen
                 * @name showScreen
                 * @memberOf Director
                 * @function
                 */
                showScreen: function (name) {
                    var activeScreenName;
                    if (Sugar.isString(name)) {
                        if (activeScreen !== null) {
                            activeScreenName = activeScreen.getName();
                            toggleScreen(activeScreenName, 'hide');    
                        }
                        toggleScreen(name, 'show');
                    }
                },
                /**
                 * Hide a screen
                 * @name hideScreen
                 * @memberOf Director
                 * @function
                 */
                hideScreen: function (name) {
                    if (Sugar.isString(name)) {
                        toggleScreen(name, 'hide');
                    }
                }
            };

        return module;
    }
);
