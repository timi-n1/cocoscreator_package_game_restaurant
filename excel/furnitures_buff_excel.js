const parseXlsx = require('excel').default;
const jsonFormat = require('json-format');
const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const cwd = path.resolve(__dirname, '../../../../config');
const async = require("async");
const request = require('request');

class ExcelMaker {

    constructor(innerUploadUrl) {
        this.innerUploadUrl = innerUploadUrl;
        this.data = [];
        //数字数组
        this.keyInt = ['effects_type'];
        this.make();
    }

    make() {
        glob(`${cwd}/furnitures_buff.xlsx`, {}, (er, files) => {
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
                this.parseExel(file, filename, () => {
                    cb();
                });
            }, () => {
                // Editor.log(this.data);
                const outfile = this.getOutputPath();
                const retStr = jsonFormat(this.data, { type: 'space' });
                fs.writeFileSync(outfile, `export default ${retStr}`);
                Editor.success(`完成`);
                // setTimeout(() => {
                //     Editor.assetdb.refresh(`db://assets/script/data/config/config.furnitures_buff.ts`);
                //     this.upload(`config.furnitures_buff.js`, this.data);
                // }, 1000);
            });
        });
    }

    parseExel(file, filename, done) {
        parseXlsx(file).then((data) => {
            let index2keyMap = {};
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
                        /*
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
                        */
                    });

                }
            })
            this.data = data.slice(0);
            Editor.success(`[成功]${filename}`);
            setTimeout(() => {
                done();
            }, 50);
        });
    }

    upload(filename, data, done) {
        request.post(`${this.innerUploadUrl}/n/restaurant/config`, { form: { filename: filename, data: JSON.stringify(data) } }, (err, httpResponse, body) => {
            Editor.log('上传到后台:' + body);
            done && done();
        });
    }

    getOutputPath() {
        return path.resolve(Editor.projectInfo.path, `./assets/script/data/config/config.furnitures_buff.ts`);
    }

}

module.exports = function (innerUploadUrl) {
    new ExcelMaker(innerUploadUrl);
}