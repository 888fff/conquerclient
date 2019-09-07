/*Game Over Stage is here*/
game.GameOverScreen = me.Stage.extend({

    onResetEvent: function () {
        this.finished = false;
        this.bunker = new game.GameOverRenderable();
        me.game.world.addChild(this.bunker);
        this.bg = new me.ColorLayer("background", "#222222");
        me.game.world.addChild( this.bg, 0 );
    },

    onDestroyEvent: function () {
        me.game.world.removeChild(this.bunker);
        me.game.world.removeChild(this.bg);

    }
});

game.GameOverRenderable = me.Container.extend({
    init: function () {
        this._super(me.Container, "init", [0, 0]);
        this.counter = 0;
        //this.floating = true;
        this.anchorPoint.set(0, 0);
        this.text = new me.Text(0, 0, {font: "kenpixel", size: 26, textAlign: "center", fillStyle: "#eec720"});
        if (game.lose_game) {
            this.label = "抱歉，你输掉了游戏...";
        } else {
            this.label = "恭喜，你成为了最终的霸主！";
        }
        let ret = this.text.measureText(me.video.renderer, this.label);
        this.textHeight = ret.height;
        //
        this.gameover_btn = new game.GameOverButton(
            me.game.viewport.getWidth() / 2,
            me.game.viewport.getHeight() / 2,
            function () {
                me.state.change(game.STATE_MAIN_MENU);
            });
        this.addChild(this.gameover_btn, 1);
        this.updateChildBounds();

    },
    draw: function (renderer) {
        this._super(me.Container, 'draw', [renderer]);
        this.text.draw(renderer, this.label,
            me.game.viewport.getWidth() / 2,
            me.game.viewport.getHeight() / 2 - this.textHeight - 50);
    }
});

game.GameOverButton = me.GUI_Object.extend({

    init: function (x, y, func) {
        let settings = {};
        settings.image = me.loader.getImage("button");
        this._super(me.GUI_Object, "init", [x, y, settings]);
        //this.anchorPoint.set(0, 0);
        this.pos.z = 4;
        this.floating = false;
        this.click_cb = func;
    },
    onClick: function () {
        console.log("click GameOverButton to return");
        if (this.click_cb)
            this.click_cb();
        return false;
    },
});
