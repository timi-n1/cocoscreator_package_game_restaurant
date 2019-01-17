
// const PImage = require('pureimage');
// const fs = require('fs-extra');
// const path = require('path');

// var canvas = PImage.make(430, 336);
// var context = canvas.getContext('2d');
// const MedalSize = 250;

// PImage.decodePNGFromStream(fs.createReadStream('./share_medal_bg.png')).then((img)=>{
//     console.log('img size is', img.width, img.height);
//     //context.drawImage(img, 0, 0);
//     return PImage.decodePNGFromStream(fs.createReadStream('./food_medal_1.png'));
// }).then((img)=>{
//     console.log('img size is', img.width, img.height);
//     context.drawImage(img, 0, 0/*, img.width, img.height, 90, 35, MedalSize, MedalSize*/);
// }).then(()=>{
//     let filePath = path.join(__dirname, 'test.png');
//     PImage.encodePNGToStream(canvas, fs.createWriteStream(filePath)).then(()=>{
//         console.log('done');
//     })
// });

// let resUrlList = [];
// let imageList = [];
// let imageCount = 0;
// resUrlList.push(cs.CP.getMd5Url(AchievementHelper.getMedalShareBgImagePath()));
// let url = cs.CP.getMd5Url(AchievementHelper.getMedalImagePath(this._id, this._level));
// resUrlList.push(url);
// if(this._id > 1000){
//     resUrlList.push(cs.CP.getMd5Url(FoodHelper.getFoodImagePath(this._id)));
// }
// let loadImageDone= ()=>{
//     console.log('loadImageDone');
//     context.drawImage(imageList[0], 0, 0);
//     const MedalSize = 250;
//     if(this._id>1000){
//         context.drawImage(imageList[1], 90, 35, MedalSize, MedalSize);
//         let image = imageList[2];
//         context.drawImage(image, 90+(MedalSize-image.width)/2, 35+(MedalSize-image.height)/2);
//     }else{
//         context.drawImage(imageList[1], 90, 35, MedalSize, MedalSize);
//         // context.fillStyle = 'red';
//         // context.font = '30px Arial';
//         // context.fillText(this.titleLabel.string, 50, 50);
//     }
//     canvas.toTempFilePath({
//         success: ( res ) => {
//             console.log(res);
//             cs.CP.share({
//                 title: shareText,
//                 imageUrl: res.tempFilePath,
//                 query: ''
//             });
//         },
//         fail: ( err )=>{
//             //生成个性图片失败，展示默认图，不影响功能
//             console.log('保存canvas到本地失败'+JSON.stringify(err) );
//         }
//     });

// }
// for(let i = 0; i < resUrlList.length; i++){
//     const image = wx.createImage();
//     imageList.push(image);
//     image.onload = ()=> {
//         console.log(image.width, image.height);
//         imageCount++;
//         if(imageCount == imageList.length){
//             loadImageDone();
//         }
//     };
//     image.src = resUrlList[i];
// }

const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");
const { exec, spawn } = require('child_process');
const sizeOf = require('image-size');
const projectPath = path.resolve(__dirname, '../../../');
//console.log(projectPath);
const customMedalDir = path.resolve(__dirname, './test')//path.resolve(projectPath, './assets/resources/dynamic/extend/medal/textures/custom');
const outDir = path.resolve(projectPath, `./assets/resources/dynamic/images/share`);

function searchCustomMedal(){
    const result = [];
    const list = glob.sync(`${customMedalDir}/*.png`, {});
    console.log(list);
    list.forEach((dir) => {
        const stat = fs.statSync(dir);
        if (stat.isFile()) {
            const basename = path.basename(dir, '.png');
            result.push({
                basename: basename,
                basePath: customMedalDir
            })
        }
    });
    return result;
}

function mergeAllCunstomMedals(){
    let entryList = searchCustomMedal();
    let bgPath = path.resolve(__dirname, './share_medal_bg.png');
    console.log(bgPath, entryList);
    mergeImgList(bgPath, "", entryList, ()=>{
        console.log('all done');
    })
}

function mergeAllFoodMedals(){

}

function mergeImgList(bg, ext, entryList, done) {
    async.eachOfSeries(entryList, (entry, index, cb) => {
        let inFile = `${entry.basePath}/${entry.basename}.png`;
        let outFile = path.resolve('./test', `./medal_share_${entry.basename}${ext}.png`);
        let dimensions = sizeOf(inFile);
        let dimensions2 = sizeOf(bg);

        let w = 250;//430
        let h = 250;//336
        let wrate = dimensions.width/w;
        let hrate = dimensions.height/h;
        let rate = Math.max(wrate, hrate);

        let x = ((430-dimensions.width/rate)/2+0).toFixed(0);
        let y = ((336-dimensions.height/rate)/2+0).toFixed(0);

        let cmd = `convert "${bg}" -compose over "${inFile}" -geometry ${w}x${h}+${x}+${y} -composite "${outFile}"`;
        // console.log('efg--', dimensions2.width, dimensions2.height);
        // console.log('abc--', dimensions.width, dimensions.height);
        // console.log('---', inFile, ', ', outFile, '--', cmd);
        console.log('---', cmd);
        exec(cmd, /*{cwd: '/Applications/ImageMagick-7.0.8/bin'},*/ (err) => {
            console.log(entry.basename+' -> '+err + ` - ${x},${y}`);
            cb();
        })
    }, () => {
        done();
    });

}

mergeAllCunstomMedals();


