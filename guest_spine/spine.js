const parseXlsx = require('excel').default;
const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { spawn } = require('child_process');
const Jimp = require("jimp");

const outPath = 'dynamic/extend/guest_spine';
const scaleNum = 0.2;

class SpineMaker {

    constructor() {
        this.cwd = {
            spine: path.resolve(Editor.projectInfo.path, '../art/guest_spine')
        };
        this.entryList = this.findAllEntry();
        this.start = Date.now();
        // Editor.log(this.entryList);
        this.makeAllSpineProject(()=>{
            const total = Date.now() - this.start;
            Editor.success(`共${this.entryList.length}个工程全部完成!总用时${(total/1000).toFixed(1)}s, 平局用时${(total/(this.entryList.length*1000)).toFixed(1)}s`);
        });
    }

    findAllEntry() {
        const ret = [];
        const list = glob.sync(`${this.cwd.spine}/*`, {});
        list.forEach((dir)=>{
            const stat = fs.statSync(dir);
            if( stat.isDirectory() ){
                const spineList = glob.sync(`${dir}/*.spine`, {});
                if( spineList && spineList.length == 1 ){
                    const json = {
                        fullpath: dir,
                        basename: path.basename(dir),
                        spineproject: spineList[0],
                    };
                    ret.push(json);
                }
            }
        });
        return ret;
    }

    makeAllSpineProject(done){
        async.eachOfSeries(this.entryList, (entry, index, cb)=>{
            const torsoSource = path.resolve(entry.fullpath, './images/torso.png');
            const torsoDist = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/texture/${entry.basename}/torso.png`);
            const torsoDist2 = path.resolve(Editor.projectInfo.path, `./temp/torso.png`);
            //移动躯干素材
            fs.copySync(torsoSource, torsoDist2);
            Jimp.read(torsoSource, (err, lenna) => {
                if (err) throw err;
                lenna.scale(scaleNum).write(torsoDist);
                //本地躯干清空
                fs.copySync(path.resolve(__dirname, './empty.png'), torsoSource);
                //导出spine工程
                const outtemp = path.resolve(Editor.projectInfo.path, `./assets/resources/${outPath}/skeletondata/${entry.basename}`);
                const ls = spawn('/Applications/Spine/Spine.app/Contents/MacOS/Spine', [
                    '--proxy', 'web-proxy.oa.com:8080',
                    '-i', entry.spineproject,
                    '-o', outtemp,
                    '-e', path.resolve(__dirname, './export.json')
                ]);

                ls.stdout.on('data', (data) => {
                    if( data && data.length > 2 ){
                        // Editor.log(`spine: ${data}`);
                    }
                });

                ls.stderr.on('data', (data) => {
                    Editor.log(`spine: ${data}`);
                });
                
                ls.on('close', (code) => {
                    // 恢复躯干
                    fs.copySync(torsoDist2, torsoSource);
                    this._refreshJson(entry.basename);
                    Editor.success(`[${index+1}/${this.entryList.length}]${entry.spineproject}成功!`);
                    setImmediate(cb);
                });
            });
        }, ()=>{
            done();
        });
    }

    _refreshJson(name){
        const basedir = `assets/resources/${outPath}/skeletondata`;
        Editor.assetdb.refresh(`db://${basedir}/${name}`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/${name}.json`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/${name}.atlas`);
        Editor.assetdb.refresh(`db://${basedir}/${name}/${name}.png`);
        Editor.assetdb.refresh(`db://assets/resources/${outPath}/texture/${name}/torso.png`);
    }

}

module.exports = function () {
    new SpineMaker();
}
