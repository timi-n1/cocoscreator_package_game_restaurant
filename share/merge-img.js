

const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { exec, spawn } = require('child_process');
const sizeOf = require('image-size');
const projectPath = path.resolve(__dirname, '../../../');
const customMedalDir = path.resolve(projectPath, './assets/resources/dynamic/extend/medal/textures/custom');
const foodMedalDir = path.resolve(projectPath, './assets/resources/dynamic/extend/medal/textures/food/big');
const foodDir = path.resolve(projectPath, './assets/resources/dynamic/extend/food/textures/');
const shareOutDir = path.resolve(projectPath, `./assets/resources/dynamic/images/share/medal`);
const foodMedalOutDir = path.resolve(__dirname, './temp');

function searchCustomMedal(){
    const result = [];
    const list = glob.sync(`${customMedalDir}/*.png`, {});
    //console.log(list);
    list.forEach((dir) => {
        const stat = fs.statSync(dir);
        if (stat.isFile()) {
            const basename = path.basename(dir, '.png');
            result.push({
                basename: basename,
                basePath: customMedalDir,
                filename: basename
            })
        }
    });
    return result;
}

function searchFoodMedal(){
    const result = [];
    const list = glob.sync(`${foodMedalDir}/*.png`, {});
    //console.log(list);
    list.forEach((dir) => {
        const stat = fs.statSync(dir);
        if (stat.isFile()) {
            const basename = path.basename(dir, '.png');
            result.push({
                basename: basename,
                basePath: foodMedalDir,
                filename: basename
            })
        }
    });
    return result;
}

function searchAllFoods(){
    const result = [];
    const list = glob.sync(`${foodDir}/*`, {});
    list.forEach((dir) => {
        const stat = fs.statSync(dir);
        if (stat.isDirectory()) {
            const basename = path.basename(dir);
            const thumb = glob.sync(`${dir}/thumb.png`, {});
            if (thumb && thumb.length == 1) {
                result.push({
                    basename: basename,
                    basePath: dir,
                    filename: 'thumb'
                });
            }
        }
    });
    return result;
}

function mergeAllCunstomMedals(done){
    let entryList = searchCustomMedal();
    let bgPath = path.resolve(__dirname, './share_medal_bg.png');
    //console.log(bgPath, entryList);
    mergeImgList(bgPath, 'share_', "", entryList, shareOutDir, ()=>{
        //console.log('all done');
        done();
    })
}

function mergeAllFoodMedals(done){
    let entryList = searchFoodMedal();
    let bgPath = path.resolve(__dirname, './share_medal_bg.png');
    mergeImgList(bgPath, 'share_', "", entryList, foodMedalOutDir, ()=>{
        //console.log('all done');
        let foodList = searchAllFoods();
        async.eachOfSeries(entryList, (entry, index, cb) => {
            let bg = path.resolve(foodMedalOutDir, `./medal_share_${entry.basename}.png`);
            mergeImgList(bg, `share_${entry.basename}_`, '', foodList, shareOutDir, ()=>{
                cb();
            }, true);
        }, () => {
            done();
        });
    })
}

function mergeImgList(bg, prefix, ext, entryList, outDir, done, forbidScale) {
    async.eachOfSeries(entryList, (entry, index, cb) => {
        let inFile = `${entry.basePath}/${entry.filename}.png`;
        let outFile = path.resolve(outDir, `./${prefix}${entry.basename}${ext}.png`);
        let dimensions = sizeOf(inFile);
        //let dimensions2 = sizeOf(bg);

        let w = 250;//430
        let h = 250;//336
        let wrate = dimensions.width/w;
        let hrate = dimensions.height/h;
        let rate = Math.max(wrate, hrate);

        let x = ((430-dimensions.width/rate)/2+0).toFixed(0);
        let y = ((336-dimensions.height/rate)/2+0).toFixed(0);
        if(forbidScale){
            w = dimensions.width;
            h = dimensions.height;
            x = ((430-w)/2).toFixed(0);
            y = ((336-h)/2+10).toFixed(0);
        }

        let cmd = `convert "${bg}" -compose over "${inFile}" -geometry ${w}x${h}+${x}+${y} -composite "${outFile}"`;
        // console.log('efg--', dimensions2.width, dimensions2.height);
        // console.log('abc--', dimensions.width, dimensions.height);
        // console.log('---', inFile, ', ', outFile, '--', cmd);
        //console.log('---', cmd);
        exec(cmd, /*{cwd: '/Applications/ImageMagick-7.0.8/bin'},*/ (err) => {
            console.log(entry.basename+' -> '+err + ` - ${x},${y}`);
            cb();
        })
    }, () => {
        done();
    });

}

mergeAllCunstomMedals(()=>{
    mergeAllFoodMedals(()=>{
        console.log('all done!');
    });
});


