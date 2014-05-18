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
            startFrame,
            endFrame,
            image,
            onCompleteCallback,
            frameCountX,
            frameCountY;

        baseComponent.set({
            setup: function (settings) {
                var animation;
                if (!settings) {
                    throw 'Supply settings';
                }
                if (!settings.image) {
                    throw 'Set an image';
                }
                if (settings.animation) {
                    animationSettings = settings.animation;
                } else {
                    // create default animation
                    animationSettings = {
                        frameCountX: 1,
                        frameCountY: 1
                    };
                }
                // add default animation
                if (!animationSettings.animations) {
                    animationSettings.animations = {};
                }
                if (!animationSettings.animations['default']) {
                    animationSettings.animations['default'] = {
                        frames: [0]
                    };
                }
                animations = animationSettings.animations;
                spritable.setup(settings);
                image = settings.image;
                // use frameWidth if specified (overrides frameCountX and frameCountY)
                if (animationSettings.frameWidth && animationSettings.frameHeight) {
                    frameWidth = animationSettings.frameWidth;
                    frameHeight = animationSettings.frameHeight;
                    frameCountX = Math.floor(settings.image.naturalWidth / frameWidth);
                    frameCountY = Math.floor(settings.image.naturalHeight / frameHeight);
                } else {
                    frameCountX = animationSettings.frameCountX;
                    frameCountY = animationSettings.frameCountY;
                    frameWidth = settings.image.width / frameCountX;
                    frameHeight = settings.image.height / frameCountY;
                }
                // set dimension of base object
                object.getDimension().width = frameWidth;
                object.getDimension().height = frameHeight;
                // set to default
                currentAnimation = animations['default'];
            },
            update: function (gameData) {
                var reachedEnd;
                if (!currentAnimation) {
                    return;
                }
                reachedEnd = false;
                currentFrame += currentAnimation.imageSpeed || 1;
                if (currentAnimation.loop) {
                    while (currentFrame >= currentAnimation.frames.length) {
                        currentFrame -= currentAnimation.frames.length;
                        reachedEnd = true;
                    }
                } else {
                    if (currentFrame >= currentAnimation.frames.length) {
                        reachedEnd = true;
                    }
                }
                if (reachedEnd && onCompleteCallback) {
                    onCompleteCallback();
                }
            },
            draw: function (gameData) {
                var cf = Math.min(Math.floor(currentFrame), currentAnimation.frames.length - 1),
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
            setAnimation: function (name, callback, keepCurrentFrame) {
                var anim = animations[name];
                if (anim && currentAnimation !== anim) {
                    if (!Sugar.isDefined(anim.loop)) {
                        anim.loop = true;
                    }
                    // set even if there is no callback
                    onCompleteCallback = callback;
                    currentAnimation = anim;
                    if (!keepCurrentFrame) {
                        currentFrame = 0;
                    }
                }
            },
            setFrame: function (frameNumber) {
                currentFrame = frameNumber;
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