/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector', [
    'glue/math'
], function (Mathematics) {
    'use strict';
    var module = function (x, y) {
        var math = Mathematics();
        return {
            x: x,
            y: y,
            add: function (vector) {
                var v = this.clone();
                v.addTo(vector);
                return v;
            },
            addTo: function (vector) {
                this.x += vector.x;
                this.y += vector.y;
                return this;
            },
            substract: function (vector) {
                var v = this.clone();
                v.substract(vector);
                return v;
            },
            substractFrom: function (vector) {
                this.x -= vector.x;
                this.y -= vector.y;
                return this;
            },
            angleBetween: function (vector) {
                return Math.atan2(
                    vector.y - this.y,
                    vector.x - this.x
                );
            },
            angle: function () {
                return Math.atan2(vector.y, vector.x);
            },
            dotProduct: function (vector) {
                return this.x * vector.x + this.y * vector.y;
            },
            multiply: function (vector) {
                var v = this.clone();
                v.multiplyWith(vector);
                return v;
            },
            multiplyWith: function (vector) {
                this.x *= vector.x;
                this.y *= vector.y;
                return this;
            },
            divide: function (vector) {
                var v = this.clone();
                v.divideBy(vector);
                return v;
            },
            divideBy: function (vector) {
                this.x /= vector.x;
                this.y /= vector.y;
                return this;
            },
            scale: function (value) {
                this.x *= value;
                this.y *= value;
                return this;
            },
            length: function () {
                return Math.sqrt(this.dotProduct(this));
            },
            normalize: function () {
                var length = this.length();
                this.x /= length;
                this.y /= length;
                return this;
            },
            distanceBetween: function (vector) {
                return vector.substract(this).length;
            },
            clone: function () {
                return module(this.x, this.y);
            },
            toMatrix: function () {
                var matrix = math.Matrix(1, 3);
                matrix.set(0, 0, this.x);
                matrix.set(0, 1, this.y);
                matrix.set(0, 2, 1);
                return matrix;
            }
        };
    };
    return module;
});