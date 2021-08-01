
export function loadFile(fileName) {
    const _fs = require('fs');
    const _path = require('path');
    try {
        return  _fs.readFileSync(_path.resolve(__dirname,fileName),'utf-8');
    }catch (e){
        console.log('loadFile:',fileName,' Not found',e)
        return  ''
    }
}
