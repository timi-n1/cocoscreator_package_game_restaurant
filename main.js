'use strict';

let buildPath = null;
let thisProjectName = 'restaurant';

var isOK = function(done){
    const path = require('path');
    const fs = require('fs-extra');
    const packagePath = path.resolve(Editor.projectInfo.path, `./package.json`);
    const json = JSON.parse( fs.readFileSync(packagePath).toString() );
    if( json.name == thisProjectName ){
        done && done();
    }
    else{
        Editor.error(`该项目为${json.name}，插件绑定项目为${thisProjectName}`);
    }
};

var getInnerUploadUrl = function(){
    const path = require('path');
    const fs = require('fs-extra');
    const packagePath = path.resolve(Editor.projectInfo.path, `./package.json`);
    const json = JSON.parse( fs.readFileSync(packagePath).toString() );
    if( json.innerUploadUrl ){
        return json.innerUploadUrl;
    }
    else{
        Editor.error(`找不到innerUploadUrl字段`);
        return '';
    }
};

module.exports = {
    load() {
        // 当 package 被正确加载的时候执行
    },

    unload() {
        // 当 package 被正确卸载的时候执行
    },

    messages: {
        'config_xlsx'() {
            isOK(()=>{
                require('./excel/excel')( getInnerUploadUrl() );
            });
        },
        'checkout_xlsx'(){
            isOK(()=>{
                require('./excel/checkout_excel')( getInnerUploadUrl() ); 
            });
        },
        'task_xlsx'(){
            isOK(()=>{
                require('./excel/task_excel')( getInnerUploadUrl() ); 
            });
        },
        'story_xlsx'(){
            isOK(()=>{
                require('./excel/story_excel')( getInnerUploadUrl() ); 
            });
        },
        'furnitures_buff_xlsx'(){
            isOK(()=>{
                require('./excel/furnitures_buff_excel')( getInnerUploadUrl() ); 
            });
        },
        'config_position'() {
            isOK(()=>{
                require('./yardconfig/index')( getInnerUploadUrl() ); 
            });
        },
        'guest_spine'() {
            isOK(()=>{
                require('./guest_spine/spine')(); 
            });
        },
        // 'spine_texture_maker'() {
        //     require('./cats_alive/spine_texture')();
        // },
        'furniture_maker'() {
            isOK(()=>{
                require('./furniture/furniture_texture')();
            });
        },
        'food_maker'() {
            isOK(()=>{
                require('./food/food_maker')();
            });
        },
        // 'food_texture_maker'() {
        //     require('./food/food_maker')();
        // },
        'guest_list_maker'() {
            isOK(()=>{
                require('./guest_list_maker/index')(); 
            });
        },
        'editor:build-start'(evt, data) {
            buildPath = `${data.dest}`;
            const path = require('path');
            const fs = require('fs');
            if (fs.existsSync(path.resolve(__dirname, './autobuild.txt'))) {
                const file = path.resolve(Editor.projectInfo.path, `./assets/lib/const-manager.js`);
                const txt = fs.readFileSync(file).toString();
                const build = parseInt(txt.match(/\"BUILD\"\:\s\"(\d+)\"/)[1], 10) + 1;
                const newtxt = txt.replace(/\"BUILD\"\:\s\"\d+\"/, `"BUILD": "${build}"`)
                Editor.success('build=' + build);
                fs.writeFileSync(file, newtxt);
            }
        }
    },
};