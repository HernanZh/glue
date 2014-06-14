/**
 *  @module Director
 *  @desc Directs a game
 *  @copyright (C) SpilGames
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
            viewport = Game.canvas.getViewport(),
            screens = {},
            activeScreen = null,
            getScreen = function (name) {
                return screens[name];
            },
            module = {
                /**
                 * Add a screen to the Director
                 * @name addScreen
                 * @memberOf Director
                 * @function
                 */
                addScreen: function (screen) {
                    if (!screen.getName()) {
                        throw 'Add name property to screen'
                    }
                    screens[screen.getName()] = screen;
                },
                /**
                 * Show a screen
                 * @name showScreen
                 * @memberOf Director
                 * @function
                 */
                showScreen: function (name, callback) {
                    if (activeScreen !== null) {
                        this.hideScreen();
                    }
                    activeScreen = screens[name];
                    if (activeScreen) {
                        activeScreen.onShow();
                    } else {
                        throw 'Could not find screen';
                    }
                },
                /**
                 * Hides current screen
                 * @name hideScreen
                 * @memberOf Director
                 * @function
                 */
                hideScreen: function () {
                    if (!activeScreen) {
                        return;
                    }
                    activeScreen.onHide();
                    activeScreen = null;
                    // reset viewport scroll when hiding screen
                    viewport.x = 0;
                    viewport.y = 0;
                },
                /*
                 * Get the active screen
                 * @name getActiveScreen
                 * @memberOf Director
                 * @function
                 */
                getActiveScreen: function () {
                    return activeScreen;
                }
            };

        return module;
    }
);
