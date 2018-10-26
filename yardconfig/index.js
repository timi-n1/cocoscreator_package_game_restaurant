const fs = require('fs');
const path = require('path');
const request = require('request');

var D = {
    furniture: null,
    guest: null,
    food: null
};

var innerUploadUrl = '';

class YardConfigParser{

    constructor(type, done){
        const src = path.resolve(Editor.projectInfo.path, './assets/editor/__YardConfig.fire');
        const output = path.resolve(Editor.projectInfo.path, `./assets/script/data/position/position.${type}.ts`);
        const data = JSON.parse(fs.readFileSync(src).toString());
        const keyMap = {
            furniture: {
                chr: 'F_',
                maker: this.furnitureMaker
            },
            guest: {
                chr: 'G_',
                maker: this.guestMaker
            },
            food: {
                chr: 'D_',
                maker: this.foodMaker
            }
        };
        const chr = keyMap[type].chr;
        const ret = [];
        let id = 1;
        let zindex = 1;
        data.forEach((node, myid)=>{
            if( node.__type__ != 'cc.Node' ){
                return;
            }
            if( node._name.slice(0,2) != chr ){
                return;
            }
            const json = {
                name: node._name.replace(chr, ''),
                x: node._position.x,
                y: node._position.y
            };
            if( keyMap[type].maker ){
                keyMap[type].maker(data, node, json, myid);
            }
            if( 'furniture' == type ){
                json.zindex = zindex++;
            }
            json.id = id++;
            ret.push(json);
        });
        let filename = `position.${type}.ts`;
        let datastring = `export default ${JSON.stringify(ret, null, 4)}`;

        fs.writeFileSync(output, datastring);
        Editor.success(type+'成功');
        Editor.assetdb.refresh(`db://assets/script/data/position`);
        Editor.assetdb.refresh(`db://assets/script/data/position/${filename}`);
        this.upload(`position.${type}.js`, ret, done);
    }

    upload(filename, data, done) {
        request.post(`${innerUploadUrl}/n/restaurant/config`, { form: { filename: filename, data: JSON.stringify(data) } }, (err, httpResponse, body) => {
            Editor.log('上传到后台:' + body);
            done && done(data);
        });
    }

    furnitureMaker(data, node, json){
        node._components.forEach((item)=>{
            const id = item.__id__;
            const com = data[id];
            if( com.__type__ == 'cc.Sprite' ){
                return;
            }
            if( com.subtype ){
                json.subtype = com.subtype;
                json.fixedTop = com.fixedTop;
                json.fixedBottom = com.fixedBottom;
                json.layer = com.layer;
                json.multiId = com.multiId;
            }
        });
    }

    guestMaker(data, node, json, myid){
        node._components.forEach((item)=>{
            const id = item.__id__;
            const com = data[id];
            json.__uuid = myid;
            if( com.__type__ == 'cc.Sprite' || com.__type__ == 'sp.Skeleton' ){
                return;
            }
            if( com.direction ){
                json.direction = com.direction;
            }
        });
    }

    foodMaker(data, node, json){
        node._components.forEach((item)=>{
            const id = item.__id__;
            const com = data[id];
            if( com.__type__ == 'cc.Sprite' ){
                return;
            }
            if( com.belongTo ){
                // Editor.warn(com.belongTo);
                for(let i=0; i<D.guest.length; i++){
                    // Editor.log(D.guest[i]);
                    if( D.guest[i].__uuid == com.belongTo.__id__ ){
                        json.guestId = D.guest[i].id;
                    }
                }
            }
        });
    }

}

module.exports = function(innerUploadUrl_){
    innerUploadUrl = innerUploadUrl_;
    new YardConfigParser('furniture', (data)=>{
        D.furniture = data;
        new YardConfigParser('guest', (data)=>{
            D.guest = data;
            new YardConfigParser('food', ()=>{
                Editor.success('完成');
            });
        });
    });
};