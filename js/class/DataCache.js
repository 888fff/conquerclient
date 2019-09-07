/**
 * Created by wwh on 2019/8/22.
 */
let VIRTUAL_PLAYER_STATE ={
    NONE : "none",
    STAYLOBBY : "stayLobby",
    STAYROOM : "stayRoom",
    READY : "ready",
    GAMING : "gaming",
};




function DataCacheLayer(){
    this.state = VIRTUAL_PLAYER_STATE.NONE;
    //
    this.worldMap = null;
    this.ui = null;
    this.gameManager = null;
    //
    this.UID_COLOR_DICT = [];
    //这里保存着总的关键数据   登陆时候唯一的userID
    this.player_uid = "";
    //玩家的昵称
    this.player_nickname = "";
    //缓冲的内容
    this.curTurnData = null;
    this.worldData = null;
    this.overlordsData = null;
    //这个info也是给ready页面读取的
    this.netInfo = "";

}

DataCacheLayer.prototype.init = function () {
    //下面是一些游戏中的图层和控件
    this.gameManager = game.gameManager;
};

DataCacheLayer.prototype.setState = function(state){
    this.state = state;
};

DataCacheLayer.prototype.reset = function () {
    this.worldMap = null;
    this.UID_COLOR_DICT = [];
    this.ui = null;
    this.gameManager = null;
    //
    this.curTurnData = null;
    this.worldData = null;
    this.overlordsData = null;
};

DataCacheLayer.prototype.parseWorldMap = function (data) {
    //现在用默认地图，全图
    this.worldData = data;
    this.gameManager.world.createWorldMapFromData(this.worldData);
};

DataCacheLayer.prototype.parseOverlords = function(data){
    let self = this;
    let counter = 0;    //
    this.overlordsData = data;
    //这个overload是数据里面，包含当前主玩家的信息
    //此时world已经生成好了
    if (this.worldData) {
        this.overlordsData.forEach(function (lordData) {
            let overlord = new game.Overlord();
            overlord.unserialize(lordData);
            self.UID_COLOR_DICT[overlord.uid] = counter;
            overlord.setColorIndex(counter);
            //遍历overlord的所有拥有的土地
            lordData.ts.forEach(function (t_data) {
                let t = self.gameManager.world.getTerritory(t_data.hc);
                t.setData(t_data);
                overlord.addTerritory(self.gameManager.world.hexCoordToIndex(t_data.hc));
            });
            self.gameManager.addOverlord(overlord);
            counter += 1;
        });
    }
    //
};
DataCacheLayer.prototype.parseCurTurn = function (data) {
    if(data){
        this.curTurnData = data.uid;
        if(this.gameManager)
            this.gameManager.setCurTurnUID(this.curTurnData,data);
    }
};

DataCacheLayer.prototype.parsePassData = function (data) {
    if(data.uid === this.player_uid)
        if(this.gameManager)
            this.gameManager.ui.hideTerritoryBtn();

};
DataCacheLayer.prototype.launchGame = function () {
    game.launch_game = true;
};

DataCacheLayer.prototype.parseLoseGameData = function(data){
    this.gameManager.overlordLoseGame(data.uid,data.rd);
};
DataCacheLayer.prototype.parseWinGameData = function(data){
    this.gameManager.overlordWinGame(data.uid,data.rd);
};


DataCacheLayer.prototype.parseUpgradeDiscNum = function(data){
    data = data.extra;
    if(data.ret){
        let uid = data.uid;
        let tid = data.tid;
        let disc_num = data.dn;
        let territory = this.gameManager.world.getTerritory(tid);
        if(uid === territory.overlord.uid){
            territory.upgradeDiceNum(disc_num);
        }
        let ol = this.gameManager.getOverlord(data.uid);
        ol.setAP(data.ap);
    }
    else{
        console.log(data.uid +" UpgradeDiscNum ret:" + data.ret);
    }
};
DataCacheLayer.prototype.parseUpgradeDiscValue = function(data){
    data = data.extra;
    if(data.ret){
        var uid = data.uid;
        var tid = data.tid;
        var disc_value = data.dv;
        var territory = this.gameManager.world.getTerritory(tid);
        if(uid === territory.overlord.uid){
            territory.upgradeDiceValue(disc_value);
        }
        var ol = this.gameManager.getOverlord(data.uid);
        ol.setAP(data.ap);
    }
    else{
        console.log(data.uid +" UpgradeDiscNum ret:" + data.ret);
    }
};

DataCacheLayer.prototype.parseAttackResult = function(data){
    //这里解析data数据
    //播放攻击动画
    //TODO data.f_atk VS data.t_atk
    data = data.extra;
    let f_tData = data.f_tData;
    let t_tData = data.t_tData;
    this.gameManager.vfxBubblingText(f_tData.hc,data.f_atk.toString());
    this.gameManager.vfxBubblingText(t_tData.hc,data.t_atk.toString());
    //
    let ol = this.gameManager.getOverlord(data.f_uid);
    ol.setAP(data.ap);
    //
    if(data.ret){
        //重新设置区域归属
        this.gameManager.updateTerritory(f_tData);
        let overlord = this.gameManager.getOverlord(data.t_uid);
        if(overlord) overlord.removeTerritory(this.gameManager.world.hexCoordToIndex(t_tData.hc));
        this.gameManager.updateTerritory(t_tData);
        this.gameManager.getOverlord(data.f_uid).addTerritory(this.gameManager.world.hexCoordToIndex(t_tData.hc));
    }else{
        //如果攻击失败
        //首先设置From的数值，此时，From的Lord没有变化，只是数据变了
        this.gameManager.updateTerritory(f_tData);
        //其次设置To的数值，此时，TO的Lord没有变化，只是数据变了
        this.gameManager.updateTerritory(t_tData);
    }
};
game.dataCache = new DataCacheLayer();