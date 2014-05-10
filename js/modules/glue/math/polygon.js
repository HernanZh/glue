/**
 *  @module Polygon
 *  @namespace math
 *  @desc Represents a polygon
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/polygon', ['glue/math/rectangle'], function (Rectangle) {
    'use strict';
    return function (points) {
        var minX = points[0].x,
            maxX = points[0].x,
            minY = points[0].y,
            maxY = points[0].y,
            n = 1,
            q,
            doLineSegmentsIntersect = function (p, p2, q, q2) {
                // based on of https://github.com/pgkelley4/line-segments-intersect
                var r,
                    s,
                    uNumerator,
                    denominator,
                    u,
                    t
                    crossProduct,
                    subtractPoints;

                // optimize by comparing extremes first?
                
                crossProduct = function (p1, p2) {
                    return p1.x * p2.y - p1.y * p2.x;
                };
                subtractPoints = function (p1, p2) {
                    return {
                        x: p1.x - p2.x,
                        y: p1.y - p2.y
                    };
                };
                r = subtractPoints(p2, p);
                s = subtractPoints(q2, q);
                uNumerator = crossProduct(subtractPoints(q, p), r);
                denominator = crossProduct(r, s);
                if (uNumerator == 0 && denominator == 0) {
                    return ((q.x - p.x < 0) != (q.x - p2.x < 0) != (q2.x - p.x < 0) != (q2.x - p2.x < 0)) ||
                        ((q.y - p.y < 0) != (q.y - p2.y < 0) != (q2.y - p.y < 0) != (q2.y - p2.y < 0));
                }
                if (denominator == 0) {
                    return false;
                }
                u = uNumerator / denominator;
                t = crossProduct(subtractPoints(q, p), s) / denominator;
                return (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
            };

        for (n = 1; n < points.length; ++n) {
            q = points[n];
            minX = Math.min(q.x, minX);
            maxX = Math.max(q.x, maxX);
            minY = Math.min(q.y, minY);
            maxY = Math.max(q.y, maxY);
        }

        return {
            get: function () {
                return points;
            },
            getBoundingBox: function () {
                return Rectangle(minX, minY, maxX - minX, maxY - minY);
            },
            hasPosition: function (p) {
                var has = false,
                    i = 0,
                    j = points.length - 1;

                if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
                    return false;
                }
                for (i, j; i < points.length; j = i++) {
                    if ((points[i].y > p.y) != (points[j].y > p.y) &&
                        p.x < (points[j].x - points[i].x) * (p.y - points[i].y) /
                        (points[j].y - points[i].y) + points[i].x) {
                        has = !has;
                    }
                }
                return has;
            },
            intersect: function (polygon) {
                var intersect = false,
                    other = polygon.get(),
                    p1,
                    p2,
                    q1,
                    q2,
                    i,
                    j;
                // simplest check first: regard polygons as boxes and check collision
                if (!this.getBoundingBox().intersect(polygon.getBoundingBox())) {
                    return false;
                }

                // precision check
                for (i = 0; i < points.length; ++i) {
                    for (j = 0; j < other.length; ++j) {
                        p1 = points[i];
                        p2 = points[(i + 1) % points.length];
                        q1 = other[j];
                        q2 = other[(j + 1) % other.length];
                        if (doLineSegmentsIntersect(p1, p2, q1, q2)) {
                            return true;
                        }
                    }
                }
                // check inside one or another
                if (this.hasPosition(other[0]) || polygon.hasPosition(points[0])) {
                    return true;
                } else {
                    return false;
                }
            }
        };
    };
});