game.GameMenuScreen = me.Stage.extend({
    onResetEvent: function() {
        this.finished = false;
        this.main_menu = new game.MainMenuContainer();
        me.game.world.addChild( this.main_menu );
        this.bg = new me.ColorLayer("background", "#222222");
        me.game.world.addChild( this.bg, 0 );

    },
    onDestroyEvent: function() {
        me.game.world.removeChild( this.main_menu );
        me.game.world.removeChild( this.bg );

    }
});
game.MainMenuContainer = me.Container.extend({
    init: function() {
        this._super(me.Container, "init", [0, 0]);
        let self = this;
        this.anchorPoint.set(0,0);
        //this.floating = true;
        this.name = "MainMenuContainer";
        this.menu_bg = new me.Sprite( 0,0,{
            image : me.loader.getImage("menu_bg"),
            framewidth : 768,
            frameheight : 1024,
            anchorPoint : { x:0, y:0 }
        });
        this.addChild(this.menu_bg,0);
        this.exiting = false;
        this.menu_btn = new game.MainMenuButton(170,700,function () {
            if(!self.exiting){
                //当点击开始时，开始连接网络
                game.net.Start();
                self.exiting = true;
            }
        });
        this.addChild(this.menu_btn,1);
        //
        this.updateChildBounds();
        //
        //this.alwaysUpdate = true;

    },

    draw: function(renderer) {
        this._super(me.Container, 'draw', [renderer]);
        /*
        this.menu_bg.draw(renderer);
        this.menu_btn.draw(renderer);*/
    },
    update: function( dt ) {
        this._super(me.Container, 'update', [dt]);
        this.menu_btn.update(dt);
        if ( game.net.online &&
             game.dataCache.state !== VIRTUAL_PLAYER_STATE.NONE) {
            console.log("MenuScreen changes to ReadyScreen");
            me.state.change(game.STATE_READY);
        }
        return true;
    }
});

game.MainMenuButton = me.GUI_Object.extend({

    init:function (x, y,func)
    {
        let settings = {};
        settings.image = me.loader.getImage("menu_btn");
        this._super(me.GUI_Object, "init", [x, y, settings]);
        //this.anchorPoint.set(0, 0);
        this.pos.z = 4;
        this.floating = false;
        this.click_cb = func;
    },
    onClick:function ()
    {
        console.log("click main menu to start");
        if(this.click_cb)
            this.click_cb();
        return false;
    },
});
