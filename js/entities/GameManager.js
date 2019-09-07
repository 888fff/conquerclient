/**
 * Created by wwh on 2019/8/22.
 */
let GameManager = function () {
    this.ready = false;
    this.curTurnUID = null;     //这里保存的是uid
    this.overlords = [];        //这里是装载overlords的实例容器
    this.name = "GameMgr";
    this.round = 0;
};

GameManager.prototype.getMainOverlord = function () {
    return this.getOverlord(game.dataCache.player_uid);
};
GameManager.prototype.getOverlord = function (uid) {
    return this.overlords.find(function (lord) {
        return lord.uid === uid;
    });
};
GameManager.prototype.isMainOverlord = function (uid) {
    return uid === game.dataCache.player_uid;
};

GameManager.prototype.isMainOverlordTurn = function () {
    return this.isOverlordTurn(game.dataCache.player_uid);
};

GameManager.prototype.isOverlordTurn = function (uid) {
    return this.curTurnUID === uid;
};

GameManager.prototype.getCurTurnOverlord = function () {
    return this.getOverlord(this.curTurnUID)
};

GameManager.prototype.addOverlord = function (lord) {
    this.overlords.push(lord);
};
//仅仅更新Territory
GameManager.prototype.updateTerritory = function (territoryData) {
    let territory = this.world.getTerritory(territoryData.hc);
    territory.setData(territoryData);
};

GameManager.prototype.refreshUI = function () {

    if (this.isMainOverlordTurn()) {
        //TODO UI update
        if (this.ui) this.ui.showTerritoryBtn();
    } else {
        //TODO UI update
        if (this.ui) this.ui.hideTerritoryBtn();
    }
};

GameManager.prototype.setCurTurnUID = function (curTurnUID, startTurnData) {
    this.curTurnUID = curTurnUID;
    let ap = startTurnData.ap;
    let lord = this.getOverlord(this.curTurnUID);
    if (lord) {
        lord.setAP(ap);
    }
    this.refreshUI();
};

GameManager.prototype.vfxBubblingText = function (tid, label) {
    var t = this.world.getTerritory(tid);
    this.vfx.spawn_Bubbling_Text(t.pos, label);
};

GameManager.prototype.start = function () {
    this.ready = true;
    /*
    this.world = me.game.world.getChildByName("WorldMap")[0];
    */
    console.log("GameManager new a world");
    if(this.world)  delete this.world;
    this.world = new game.World();
};

GameManager.prototype.getGameComponent = function(){
    this.vfx = me.game.world.getChildByName("VFX")[0];
    this.ui = me.game.world.getChildByName("HUD")[0];
};


GameManager.prototype.end = function () {
    this.ready = false;
    this.vfx = null;
    this.ui = null;

};
//
GameManager.prototype.overlordLoseGame = function (uid) {
    //删除这个玩家，并告知原因
    for (i = 0; i < this.overlords.length; ++i) {
        if (this.overlords[i].uid === uid) {
            this.overlords.splice(i, 1);
        }
    }
    //如果是当前玩家失败
    if (uid === game.dataCache.player_uid) {
        game.lose_game = true;
        me.state.change(game.STATE_GAMEOVER);
    }
};

GameManager.prototype.overlordWinGame = function (uid) {
    if (uid === game.dataCache.player_uid) {
        game.lose_game = false;
        me.state.change(game.STATE_GAMEOVER);
    }
};

game.gameManager = new GameManager();

/*
function Turn(lord){
   this.lord = lord;
}
Turn.prototype.enter = function(){
    this.lord.refreshAP();
    console.log("It is " + this.lord.uid + " Turn with[" + this.lord.ap + ']AP');
    //
    if(this.ai) this.ai.think();
};
Turn.prototype.execute = function(){

};
Turn.prototype.exit = function(){
    console.log(this.lord.uid + " end the Turn");
};
Turn.prototype.getLordID = function(){
    return this.lord.uid;
};
//植入AI
Turn.prototype.implantAI = function () {
    this.ai = new AI_Simulate(this.lord);
};
*/
function AI_Simulate(lord) {
    this.lord = lord;
    this.thinkStepLimit = 10;

}

AI_Simulate.prototype.think = function () {
    var self = this;
    var world = me.state.current().worldMap;
    //
    if (this.lord.getAP() === 0) {
        this.lord.doAction_Pass();
    } else if (this.lord.getAP() >= 1) {
        var done = false;
        if (this.lord.getAP() < 2 || (this.lord.getAP() >= 2 && me.Math.random(1, 100) > 75)) {
            //只能进攻或者升级DiceNum
            if (me.Math.random(1, 100) % 2) {
                if (!this.wantAttack(world)) {
                    if (!this.wantUpgradeDN(world)) {
                        this.lord.doAction_Pass(world);
                    }
                }
            } else {
                if (!this.wantUpgradeDN(world)) {
                    if (!this.wantAttack(world)) {
                        this.lord.doAction_Pass(world);
                    }
                }
            }
        } else {
            if (!this.wantUpgradeDV(world)) {
                if (!this.wantAttack(world)) {
                    if (!this.wantUpgradeDN(world)) {
                        this.lord.doAction_Pass(world);
                    }
                }
            }
        }
        //

        //
        setTimeout(function () {
            self.think();
        }, 200);
    }

};
AI_Simulate.prototype.wantAttack = function (world) {
    var self = this;
    try {   //throw new Error('exist')
        var territories = this.shuffle(this.lord.ownTerritories);
        territories.forEach(function (tid) {
            var territory = world.getTerritory(tid);
            if (territory.diceNum > 1) {
                var neighbours = self.shuffle(territory.neighbour);
                neighbours.forEach(function (n_tid) {
                    var n_Territory = world.getTerritory(n_tid);
                    if (n_Territory.overlord === null || n_Territory.overlord.uid !== self.lord.uid) {
                        self.lord.doAction_Attack(tid, n_tid);
                        throw new Error('done');
                    }
                });
            }
        });
    } catch (e) {
        if (e.message === 'done') {
            return true;
        }
    }
    return false;
};
AI_Simulate.prototype.wantUpgradeDN = function (world) {
    var self = this;
    try {
        var territories = this.shuffle(this.lord.ownTerritories);
        territories.forEach(function (tid) {
            var territory = world.getTerritory(tid);
            if (territory.diceNum < 8) {
                self.lord.doAction_UpgradeDiscNum(tid);
                throw new Error('done');
            }
        });
    } catch (e) {
        if (e.message === 'done') {
            return true;
        }
    }
    return false;
};
AI_Simulate.prototype.wantUpgradeDV = function (world) {
    var self = this;
    try {
        var territories = this.shuffle(this.lord.ownTerritories);
        territories.forEach(function (tid) {
            var territory = world.getTerritory(tid);
            if (territory.diceValueMin < 6) {
                self.lord.doAction_UpgradeDiscValue(tid);
                throw new Error('done');
            }
        });
    } catch (e) {
        if (e.message === 'done') {
            return true;
        }
    }
    return false;
};
AI_Simulate.prototype.shuffle = function (arr) {
    var getRandom = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    let newArr = arr.slice(0);

    for (let i = 0; i < newArr.length; i++) {
        let j = getRandom(0, i);
        let temp = newArr[i];
        newArr[i] = newArr[j];
        newArr[j] = temp
    }

    return newArr
};

