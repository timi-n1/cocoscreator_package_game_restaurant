const fs = require('fs-extra');
const async = require('async');
const path = require('path');
const Jimp = require('jimp');
const sizeOf = require('image-size');
const os = require('os');
const configFile = path.resolve(__dirname, './config.json');
const outFile = path.resolve(Editor.projectInfo.path, './assets/script/data/config/config.furnitures_size.ts');


class Work {

    constructor() {
        this.outLog = [];
        this.sizeCfg = JSON.parse( fs.readFileSync(outFile).toString().replace('export default ', '') );
        if (fs.existsSync(configFile)) {
            this.data = JSON.parse(fs.readFileSync(configFile).toString());
            this.duelAll();
        }
        else {
            Editor.error(`未找到${configFile}`);
        }
    }
    duelAll() {
        async.eachOfSeries(this.data, (cfg, i, cb) => {
            this.duel(cfg, () => {
                cb();
            });
        }, () => {
            this.finishOut(this.outLog);
            Editor.success('全部完成!');
        });
    }
    duel(cfg, done) {
        async.eachOfSeries(cfg.filter, (file0, i, cb) => {
            const file = path.resolve(Editor.projectInfo.path, cfg.basepath, file0);
            if (fs.existsSync(file)) {
                this._dule(file, cfg.rule, cfg.limit, (sizeFrom) => {
                    this.outLog.push({
                        file: file,
                        sizeFrom: sizeFrom,
                        sizeTo: sizeOf(file)
                    });
                    Editor.assetdb.refresh(`db://${cfg.basepath}/${file0}`);
                    cb();
                });
            }
            else {
                console.error(`${file}不存在`);
                cb();
            }
        }, () => {
            done();
        });
    }
    _dule(file, rule, limit, done) {
        const size = sizeOf(file);
        if (this._matchLimit(size, limit)) {
            Editor.warn(`[跳过]]${file}`);
            done(false);
            return;
        }
        async.eachOfSeries(rule, (r, i, cb) => {
            if (this[`_dule_${r.method}`]) {
                let sizeFrom = sizeOf(file);
                Editor.log(`[处理]]${file}`, sizeFrom);
                this[`_dule_${r.method}`](file, size, r, ()=>{

                    cb(sizeFrom);
                });
            }
            else {
                Editor.warn(r.method + '未定义');
                cb(false);
            }
        }, () => {
            done();
        });
    }
    _matchLimit(size, limit) {
        if (limit.widthMin && limit.widthMin > size.width) {
            return true;
        }
        return false;
    }
    _dule_scaleBy(file, size, r, cb) {
        // Editor.log(`[scaleBy][${r.param}]${file}`);
        Jimp.read(file, (err, img) => {
            img
                .resize(size.width * (1 + r.param), size.height * (1 + r.param))
                .write(file, ()=>{
                    cb();
                })
        });
    }
    _dule_scaleFit(file, size, r, cb) {
        // Editor.log(`[scaleFit][${r.width}*${r.height}]${file}`);
        Jimp.read(file, (err, img) => {
            img
                .scaleToFit(r.width, r.height)
                .write(file, ()=>{
                    cb();
                });
        });
    }
    finishOut(log){
        let cfg = {};
        log.forEach((d)=>{
            // Editor.warn(d.file);
            if( d.file.indexOf('assets/resources/dynamic/extend/furnitures/textures') > 0 ){
                const name = path.basename(d.file, '.png');
                let sizeFrom = d.sizeFrom;
                if( !sizeFrom && this.sizeCfg[name] ){
                    sizeFrom = this.sizeCfg[name].sizeFrom;
                }
                cfg[name] = {
                    sizeFrom: sizeFrom,
                    sizeTo: d.sizeTo
                };
            }
        });
        fs.writeFileSync( outFile, `export default ${JSON.stringify(cfg, null, 4)}` );
        Editor.assetdb.refresh(`db://assets/script/data/config/config.furnitures_size.ts`);
    }

}
module.exports = function () {
    new Work();
}