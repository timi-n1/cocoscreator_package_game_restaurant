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
        this.data = {};
        //数字数组
        this.make();
    }

    make() {
        glob(`${cwd}/checkout/*.*`, {}, (er, files) => {
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
                Editor.log(this.data);
                const outfile = this.getOutputPath();
                const retStr = jsonFormat(this.data, { type: 'space' });
                fs.writeFileSync(outfile, `export default ${retStr}`);
                Editor.success(`完成`);
                setTimeout(() => {
                    Editor.assetdb.refresh(`db://assets/script/data/config/config.checkout.ts`);
                    this.upload(`config.checkout.js`, this.data);
                }, 1000);
            });
        });
    }

    parseExel(file, filename, done) {
        parseXlsx(file).then((data) => {
            const ret = [];
            data.forEach((d, i)=>{
                ret.push(d[0]);
            });
           
            this.data[filename] = ret;
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
        return path.resolve(Editor.projectInfo.path, `./assets/script/data/config/config.checkout.ts`);
    }

}

module.exports = function (innerUploadUrl) {
    new ExcelMaker(innerUploadUrl);
}