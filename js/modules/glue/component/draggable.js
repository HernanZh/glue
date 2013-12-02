/*
 *  @module Draggable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity draggable
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/draggable',
    [
        'glue',
        'glue/math/vector',
        'glue/event/system'
    ],
    function (Glue, Vector, Event) {
        var draggables = [],
            dragStartTimeout = 30;

        return function (obj) {
            var dragging = false,
                dragId,
                // TODO: Change to Glue Vector
                grabOffset = {
                    x: 0,
                    y: 0
                },
                isHeighestDraggable = function (obj) {
                    var i = 0,
                        l = draggables.length,
                        draggable,
                        result = true;

                    for (i; i < l; ++i) {
                        draggable = draggables[i];
                        if (draggable !== obj && draggable.visible.z > obj.visible.z) {
                            result = false;
                            break;
                        }
                    }
                    return result;
                },
                checkOnMe = function (e) {
                    var position = e.position.get(),
                        boundingBox = obj.visible.getBoundingBox();

                    // TODO: abstract this to overlaps utility method
                    if (position.x >= boundingBox.left && position.x <= boundingBox.right &&
                        position.y >= boundingBox.top && position.y <= boundingBox.bottom) {
                        return true;
                    }
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    var pointerPostion,
                        objectPosition;

                    if (checkOnMe(e) && dragging === false) {
                        draggables.push(obj);
                        setTimeout(function () {
                            if (isHeighestDraggable(obj)) {
                                pointerPosition = e.position.get();
                                objectPosition = obj.visible.getPosition();
                                dragging = true;
                                dragId = e.pointerId;
                                grabOffset = {
                                    x: pointerPosition.x - objectPosition.x,
                                    y: pointerPosition.y - objectPosition.y
                                };
                                if (obj.dragStart) {
                                    obj.dragStart(e);
                                }
                                return false;
                            }
                        }, dragStartTimeout);
                    }
                },
                /**
                 * Gets called when the user drags this entity around
                 * @name dragMove
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragMove = function (e) {
                    var pointerPosition = e.position.get();
                    if (dragging === true) {
                        if (dragId === e.pointerId) {
                            obj.visible.setPosition(Vector(
                                pointerPosition.x - grabOffset.x,
                                pointerPosition.y - grabOffset.y
                            ));
                            if (obj.dragMove) {
                                obj.dragMove(e);
                            }
                        }
                    }
                },
                /**
                 * Gets called when the user stops dragging the entity
                 * @name dragEnd
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragEnd = function (e) {
                    if (dragging === true) {
                        Event.fire('draggable.drop', obj, e);
                        draggables = [];
                        dragId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e, function () {});
                        }
                        return false;
                    }
                };

            obj = obj || {};
            obj.draggable = {
                setup: function (settings) {

                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    dragStart(e);
                },
                pointerMove: function (e) {
                    dragMove(e);
                },
                pointerUp: function (e) {
                    dragEnd(e);
                },
                dragStartTimeout: function (value) {
                    dragStartTimeout = value;
                }
            };
            return obj;
        };
    }
);
