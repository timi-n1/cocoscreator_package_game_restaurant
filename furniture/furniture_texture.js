const parseXlsx = require('excel').default;
const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { exec, spawn } = require('child_process');
const Jimp = require("jimp");
const os = require('os');
const outPath = 'dynamic/extend/furnitures';

class FurnitureMaker {

    constructor() {
        this.jsonCache = {};
        this.cwd = {
            furnitures: path.resolve(Editor.projectInfo.path, '../art/furnitures')
        };
        this.start = Date.now();
        this.entryList = this.findAllEntry();
        this.makeAllNormal(() => {
            const total = Date.now() - this.start;
            Editor.success(`共${this.entryList.length}个工程全部完成!总用时${(total / 1000).toFixed(1)}s, 平局用时${(total / (this.entryList.length * 1000)).toFixed(1)}s`);
        });

    }

    findAllEntry() {
        const ret = [];
        const list = glob.sync(`${this.cwd.furnitures}/*`, {});
        list.forEach((dir) => {
            const stat = fs.statSync(dir);
            if (stat.isDirectory()) {
                const basename = path.basename(dir);
                const tex = glob.sync(`${dir}/${basename}.png`, {});
                if (tex && tex.length == 1) {
                    let json = {
                        basename: basename,
                        basePath: dir
                    };
                    ret.push(json);
                }
            }
        });
        return ret;
    }

    makeAllNormal(done) {
        async.eachOfSeries(this.entryList, (entry, index, cb) => {
            if (entry.isSpine) {
                cb();
                return;
            }

            let fileImage = path.resolve(entry.basePath, `${entry.basename}.png`);
            let fileImageThumb = path.resolve(entry.basePath, `thumb.png`);
            let fileBig = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/${entry.basename}.png`);
            let fileIcon = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/thumb.png`);
            let scaleRate = 1386 / 4872;
            let isCustomIcon = false;
            let isMulti = false;

            async.parallel([
                (cb0) => {
                    async.eachOfSeries([1, 2, 3, 4, 5, 6], (index0, i, cb9) => {
                        const f = path.resolve(entry.basePath, `${index0}.png`);
                        if (fs.existsSync(f)) {
                            isMulti = true;
                            Jimp.read(f, (err, lenna) => {
                                if (err) throw err;
                                lenna
                                    .scale(scaleRate)
                                    .write(path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/textures/${entry.basename}/${index0}.png`), () => {
                                        lenna = null;
                                        // this._refreshMulti(entry.basename, index0);
                                        setImmediate(cb9);
                                    });
                            });
                        }
                        else {
                            setImmediate(cb9);
                        }
                    }, () => {
                        setImmediate(cb0);
                    });
                },
                (cb0) => {
                    if (isMulti) {
                        cb0();
                        return;
                    }
                    //大图
                    Jimp.read(fileImage, (err, lenna) => {
                        if (err) throw err;
                        lenna
                            .scale(scaleRate)
                            .write(fileBig, () => {
                                lenna = null;
                                setImmediate(cb0);
                            });
                    });
                },
                (cb0) => {
                    //icon，先查找是否有thumb.png1
                    if (fs.existsSync(fileImageThumb)) {
                        fs.copySync(fileImageThumb, fileIcon);
                        isCustomIcon = true;
                        setImmediate(cb0);
                    }
                    else {
                        Jimp.read(fileImage, (err, lenna) => {
                            if (err) throw err;
                            lenna
                                .scaleToFit(190, 145)
                                .write(fileIcon, () => {
                                    lenna = null;
                                    setImmediate(cb0);
                                });
                        });
                    }
                }
            ], () => {
                setImmediate(() => {
                    // this._refreshTexture(entry.basename);
                    Editor[(isCustomIcon || isMulti) ? 'warn' : 'log'](`[家具]${entry.basename}`);
                    setImmediate(cb);
                });
            });

        }, () => {
            done();
        });
    }

    _refreshTexture(name) {
        const basedir = `assets/resources/${outPath}/textures`;
        Editor.assetdb.refresh(`db://${basedir}/${name}`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/thumb.png`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/${name}.png`);
    }

    _refreshMulti(name, i) {
        const basedir = `assets/resources/${outPath}/textures`;
        Editor.assetdb.refresh(`db://${basedir}/${name}/${i}.png`);
    }

}

module.exports = function () {
    new FurnitureMaker();
}