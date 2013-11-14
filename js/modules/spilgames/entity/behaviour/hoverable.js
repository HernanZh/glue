/*
 *  @module Hoverable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity hoverable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/hoverable',
    [
        'glue'
    ],
    function (Glue) {
        /**
         * Constructor
         * @memberOf hoverable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            var isHovering = false,
                hoverOverCalled = false,
                hoverOutCalled = false,
                /**
                 * Listens the POINTER_DOWN event
                 * @name onPointerMove
                 * @memberOf hoverable
                 * @function
                 * @param {Object} evt: The pointer event
                 */
                onPointerDown = function (evt) {
                    var pointerPosition = {
                        x: evt.gameX,
                        y: evt.gameY
                    };
                    if (pointerPosition.x >= (me.game.viewport.pos.x + obj.pos.x) && 
                        pointerPosition.x <= (me.game.viewport.pos.x + obj.pos.x + obj.width) &&
                        pointerPosition.y >= (me.game.viewport.pos.y + obj.pos.y) && 
                        pointerPosition.y <= (me.game.viewport.pos.y + obj.pos.y + obj.height)) {
                        isHovering = true;
                        if (obj.hoverOver && !hoverOverCalled) {
                            hoverOverCalled = true;
                            hoverOutCalled = false;
                            obj.hoverOver(evt);
                        }
                    } else {
                        isHovering = false;
                        if (obj.hoverOut && !hoverOutCalled) {
                            hoverOutCalled = true;
                            hoverOverCalled = false;
                            obj.hoverOut(evt);
                        }
                    }
                },
                /**
                 * Sets up all events for this module
                 * @name setupEvents
                 * @memberOf hoverable
                 * @function
                 */
                setupEvents = function () {
                    Glue.event.on(Glue.input.POINTER_DOWN, onPointerDown);
                },
                /**
                 * Tears down all events for this module
                 * @name teardownEvents
                 * @memberOf hoverable
                 * @function
                 */
                tearDownEvents = function () {
                    Glue.event.off(Glue.input.POINTER_DOWN, onPointerDown);
                };

            // setup the module events
            setupEvents();

            return obj.mix({
                isHovering: function () {
                    return isHovering;
                },
                /**
                 * Can be used to destruct this entity
                 * @name isPressed
                 * @memberOf hoverable
                 * @function
                 */
                destructHoverable: function () {
                    tearDownEvents();
                }
            });
        };
    }
);
