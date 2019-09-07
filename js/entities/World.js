game.World = me.Container.extend({
    init : function () {
        this._super(me.Container, "init", [64, 64,
            1, 1
        ]);
        this.HEX_SIZE = 64;
        this.COLS = 7;
        this.ROWS = 7;
        this.name = "WorldMap";
        this.outerRadius = this.HEX_SIZE * 0.5;
        this.innerRadius = this.outerRadius * 0.866025404;
        let sideLength = this.HEX_SIZE / 2;
        this.gridSize_x = 1.5 * sideLength;
        this.gridSize_y = 1.732 * sideLength;
        //
        this.created = false;
        this.territoriesPool = [];
    },

    createWorldMapFromData : function (data) {
        if(!data) return;

        console.log("createWorldMapFromData");

        let self = this;
        let worldData = data.map;
        let worldCfg = data.cfg;

        this.HEX_SIZE = worldCfg.s;
        this.COLS = worldCfg.c;
        this.ROWS = worldCfg.r;
        this.territoriesPool.splice(0);

        let idx = 0;


        worldData.forEach(function(tData){
            let hc = self.indexToHexCoord(idx);
            let pos = self.hexCellToWorldPos(hc);
            let t = me.pool.pull("tile", pos.x, pos.y);
            t.setData(tData);
            t.hexCoord = hc;
            self.addChild(t);
            self.territoriesPool.push(t);
            idx++;
        });

        this.updateChildBounds();

        this.created = true;
    },

    onActivateEvent : function () {

    },
    
    onDeactivateEvent : function () {

    },
    //返回Territory的HexCoord
    selectHexCell : function(world_x,world_y){
        world_x = (world_x + 0.5 * this.gridSize_x);   //将world_x 一小丢偏移
        let grid_x = Math.floor(world_x / this.gridSize_x);
        let grid_y = Math.floor( world_y / this.gridSize_y);
        let pts = [];
        if(grid_x % 2){
            //奇数
            pts.push({x:grid_x,y:(grid_y + 0.5)});
            pts.push({x:(grid_x + 1),y:grid_y});
            pts.push({x:(grid_x + 1),y:(grid_y + 1)});

        }else{
            //偶数
            pts.push({x:grid_x,y:grid_y});
            pts.push({x:grid_x,y:(grid_y + 1)});
            pts.push({x:(grid_x+1),y:(grid_y + 0.5)});
        }
        let index = -1; //最小索引
        let mindist= 9999; //一个非常大的值
        for(let i = 0;i<3;++i){
            let px = pts[i].x * this.gridSize_x;
            let py = pts[i].y * this.gridSize_y;
            let dist = (world_x - px)*(world_x - px) + (world_y - py)*(world_y - py);
            //更新最小距离值和索引
            if(dist < mindist)
            {
                mindist = dist;
                index = i;
            }
        }
        //return {x : pts[index].x , y : pts[index].y};
        return {x : pts[index].x - 1 , y : pts[index].y - pts[index].x * 0.5};
    },
    indexToHexCoord : function(idx){
        let col = Math.floor(idx / this.ROWS);
        let row = idx % this.ROWS;
        row = row - Math.floor(col / 2);
        return {x: col, y: row};
    },

    hexCoordToIndex : function (hexCoord) {
        return this.ROWS * hexCoord.x + hexCoord.y + Math.floor(hexCoord.x / 2);
    },

    hexCellToWorldPos : function(hexCell){
        return {
            x : (hexCell.x) * this.gridSize_x,
            y : (hexCell.y + (hexCell.x) * 0.5) * this.gridSize_y
        };
    },
    /*
    worldPosToHexCell : function(wpos){
        let hexCell_x = Math.floor(wpos.x / this.gridSize_x);
        let hexCell_y = Math.floor(wpos.y / this.gridSize_y - hexCell_x * 0.5);
        return {
            x : hexCell_x,
            y : hexCell_y
        };
    },*/
    getTerritory : function (hexCoord) {
        let idx = -1;
        if(typeof hexCoord == 'number') idx = hexCoord;
        else idx = this.hexCoordToIndex(hexCoord);

        if (idx >= 0 && idx < this.territoriesPool.length) return this.territoriesPool[idx];
        else {
            //console.log("cant find hexCoord[" + hexCoord.x + ',' + hexCoord.y + ']Territory');
            return null;
        }
    },
    //就是WorldMap整张的Y值在每一列的范围
    getRangeYAxis : function (x) {
        return {min : Math.floor(0 - x/2),max:Math.floor(this.ROWS - x/2)};
    },

});

