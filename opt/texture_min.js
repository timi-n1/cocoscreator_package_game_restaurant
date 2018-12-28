const fs = require('fs-extra');
const async = require('async');
const path = require('path');
const Jimp = require('jimp');
const sizeOf = require('image-size');
const os = require('os');
const configFile = path.resolve(__dirname, './config.json');


class Work {

    constructor() {
        this.outLog = [];
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
            // Editor.warn(this.outLog);
            this.finishOut(this.outLog);
            Editor.success('全部完成!');
        });
    }
    duel(cfg, done) {
        async.eachOfSeries(cfg.filter, (file0, i, cb) => {
            const file = path.resolve(Editor.projectInfo.path, cfg.basepath, file0);
            if (fs.existsSync(file)) {
                // Editor.warn(file);
                this._dule(file, cfg.rule, cfg.limit, () => {
                    const originFile = this._originFile(file);
                    Editor.log(fs.existsSync(originFile), originFile);
                    fs.existsSync(originFile) && this.outLog.push({
                        file: file,
                        sizeFrom: sizeOf(originFile),
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
            // fs.copySync(file, path.resolve(__dirname, `./temp/${encodeURIComponent(file)}`));
            done();
            return;
        }
        async.eachOfSeries(rule, (r, i, cb) => {
            if (this[`_dule_${r.method}`]) {
                fs.copySync(file, this._originFile(file));
                this[`_dule_${r.method}`](file, size, r, cb);
            }
            else {
                Editor.warn(r.method + '未定义');
                cb();
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
        Editor.log(`[scaleBy][${r.param}]${file}`);
        Jimp.read(file, (err, img) => {
            img
                .resize(size.width * (1 + r.param), size.height * (1 + r.param))
                .write(file, ()=>{
                    cb();
                })
        });
    }
    _dule_scaleFit(file, size, r, cb) {
        Editor.log(`[scaleFit][${r.width}*${r.height}]${file}`);
        Jimp.read(file, (err, img) => {
            img
                .scaleToFit(r.width, r.height)
                .write(file, ()=>{
                    cb();
                });
        });
    }
    _originFile(file){
        return path.resolve(os.tmpdir(), `./a/restaurant/texture_min/${encodeURIComponent(file)}`);
    }
    finishOut(log){
        let cfg = {};
        log.forEach((d)=>{
            // Editor.warn(d.file);
            if( d.file.indexOf('assets/resources/dynamic/extend/furnitures/textures') > 0 ){
                const name = path.basename(d.file, '.png');
                cfg[name] = {
                    sizeFrom: d.sizeFrom,
                    sizeTo: d.sizeTo
                };
            }
        });
        fs.writeFileSync( path.resolve(Editor.projectInfo.path, './assets/script/data/config/config.furnitures_size.ts'), `export default ${JSON.stringify(cfg, null, 4)}` );
        Editor.assetdb.refresh(`db://assets/script/data/config/config.furnitures_size.ts`);
    }

}
module.exports = function () {
    new Work();
}