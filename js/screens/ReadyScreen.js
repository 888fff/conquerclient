/**
 * Created by wwh on 2019/8/23.
 */
game.ReadyScreen = me.Stage.extend({

    init: function() {
        this._super(me.Stage, 'init', []);
    },

    onResetEvent: function() {
        this.bunker = new game.ReadyRenderable();
        me.game.world.addChild( this.bunker );
        game.gameManager.start();
        //
        if(game.dataCache.state === VIRTUAL_PLAYER_STATE.GAMING){
            game.net.Req_Review(game.dataCache.player_uid);
        }else{
            game.net.socket.emit(MsgType.C_ENTER_ROOM, {});
        }
    },

    onDestroyEvent: function() {
        me.game.world.removeChild( this.bunker );
    }
});

game.ReadyRenderable = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, "init",[0, 0,
            me.game.viewport.getWidth(),
            me.game.viewport.getHeight()]);
        this.exiting = false;
        this.counter = 0;
        this.floating = true;
        this.anchorPoint.set(0,0);
        this.bg = new me.ColorLayer("background", "#222222");
        this.bg_size = new me.Rect(0,0,768,1024);
        this.text = new me.Text(0,0,{font:"kenpixel", size:20,textAlign:"center",fillStyle:"#FFFFFF"});
        this.label = "waiting.";
    },
    draw: function(renderer) {
        this.bg.draw(renderer,this.bg_size);
        this.text.draw (renderer,this.label,this.width / 2,this.height / 2);
    },

    update: function( dt ) {
        this._super(me.Renderable, 'update', [dt]);
        this.label = game.dataCache.netInfo;
        this.counter += dt;
        var gap = Math.floor(this.counter) % 1800;
        if (gap < 600) {
            this.label = this.label + '.';
        } else if (gap < 1200) {
            this.label = this.label + '..';
        } else if (gap < 1800) {
            this.label = this.label + '...';
        }
        if(game.launch_game && !this.exiting) {
            this.exiting = true;
            me.state.change(game.STATE_PLAY);
        }
        return true;
    }
});
