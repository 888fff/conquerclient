/* Game namespace */
var game = {
    // an object where to store game information
    data: {
        // score
        score: 0
    },

    STATE_INTRO: me.state.USER,
    STATE_MAIN_MENU: me.state.USER + 1,
    STATE_READY: me.state.USER + 2,
    STATE_PLAY: me.state.USER + 3,
    STATE_GAMEOVER: me.state.USER + 4,


    //------------

    launch_game: false,
    lose_game: false,

    // Run on page load.
    "onload": function (uid) {
        // Initialize the video.
        if (!me.video.init(768, 1024, {
            wrapper: "screen",
            scale: "auto",
            scaleMethod: "fit",//"flex-width",
            renderer: me.video.CANVAS
        })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
        this.dataCache.player_uid = uid;
        // Initialize the audio.
        me.audio.init("mp3,ogg");
        me.loader.preload(game.resources, this.loaded.bind(this));
    },
    // Run on game resources loaded.
    "loaded": function () {
        /*
        game.ui_texture = new me.video.renderer.Texture([
            me.loader.getJSON("UI_Assets-0"),
            me.loader.getJSON("UI_Assets-1"),
            me.loader.getJSON("UI_Assets-2")
        ]);*/
        me.state.set(game.STATE_INTRO, new game.IntroScreen());
        me.state.set(game.STATE_MAIN_MENU, new game.GameMenuScreen());
        me.state.set(game.STATE_READY, new game.ReadyScreen());
        me.state.set(game.STATE_PLAY, new game.PlayScreen());
        me.state.set(game.STATE_GAMEOVER, new game.GameOverScreen());
        //Entity池注册
        me.pool.register("tile", game.Territory);
        // 设置转场效果
        //me.state.transition('fade', '#000', 1000);
        //开始！！
        me.state.change(game.STATE_INTRO);
    }
};
