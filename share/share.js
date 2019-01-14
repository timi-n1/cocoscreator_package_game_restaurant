const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { exec, spawn } = require('child_process');
const sizeOf = require('image-size');
const projectPath = '/Volumes/SamsungT5/cocos_creator/restaurant/restaurant';

class ToysMaker {

    constructor() {
        this.cwd = {
            category: path.resolve(projectPath, '../art/food')
        };
        this.start = Date.now();
        this.entryList = this.findAllEntry();
        this.makeAllNormal(() => {
            const total = Date.now() - this.start;
            console.log(`共${this.entryList.length}个工程全部完成!总用时${(total / 1000).toFixed(1)}s, 平局用时${(total / (this.entryList.length * 1000)).toFixed(1)}s`);
        });
    }

    findAllEntry() {
        const ret = [];
        const list = glob.sync(`${this.cwd.category}/*`, {});
        list.forEach((dir) => {
            const stat = fs.statSync(dir);
            if (stat.isDirectory()) {
                const basename = path.basename(dir);
                const thumb = glob.sync(`${dir}/${basename}.png`, {});
                if (thumb && thumb.length == 1) {
                    ret.push({
                        basename: basename,
                        basePath: dir
                    });
                }
            }
        });
        return ret;
    }

    makeAllNormal(done) {
        async.eachOfSeries(this.entryList, (entry, index, cb) => {
            let bg = path.resolve(__dirname, './bg.jpg');
            let inFile = `${entry.basePath}/${entry.basename}.png`;
            let outFile = path.resolve(projectPath, `./assets/resources/dynamic/images/share/share_food_${entry.basename}.png`);
            let dimensions = sizeOf(inFile);

            let w = 360;//430
            let h = 286;//336
            let wrate = dimensions.width/w;
            let hrate = dimensions.height/h;
            let rate = Math.max(wrate, hrate);

            let x = ((430-dimensions.width/rate)/2+10).toFixed(0);
            let y = ((336-dimensions.height/rate)/2+20).toFixed(0);

            let cmd = `convert "${bg}" -compose over "${inFile}" -geometry ${w}x${h}+${x}+${y} -composite "${outFile}"`;
            exec(cmd, {cwd: '/Applications/ImageMagick-7.0.8/bin'}, (err) => {
                console.log(entry.basename+' -> '+err + ` - ${x},${y}`);
                cb();
            })
        }, () => {
            done();
        });
    }

}

new ToysMaker();