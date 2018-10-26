const parseXlsx = require('excel').default;
const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { exec, spawn } = require('child_process');
const os = require('os');
const Jimp = require("jimp");
const outPath = 'dynamic/extend/food';

class ToysMaker {

    constructor() {
        this.cwd = {
            category: path.resolve(Editor.projectInfo.path, '../art/food')
        };
        this.start = Date.now();
        this.entryList = this.findAllEntry();
        this.makeAllNormal(()=>{
            const total = Date.now() - this.start;
            Editor.success(`共${this.entryList.length}个工程全部完成!总用时${(total/1000).toFixed(1)}s, 平局用时${(total/(this.entryList.length*1000)).toFixed(1)}s`);
        });
    }

    findAllEntry() {
        const ret = [];
        const list = glob.sync(`${this.cwd.category}/*`, {});
        list.forEach((dir)=>{
            const stat = fs.statSync(dir);
            if( stat.isDirectory() ){
                const basename = path.basename(dir);
                const thumb = glob.sync(`${dir}/${basename}.png`, {});
                if( thumb && thumb.length == 1 ){
                    ret.push({
                        basename: basename,
                        basePath: dir
                    });
                }
            }
        });
        return ret;
    }

    makeAllNormal(done){
        async.eachOfSeries(this.entryList, (entry, index, cb)=>{
            // fs.copySync(, );
            let fileImage = path.resolve(entry.basePath, `${entry.basename}.png`);
            let fileEatSource = path.resolve(entry.basePath, `icon.png`);
            let fileBoardSource = path.resolve(entry.basePath, `board.png`);

            let fileOut = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/${entry.basename}.png`);
            let fileIcon = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/thumb.png`);
            let fileEat = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/icon.png`);
            let fileBoard = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/board.png`);
            let scaleRate = 1386/4872;

            async.series([
                //scale
                (callback)=>{
                    Jimp.read(fileImage, (err, lenna) => {
                        lenna.scale(scaleRate).write(fileOut);
                        callback();
                    });
                },
                //thumb
                (callback)=>{
                    Jimp.read(fileImage, (err, lenna) => {
                        lenna.scaleToFit(170, 110).write(fileIcon);
                        callback();
                    });
                },
                //icon
                (callback)=>{
                    if( !fs.existsSync(fileEatSource) ){
                        fileEatSource = fileImage;
                    }
                    Jimp.read(fileEatSource, (err, lenna) => {
                        lenna.scaleToFit(120, 120).write(fileEat);
                        callback();
                    });
                },
                //board
                (callback)=>{
                    Jimp.read(fileBoardSource, (err, lenna) => {
                        lenna.scaleToFit(100, 130).write(fileBoard);
                        callback();
                    });
                }
            ], ()=>{
                this._refreshTexture(entry.basename);
                Editor.log(`[食物]${entry.basename}`);
                cb();
            });
        }, ()=>{
            done();
        });
    }

    _refreshTexture(name){
        const basedir = `assets/resources/${outPath}/textures`;
        Editor.assetdb.refresh(`db://${basedir}/${name}`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/${name}.png`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/thumb.png`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/icon.png`);
    }

}

module.exports = function () {
    new ToysMaker();
}