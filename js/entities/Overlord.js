/**
 * Created by wwh on 2019/8/22.
 */
let Overlord = function () {
    this.uid = "";
    this.nickname = "unnamed";
    this.colorIndex = -1;
    this.ap = 1;
    this.ownTerritories = [];  //里面保存着Territory的hc
};

Overlord.prototype.unserialize = function (data) {
    this.uid = data.uid;
    this.nickname = data.nickname;
    this.ap = data.ap;
    //this.ownTerritories = data.ts;    //store tid
};

Overlord.prototype.setColorIndex = function (idx) {
    this.colorIndex = idx;
};

Overlord.prototype.isOwnTerritory = function (hexCoord) {
    let idx = -1;
    if(typeof hexCoord == 'number') idx = hexCoord;
    else idx = game.gameManager.world.hexCoordToIndex(hexCoord);
    return this.ownTerritories.indexOf(idx) !== -1;
};

Overlord.prototype.setAP = function (ap) {
    this.ap = ap;
};

Overlord.prototype.getAP = function () {
    return this.ap;
};

Overlord.prototype.hasAnyTerritory = function () {
    return this.ownTerritories.length >= 1;
};

Overlord.prototype.removeTerritory = function (idx) {
    let i = this.ownTerritories.indexOf(idx);
    if (i !== -1) {
        let t = game.gameManager.world.getTerritory(idx);
        t.setOverlord(null);
        console.warn('overlord[' + this.uid + "]removeTerritory[" + idx + ']neighbours:' + t.neighbour.length);
        this.ownTerritories.splice(i, 1);
        return true;
    }
    return false;
};

Overlord.prototype.addTerritory = function (idx) {
    let i = this.ownTerritories.indexOf(idx);
    //有这个territory，意味着更新
    if (i === -1) {
        console.warn('overlord[' + this.uid + "]addTerritory[" + idx + ']');
        let t = game.gameManager.world.getTerritory(idx);
        if(t.overlord){
            console.warn("addTerritory >> territory[" + idx + ']has overlord['+t.overlord.uid+']');
        }
        this.ownTerritories.push(idx);
        t.setOverlord(this);
    }
};

Overlord.prototype.updateTerritory = function (idx) {
    console.log("updateTerritory[" + idx +']');
    return this.isOwnTerritory(idx);
};

Overlord.prototype.doAction_UpgradeDiscNum = function (idx) {
    if (this.isOwnTerritory(idx)) {
        console.warn("overlord[" + this.uid + "]---UpgradeDisc");
        let hc = game.gameManager.world.indexToHexCoord(idx);
        game.net.Req_UpgradeDiscNum(this.uid, hc);
    }
};
Overlord.prototype.doAction_UpgradeDiscValue = function (idx) {
    if (this.isOwnTerritory(idx)) {
        console.warn("overlord[" + this.uid + "]---UpgradeValue");
        let hc = game.gameManager.world.indexToHexCoord(idx);
        game.net.Req_UpgradeDiscValue(this.uid, hc);
    }
};
Overlord.prototype.doAction_Attack = function (f_tid, t_tid) {
    if (this.isOwnTerritory(f_tid) && !this.isOwnTerritory(t_tid)) {
        console.warn("overlord[" + this.uid + "]->Attack->(" + t_tid.x + ',' + t_tid.y + ')');
        game.net.Req_AttackTerritory(this.uid, f_tid, t_tid);
    }
};
Overlord.prototype.doAction_Pass = function () {
    console.warn("overlord[" + this.uid + "]---Pass");
    game.net.Req_Pass(this.uid);
    game.dataCache.gameManager.curTurnUID = null;

};
Overlord.prototype.doPathFinder = function (f_tid, t_tid) {
    console.warn("test PathFinder(" + f_tid.x + ',' + f_tid.y + ')->TO->(' + t_tid.x + ',' + t_tid.y + ')');
    game.net.Req_PathFinder(this.uid, f_tid, t_tid);
};

game.Overlord = Overlord;

