glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            smoothing: true,
            game: {
                name: 'Quick Access'
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
            var object1 = BaseObject().add({
                types: ['1']
            }),
                object2 = BaseObject().add({
                    types: ['1', '2']
                }),
                object3 = BaseObject().add({
                    types: ['1', '2', '3']
                }),
                object4 = BaseObject().add({
                    types: ['1', '2', '3', '4']
                }),
                object5 = BaseObject().add({
                    types: ['1', '2', '3', '4', '5']
                });
            Game.add(object1);
            Game.add(object2);
            Game.add(object3);
            Game.add(object4);
            Game.add(object5);
            // console.log(Game.getByType('1'));
            // console.log(Game.getByType('2'));
            // console.log(Game.getByType('3'));
            // console.log(Game.getByType('4'));
            // console.log(Game.getByType('5'));
            Game.remove(object1);
            console.log(Game.getByType('1'));
        });
    }
);