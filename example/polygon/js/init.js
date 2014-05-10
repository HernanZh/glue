glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/math/polygon',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        Polygon,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            smoothing: true,
            game: {
                name: 'Polygon'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(600, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                path: 'asset/',
                image: {
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var polygon,
                polygonOther,
                pts = [],
                colliding = false,
                set = function () {
                    // move polygon with the object
                    var pos = object.getPosition(),
                        points = [];
                    // 
                    points.push(Vector(pos.x, pos.y));
                    points.push(Vector(pos.x + 32, pos.y + 32));
                    points.push(Vector(pos.x + 8, pos.y + 32));
                    points.push(Vector(pos.x + 8, pos.y + 64));
                    points.push(Vector(pos.x - 8, pos.y + 64));
                    points.push(Vector(pos.x - 8, pos.y + 32));
                    points.push(Vector(pos.x - 32, pos.y + 32));
                    polygon = Polygon(points);

                    colliding = polygon.intersect(polygonOther);
                },
                once,
                object = BaseObject().add({
                    draw: function (data) {
                        if (!polygon) {
                            return;
                        }
                        // draw the polygon
                        var i,
                            ctx = data.context,
                            points = polygon.get(),
                            point,
                            next;
                        ctx.beginPath();
                        ctx.lineWidth = "2";
                        ctx.strokeStyle = colliding ? 'green' : "black";
                        for (i = 0; i <= points.length; ++i) {
                            point = points[i % points.length];
                            next = points[(i + 1) % points.length];
                            ctx.moveTo(point.x, point.y);
                            ctx.lineTo(next.x, next.y);
                            ctx.stroke(); // Draw it
                        }
                        ctx.closePath();

                        // draw other
                        points = polygonOther.get();
                        ctx.beginPath();
                        ctx.lineWidth = "2";
                        ctx.strokeStyle = colliding ? 'green' : "black";
                        for (i = 0; i <= points.length; ++i) {
                            point = points[i % points.length];
                            next = points[(i + 1) % points.length];
                            ctx.moveTo(point.x, point.y);
                            ctx.lineTo(next.x, next.y);
                            ctx.stroke(); // Draw it
                        }
                        ctx.closePath();
                    },
                    pointerUp: function (e) {
                        if (object.hold) {
                            object.hold = false;
                            set();
                        }
                    },
                    pointerDown: function (e) {
                        var position = object.getPosition();
                        if (polygon.hasPosition(e.worldPosition)) {
                            object.offset = Vector(position.x - e.worldPosition.x, position.y - e.worldPosition.y);
                            object.setPosition(Vector(e.worldPosition.x + object.offset.x, e.worldPosition.y + object.offset.y));
                            object.hold = true;
                            set();
                        }
                    },
                    pointerMove: function (e) {
                        if (object.hold) {
                            object.setPosition(Vector(e.worldPosition.x + object.offset.x, e.worldPosition.y + object.offset.y));
                            set();
                        }
                    }
                });
            
            // star shape
            pts.push(Vector(300, 200));
            pts.push(Vector(350, 300));
            pts.push(Vector(450, 300));
            pts.push(Vector(370, 370));
            pts.push(Vector(400, 500));
            pts.push(Vector(300, 410));
            pts.push(Vector(200, 500));
            pts.push(Vector(230, 370));
            pts.push(Vector(150, 300));
            pts.push(Vector(250, 300));
            polygonOther = Polygon(pts);

            // hourglas shape
            // pts.push(Vector(200, 200));
            // pts.push(Vector(400, 200));
            // pts.push(Vector(200, 400));
            // pts.push(Vector(400, 400));
            // polygonOther = Polygon(pts);

            object.setPosition(Vector(80, 80));
            set();

            Game.add(object);
        });
    }
);