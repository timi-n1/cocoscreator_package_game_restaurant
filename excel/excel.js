const parseXlsx = require('excel').default;
const jsonFormat = require('json-format');
const fs = require('fs');
const path = require('path');
const glob = require("glob");
const cwd = path.resolve(__dirname, '../../../../config');
const async = require("async");
const request = require('request');
let defaultCNTxt = '';

class ExcelMaker {

    constructor(innerUploadUrl) {
        this.innerUploadUrl = innerUploadUrl;
        // defaultCNTxt = fs.readFileSync(path.resolve(Editor.projectInfo.path, `./assets-origin/bmfont/cntxt.default.txt`)).toString().replace(/\n/g, '');
        //数字数组
        this.IntExcels = ['furnitures_bought'];
        //字符集
        this.cnConfig = {
            anima: ['desc'],
            cats_category: ['name'],
            furnitures: ['name'],
            toys: ['name'],
            food: ['name'],
            task: ['talk_btn1', 'talk_btn2', 'talk_btn3', 'complete_btn1', 'complete_btn2', 'complete_btn3']
        };
        this.cnCache = {};
        //简要中文
        this.keyListSimple = ['talk_btn1', 'talk_btn2', 'talk_btn3', 'complete_btn1', 'complete_btn2', 'complete_btn3'];
        this.cnCacheSimple = {};
        this.keyInt = ['id', 'pid', 'price', 'type', 'sub_type', 'pose_ids', 'ancient', 'modern', 'east', 'west', 'toy_sub_type', 'rare', 'intimacy', 'award', 'character', 'dispatch', 'cat_type', 'play_time', 'is_skin', 'sampleCatId', 'torso_offsetx', 'torso_offsety', 'is_multi', 'stock_price', 'bonus_price', 'sour', 'sweet', 'bitter', 'spicy', 'oa_unlock', 'effects_type', 'effects', 'learn_time', 'show_order', "scores", "level1", "level2", "level3",'unlock_fid', 'unlock_fid_level','level','cooking_exp','update_exp','food_quality'];

        this.keyFloat = ['anchorx', 'anchory','price_addition'];
        this.keyIntArray = ['id_list', 'anima_list', 'yard_type', 'story_list', 'intimacy_list', 'like_food'];//默认按照,(半角)分割
        this.keyStringArray = ['message_list'];//消息数组
        this.make();
    }

    make() {
        glob(`${cwd}/*.*`, {}, (er, files) => {
            async.eachOfSeries(files, (file, index, cb) => {
                if (file.indexOf('xlsx') < 0) {
                    cb();
                    return;
                }
                const basename = path.basename(file).split('.');
                const filename = basename[0];
                if (filename.charAt(0) == '~' && filename.charAt(1) == '$') {
                    cb();
                    return;
                }
                if( this.IntExcels.includes(filename) ){
                    parseXlsx(file).then((data)=>{
                        const ret = [];
                        data.forEach((d)=>{
                            if( d == '' ){
                                return;
                            }
                            const val = parseInt(d[0], 10);
                            if( isNaN(val) ){
                                return;
                            }
                            ret.push(val);
                        });
                        const datastring = `export default ${jsonFormat(ret, { type: 'space' })}`;
                        fs.writeFileSync(this.getOutputPath(filename), datastring);
                        Editor.success(`[成功]${filename}`);
                        setTimeout(() => {
                            Editor.assetdb.refresh(`db://assets/script/data/config/config.${filename}.ts`);
                            this.upload(`config.${filename}.js`, JSON.stringify(ret), () => {
                                cb();
                            });
                        }, 1000);
                    });
                }
                else{
                    this.parseExel(file, filename, (datastring) => {
                        this.upload(`config.${filename}.js`, datastring, () => {
                            cb();
                        });
                    });
                }
            }, () => {
                const alltxt = defaultCNTxt + Object.keys(this.cnCache).join('');
                const simpletxt = defaultCNTxt + Object.keys(this.cnCacheSimple).join('');
                Editor.log(`字符集(共${alltxt.length}字)=`, alltxt);
                fs.writeFileSync(this.getCNTxtPath(), alltxt);
                fs.writeFileSync(this.getSimpleCNTxtPath(), simpletxt);
            });
        });
    }

    parseExel(file, filename, done) {
        const chrConifg = this.cnConfig[filename];
        parseXlsx(file).then((data) => {
            let index2keyMap = {};
            if( filename == 'furnitures' ){
                data = data.filter((val)=>{
                    return val[0] !== '';
                });
            }
            data.forEach((d, i) => {
                if (i == 0) {
                    d.forEach((key, index) => {
                        index2keyMap[index] = key;
                    });
                }
                if (i > 0) {
                    d.forEach((val, index) => {
                        const key = index2keyMap[index];
                        if (this.keyInt.includes(key)) {
                            data[i][index] = parseInt((val || '0'), 10);
                        }
                        else if (this.keyFloat.includes(key)) {
                            data[i][index] = parseFloat((val || '0.0'), 10);
                        }
                        else if (this.keyIntArray.includes(key)) {
                            var temp = val.split(',');
                            var arr = [];
                            temp.forEach((chr) => {
                                chr && arr.push(parseInt(chr, 10));
                            });
                            data[i][index] = arr;
                        }else if(this.keyStringArray.includes(key)){
                            var temp = val.split('+');
                            var arr = [];
                            temp.forEach((chr) => {
                                chr && arr.push(chr);
                            });
                            data[i][index] = arr;
                        }
                        if (val && chrConifg && chrConifg.includes(key)) {
                            val.split('').forEach((chr) => {
                                this.cnCache[chr] = true;
                                if( this.keyListSimple.includes(key) ){
                                    this.cnCacheSimple[chr] = true;
                                }
                            });
                        }
                    });

                }
            })
            let localData = data.slice(0);
            if( filename == 'guest_category' ){
                localData.push([
                    10000,
                    "不显示",
                    "lonely_grandma",
                    "独居的老奶奶，记性有点差，很担心她能不能照顾好自己。",
                    "1",
                    [2006],
                    [6001,6002,6003,6004,6005,6006,6007,6008,6009,6010],
                    [1,5,10,20,30,45,60,75,88,100],
                    9,
                    -22,
                    1,
                    1,
                    1,
                    1
                ]);
            }
            fs.writeFileSync(this.getOutputPath(filename), `export default ${jsonFormat(localData, { type: 'space' })}`);
            Editor.success(`[成功]${filename}`);
            setTimeout(() => {
                Editor.assetdb.refresh(`db://assets/script/data/config/config.${filename}.ts`);
                done(JSON.stringify(data));
            }, 1000);
        });
    }

    upload(filename, data, done) {
        request.post(`${this.innerUploadUrl}/n/restaurant/config`, { form: { filename: filename, data: data } }, (err, httpResponse, body) => {
            Editor.log('上传到后台:' + body);
            done();
        });
    }

    getOutputPath(filename) {
        return path.resolve(Editor.projectInfo.path, `./assets/script/data/config/config.${filename}.ts`);
    }

    getCNTxtPath() {
        return path.resolve(Editor.projectInfo.path, `./assets-origin/bmfont/cntxt.txt`);
    }

    getSimpleCNTxtPath() {
        return path.resolve(Editor.projectInfo.path, `./assets-origin/bmfont/cntxt_simple.txt`);
    }

}

module.exports = function (innerUploadUrl) {
    new ExcelMaker(innerUploadUrl);
}