/**
 *  @module Rectangle
 *  @namespace math
 *  @desc Represents a rectangle
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/rectangle', ['glue'], function (Glue) {
    'use strict';
    var Sugar = Glue.sugar,
        module;
    module = function (x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height,
            getX2: function () {
                return this.x + this.width;
            },
            getY2: function () {
                return this.y + this.height;
            },
            union: function (rectangle) {
                var x1 = Math.min(this.x, rectangle.x),
                    y1 = Math.min(this.y, rectangle.y),
                    x2 = Math.max(this.getX2(), rectangle.getX2()),
                    y2 = Math.max(this.getY2(), rectangle.getY2());
                return module(x1, y1, x2 - x1, y2 - y1);
            },
            intersect: function (rectangle) {
                if (Sugar.isPolygon(rectangle)) {
                    return rectangle.intersect(this);
                } else {
                    return !(this.x + this.width <= rectangle.x ||
                        this.y + this.height <= rectangle.y ||
                        this.x >= rectangle.x + rectangle.width ||
                        this.y >= rectangle.y + rectangle.height);
                }
            },
            intersection: function (rectangle) {
                var inter = module(0, 0, 0, 0);
                if (this.intersect(rectangle)) {
                    inter.x = Math.max(this.x, rectangle.x);
                    inter.y = Math.max(this.y, rectangle.y);
                    inter.width = Math.min(this.x + this.width, rectangle.x + rectangle.width) - inter.x;
                    inter.height = Math.min(this.y + this.height, rectangle.y + rectangle.height) - inter.y;
                }
                return inter;
            },
            offset: function (pos) {
                return module(this.x + pos.x, this.y + pos.y, this.width, this.height);
            },
            clone: function () {
                return module(this.x, this.y, this.width, this.height);
            },
            hasPosition: function (vector) {
                return !(
                    vector.x < this.x ||
                    vector.y < this.y ||
                    vector.x >= this.x + this.width ||
                    vector.y >= this.y + this.height
                );
            },
            grow: function (size) {
                this.x -= size / 2;
                this.y -= size / 2;
                this.width += size;
                this.height += size;
            }
        };
    };
    return module;
});