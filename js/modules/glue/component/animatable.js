/*
 *  @module Animatable
 *  @namespace component
 *  @desc Represents an animatable component
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/component/animatable', [
    'glue',
    'glue/math/vector',
    'glue/basecomponent',
    'glue/component/spritable'
], function (Glue, Vector, BaseComponent, Spritable) {
    'use strict';
    var Sugar = Glue.sugar;

    return function (object) {
        var baseComponent = BaseComponent('animatable', object),
            spritable = Spritable(object).spritable,
            animationSettings,
            animations = {},
            currentAnimation,
            currentFrame = 0,
            successCallback,
            errorCallback,
            frameWidth,
            frameHeight,
            columns,
            rows,
            startFrame,
            endFrame,
            image,
            loopCount,
            currentLoop,
            looping,
            onCompleteCallback,
            frameCountX,
            frameCountY,
            setAnimation = function () {
                if (!image) {
                    spritable.setImage(currentAnimation.image);
                    image = currentAnimation.image;
                }
                currentFrame = 0;
                loopCount = currentAnimation.loopCount || undefined;
                // onCompleteCallback = currentAnimation.onComplete || undefined;
                currentLoop = 0;
                looping = true;
            };

        baseComponent.set({
            setup: function (settings) {
                var animation;
                if (settings) {
                    if (settings.animation) {
                        animationSettings = settings.animation;
                        if (settings.animation.animations) {
                            animations = settings.animation.animations;
                        }
                    } else {
                        throw 'Specify settings.animation';
                    }
                }
                spritable.setup(settings);
                if (settings.image) {
                    image = settings.image;
                    frameWidth = settings.animation.frameWidth ||
                        settings.image.width / settings.animation.frameCountX;
                    frameHeight = settings.animation.frameHeight ||
                        settings.image.height / settings.animation.frameCountY;
                    columns = settings.image.width / frameWidth;
                    rows = settings.image.height / frameHeight;
                    frameCountX = settings.animation.frameCountX;
                    frameCountY = settings.animation.frameCountY;
                    object.getDimension().width = frameWidth;
                    object.getDimension().height = frameHeight;
                }
            },
            update: function (gameData) {
                if (!currentAnimation) {
                    return;
                }
                var reachedEnd = false;
                currentFrame += currentAnimation.imageSpeed || 1;
                while (currentFrame >= currentAnimation.frames.length) {
                    currentFrame -= currentAnimation.frames.length;
                    reachedEnd = true;
                }
                if (reachedEnd && onCompleteCallback) {
                    onCompleteCallback();
                }
            },
            draw: function (gameData) {
                var cf = Math.floor(currentFrame),
                    sx = (currentAnimation.frames[cf] % frameCountX) * frameWidth,
                    sy = Math.floor(currentAnimation.frames[cf] / frameCountX) * frameHeight;

                gameData.context.drawImage(
                    image,
                    sx,
                    sy,
                    frameWidth,
                    frameHeight,
                    0,
                    0,
                    frameWidth,
                    frameHeight
                );
            },
            setAnimation: function (name, callback) {
                var anim = animations[name];
                if (anim && currentAnimation !== anim) {
                    // set even if there is no callback
                    onCompleteCallback = callback;
                    currentAnimation = anim;
                    setAnimation();
                }
            },
            getDimension: function () {
                var dimension = object.getDimension();
                dimension.width = frameWidth;
                return dimension;
            },
            getBoundingBox: function () {
                var rectangle = object.getBoundingBox();
                rectangle.width = frameWidth;
                return rectangle;
            },
            getFrameWidth: function () {
                return frameWidth;
            },
            register: function () {
                baseComponent.register('draw');
                baseComponent.register('update');
            },
            unregister: function () {
                baseComponent.unregister('draw');
                baseComponent.unregister('update');
            }
        });

        return object;
    };
});