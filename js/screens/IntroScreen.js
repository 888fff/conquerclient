game.IntroScreen = me.Stage.extend({

    onResetEvent: function () {

        this.finished = false;

        this.bunker = new game.BunkerRenderable();
        me.game.world.addChild(this.bunker);

        me.input.registerPointerEvent("pointerdown", me.game.viewport, function (event) {
            me.event.publish("pointerdown", [event]);
        }, false);

        this.pointer_subscription = me.event.subscribe("pointerdown", this.pointerHandler.bind(this));

        //me.audio.play("bunkerlogo");
        this.finished = false;
    },

    onDestroyEvent: function () {
        //me.audio.stopTrack();
        me.input.releasePointerEvent("pointerdown", me.game.viewport);
        me.event.unsubscribe(this.pointer_subscription);
        me.game.world.removeChild(this.bunker);
    },

    pointerHandler: function () {
        if (!this.finished) {
            this.finished = true;
        }
    },

});

game.BunkerRenderable = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, "init", [0, 0,
            me.game.viewport.getWidth(),
            me.game.viewport.getHeight()]);
        this.exiting = false;
        this.counter = 0;
        this.floating = true;
        this.anchorPoint.set(0, 0);

        let cx = this.width / 2;
        let cy = this.height / 2;
        this.bg = new me.ColorLayer("background", "#222222");
        this.bg_size = new me.Rect(0, 0, me.game.viewport.getWidth(), me.game.viewport.getHeight());
        /*
        this.bg.pos.x = cx;
        this.bg.pos.y = cy;
        */
        this.bunker_logo = new me.Sprite(cx - 200, cy - 125, {
            image: "bunker_logo",
            framewidth: 400,
            frameheight: 225
        });
        this.alwaysUpdate = true;
        this.bunker_logo.addAnimation("flash", [1, 2]);
        this.bunker_logo.setCurrentAnimation("flash");
    },
    draw: function (renderer) {
        this._super(me.Renderable,"draw",[renderer]);
        this.bg.draw(renderer, this.bg_size);
        this.bunker_logo.draw(renderer);
    },

    update: function (dt) {
        this._super(me.Renderable,"update",[dt]);
        this.bunker_logo.update(dt);
        if (this.counter < 100) {
            this.counter++;
            if (this.counter === 150) {
                me.state.current().finished = true;
            }
        }
        if (me.state.current().finished && !this.exiting) {
            this.exiting = true;
            me.state.change(game.STATE_MAIN_MENU);
        }
        return true;
    }
});


