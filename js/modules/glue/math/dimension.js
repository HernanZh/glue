/**
 *  Deprecated
 */
glue.module.create('glue/math/dimension', ['glue/math/rectangle'], function (Rectangle) {
    'use strict';
    return function (width, height) {
        return Rectangle(0, 0, width, height);
    };
});