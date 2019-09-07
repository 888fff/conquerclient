/**
 * Created by wwh on 2019/8/22.
 */
//-----------------------------------------
//  网络交换
var MsgType = {

    WELCOME :                       'WELCOME',
    LOGIN_ERROR :                   'LOGIN_ERROR',
    LOGIN_SUCCESS :                 'LOGIN_SUCCESS',
    STAY_LOBBY :                    'STAY_LOBBY',
    BC_STAY_LOBBY :                 'BC_STAY_LOBBY',
    //
    BC_RE_ENTER_ROOM :              'BC_RE_ENTER_ROOM',
    RE_ENTER_ROOM :                 'RE_ENTER_ROOM',

    BC_ENTER_ROOM :                 'BC_ENTER_ROOM',
    ENTER_ROOM_SUCCESS :            'ENTER_ROOM_SUCCESS',
    ENTER_ROOM_ERROR :              'ENTER_ROOM_ERROR',
    //
    BC_LEAVE_ROOM :                 'BC_LEAVE_ROOM',
    LEAVE_ROOM_SUCCESS :            'LEAVE_ROOM_SUCCESS',
    LEAVE_ROOM_ERROR :              'LEAVE_ROOM_ERROR',

    PLAYER_MSG :                    'PLAYER_MSG',
    ROOM_DISMISSED :                'ROOM_DISMISSED',

    SET_READY_SUCCESS :              'SET_READY_SUCCESS',
    SET_UNREADY_SUCCESS :            'SET_UNREADY_SUCCESS',
    SET_READY_ERROR:                 'SET_READY_ERROR',

    GAMELOGIC_START :               'GAMELOGIC_START',

    //----------------------------------------------
    C_ENTER_ROOM :             'C_ENTER_ROOM',
    C_LEAVE_ROOM :             'C_LEAVE_ROOM',
    C_SET_READY :               'C_SET_READY',
    C_GET_INFO :                'C_GET_INFO',
    C_MSG :                     'C_MSG'
};

const GameMsgType = {
    C_ACTION: "C_ACTION",
    C_REVIEW: "C_REVIEW",
    C_AUTO: "C_AUTO",
    ///
    S_BC_ACTION: "S_BC_ACTION",
    S_ACTION: "S_ACTION",
    S_ASSIGN: "S_ASSIGN",
    S_REVIEW: "S_REVIEW",
    S_GAMEOVER: "S_GAMEOVER",
    S_ERR: "S_ERR"
};

const Act = {
    INVALID: 0,
    UPGRADE_DN: 1,
    UPGRADE_DV: 2,
    ATTACK: 4,
    PASS: 8,
    PATH_FINDER : 16,
    TURN: 256
};
//这里是网络配置
const remoteHost = "47.103.66.7";
function NetLayer(){
    this.host = "192.168.1.8";//remoteHost;
    this.port = "8000";
    this.token = "conquer";
    this.socket = null;
    this.online = false;
}
//网络模块启动
NetLayer.prototype.Start = function(){
    //尝试链接网络
    if(this.socket && this.socket.uid) return;
    game.dataCache.init();
    game.dataCache.netInfo = '准备连接:'+this.host;
    console.warn(game.dataCache.netInfo);
    this.socket = io('http://' + this. host + ':' + this.port + '?token='+this.token+'&user=' + game.dataCache.player_uid);
    if(this.socket){
        this.Config();
    }
};
//网络模块与反应函数对接
NetLayer.prototype.Config = function(){
    let self = this;
    //服务器广播的Action消息
    this.socket.on(GameMsgType.S_BC_ACTION, function (data) {
        console.warn(GameMsgType.S_BC_ACTION + '[' + JSON.stringify(data) +']');
        if (data.act === Act.UPGRADE_DN) {
            self.onGame_UpgradeDiscNum(data);
        }
        if (data.act === Act.UPGRADE_DV) {
            self.onGame_UpgradeDiscValue(data);
        }
        if (data.act === Act.ATTACK) {
            self.onGame_AttackTerritory(data);
        }
        if (data.act === Act.PASS) {
            self.onGame_Pass(data);
        }
        if (data.act === Act.TURN) {
            self.onGame_StartTurn(data);
        }
    });
    //服务器主动推送给特定玩家的Action
    this.socket.on(GameMsgType.S_ACTION, function (data) {
        console.warn(GameMsgType.S_ACTION + '[' + JSON.stringify(data) +']');
    });
    //服务器首次在玩家开始游戏后，发送的所有信息。
    this.socket.on(GameMsgType.S_ASSIGN, function (data) {
        console.warn(GameMsgType.S_ASSIGN + '[' + JSON.stringify(data) +']');
        self.onGame_GameStart(data);
    });
    //服务器首次在玩家重新连接后，请求的review，返回的所有消息
    this.socket.on(GameMsgType.S_REVIEW, function (data) {
        console.warn(GameMsgType.S_REVIEW + '[' + JSON.stringify(data) +']');
        //TODO like S_ASSIGN
        self.onGame_Review(data);
    });
    //服务器发送的游戏结束的消息
    this.socket.on(GameMsgType.S_GAMEOVER, function (data) {
        console.warn(GameMsgType.S_GAMEOVER + '[' + JSON.stringify(data) +']');
        if(data.ret) self.onGame_WinGame(data);
        else self.onGame_LoseGame(data);
    });
    this.socket.on(GameMsgType.S_ERR, function (data) {
        console.warn(GameMsgType.S_ERR + '[' + JSON.stringify(data) +']');
    });
    //////////////
    //      下面和客户端登陆服务器有关系
    //////////////

    this.socket.on('connect', function () {
        game.dataCache.netInfo = "连入服务器";
        self.online = true;
        console.warn("connected");
    });

    this.socket.on('disconnect', function () {
        game.dataCache.netInfo = '与服务器断开连接';
        console.warn("disconnected");
        self.online = false;
        //如果断开连接，切换至menu界面，如果此时DataCache的状态是在游戏中，或者房间中什么的，则，重新连接
        me.state.change(game.STATE_READY);
    });

    this.socket.on(MsgType.GAMELOGIC_START, function (data) {
        console.warn('GAMELOGIC_START' + '[' + JSON.stringify(data) +']');
        game.dataCache.netInfo = "游戏即将开始(准备中)";
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.GAMING);
    });
    //收到欢迎消息后，立即登陆
    this.socket.on(MsgType.WELCOME, function (data) {
        game.dataCache.netInfo = "尝试登陆[" + data.sn +']';
        self.socket.emit('login', {uid: game.dataCache.player_uid});
    });
    //
    this.socket.on(MsgType.LOGIN_SUCCESS, function (data) {
        console.warn("LOGIN_SUCCESS");

    });
    this.socket.on(MsgType.LOGIN_ERROR, function (data) {
        console.warn("LOGIN_ERROR[" + data.err + ']');

    });
    //登陆后，服务器会将玩家放入大厅。
    this.socket.on(MsgType.STAY_LOBBY, function (data) {
        game.dataCache.netInfo = '成功登陆服务器';
        console.warn("STAY_LOBBY[" + data.uid + '][' + data.nickname + '][' + data.state + ']');
        self.socket.uid = data.uid;
        game.dataCache.player_uid = data.uid;
        game.dataCache.player_nickname = data.nickname;
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYLOBBY);
        //TODO 这里应该在点击按钮后，在ready界面刷新
        //self.socket.emit(MsgType.C_ENTER_ROOM, {});
    });
    this.socket.on(MsgType.BC_STAY_LOBBY, function (data) {
        console.warn("BC_STAY_LOBBY");
    });
    this.socket.on(MsgType.BC_RE_ENTER_ROOM, function (data) {
        console.warn("BC_RE_ENTER_ROOM");

    });
    this.socket.on(MsgType.RE_ENTER_ROOM, function (data) {
        console.warn("RE_ENTER_ROOM[room:" + data.rid + '][' + data.state + ']');
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYROOM);
        if(data.state === 'gaming'){
            game.dataCache.setState(VIRTUAL_PLAYER_STATE.GAMING);
        }else{
            game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYROOM);
        }
    });
    this.socket.on(MsgType.BC_ENTER_ROOM, function (data) {
        console.warn("BC_ENTER_ROOM");

    });
    this.socket.on(MsgType.ENTER_ROOM_SUCCESS, function (data) {
        game.dataCache.netInfo = '开始寻找游戏';
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYROOM);
        console.warn("ENTER_ROOM_SUCCESS[" + data.rid + '][' + data.state + ']');
        self.socket.emit(MsgType.C_SET_READY, {ready: true});

    });
    this.socket.on(MsgType.ENTER_ROOM_ERROR, function (data) {
        console.warn("ENTER_ROOM_ERROR[" + data.err + ']');
        /*
        setTimeout(function () {
            self.socket.emit(MsgType.C_ENTER_ROOM, {});
        },3000);*/
    });
    this.socket.on(MsgType.BC_LEAVE_ROOM, function (data) {
        console.warn("BC_LEAVE_ROOM");
    });
    this.socket.on(MsgType.LEAVE_ROOM_SUCCESS, function (data) {
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYLOBBY);
        console.warn("LEAVE_ROOM_SUCCESS[" + data.state + ']');
    });
    this.socket.on(MsgType.LEAVE_ROOM_ERROR, function (data) {
        console.warn("LEAVE_ROOM_ERROR[" + data.err + ']');
    });
    this.socket.on(MsgType.PLAYER_MSG, function (data) {
        console.warn("PLAYER_MSG[" + data.msg +']');
    });
    this.socket.on(MsgType.SET_READY_SUCCESS, function (data) {
        game.dataCache.netInfo = '准备就绪，等待其他玩家';
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.READY);
        console.warn("SET_READY_SUCCESS[" + data.state + ']');
    });
    this.socket.on(MsgType.SET_UNREADY_SUCCESS, function (data) {
        game.dataCache.setState(VIRTUAL_PLAYER_STATE.STAYROOM);
        console.warn("SET_UNREADY_SUCCESS[" + data.state + ']');
    });
    this.socket.on(MsgType.SET_READY_ERROR, function (data) {
        console.warn("SET_READY_ERROR[" + data.err + ']');
    });
};
//发送请求升级骰子个数
NetLayer.prototype.Req_UpgradeDiscNum = function(uid,tid){
    //this.Request('rUDN',{uid:uid,tid:tid});
    this.socket.emit(GameMsgType.C_ACTION, {
            uid: uid,
            act: Act.UPGRADE_DN,
            tid: {x: tid.x, y: tid.y},
            extra: {}
        }
    );
};
//获得升级骰子个数的返回消息
NetLayer.prototype.onGame_UpgradeDiscNum = function(data){
    //如果有数据，且数据的ret是真
    game.dataCache.parseUpgradeDiscNum(data);
};
//发送请求升级骰子最小值
NetLayer.prototype.Req_UpgradeDiscValue = function(uid,tid){
    //this.Request('rUDV',{uid:uid,tid:tid});
    this.socket.emit(GameMsgType.C_ACTION, {
            uid: uid,
            act: Act.UPGRADE_DV,
            tid: {x: tid.x, y: tid.y},
            extra: {}
        }
    );
};
//获得升级骰子最小值的返回消息
NetLayer.prototype.onGame_UpgradeDiscValue = function(data){
    game.dataCache.parseUpgradeDiscValue(data);
};
//发送请求攻击消息
NetLayer.prototype.Req_AttackTerritory = function(uid,from_tid,to_tid){
    //this.Request('rATK',{uid:uid,f_tid:from_tid,t_tid:to_tid});
    this.socket.emit(GameMsgType.C_ACTION, {
            uid: uid,
            act: Act.ATTACK,
            tid: {x: from_tid.x, y: from_tid.y},
            extra: {x: to_tid.x, y: to_tid.y}
        }
    );
};
//获得攻击的返回消息
NetLayer.prototype.onGame_AttackTerritory = function(data){
    game.dataCache.parseAttackResult(data);
};
//发送请求重新连接游戏,获得review游戏的消息
NetLayer.prototype.Req_Review = function (uid) {
    //this.Request('rL',{uid:uid});
    this.socket.emit(GameMsgType.C_REVIEW, {uid: uid});
};
//发送Pass回合结束的消息
NetLayer.prototype.Req_Pass = function (uid) {
    this.socket.emit(GameMsgType.C_ACTION, {
            uid: uid,
            act: Act.PASS
        }
    );
};
//获得Pass回合结束的返回消息(回合结束)
NetLayer.prototype.onGame_Pass = function(data){
    game.dataCache.parsePassData(data);
};
//请求寻路的消息
NetLayer.prototype.Req_PathFinder  = function(uid,from_tid,to_tid){
    this.socket.emit(GameMsgType.C_ACTION, {
            uid: uid,
            act: Act.PATH_FINDER,
            tid: {x: from_tid.x, y: from_tid.y},
            extra: {x: to_tid.x, y: to_tid.y}
        }
    );
};
//获得游戏失败的消息
NetLayer.prototype.onGame_LoseGame = function(data){
    game.dataCache.parseLoseGameData(data);
};
//获得游戏成功的消息
NetLayer.prototype.onGame_WinGame = function(data){
    game.dataCache.parseWinGameData(data);
};
//获得回合开始的消息
NetLayer.prototype.onGame_StartTurn = function(data){
    let d = {
        uid:data.uid,
        ap:data.extra.ap
    };
    game.dataCache.parseCurTurn(d);
};
//获得游戏开始的消息
NetLayer.prototype.onGame_GameStart = function(data){
    //TODO GameStart!!
    game.dataCache.parseWorldMap(data.world);//world map
    game.dataCache.parseOverlords(data.extra.overlords);//overlords
    game.dataCache.launchGame();
};
//获得游戏review的消息
NetLayer.prototype.onGame_Review = function(data){
    game.dataCache.parseWorldMap(data.world);//world map
    game.dataCache.parseOverlords(data.extra.overlords);//overlords
    let ap = game.dataCache.gameManager.getOverlord(data.extra.curTurnUID).getAP();
    let d= {
        uid:data.extra.curTurnUID,
        ap:ap
    };
    game.dataCache.parseCurTurn(d);//overlords
    game.dataCache.launchGame();
};
game.net = new NetLayer();