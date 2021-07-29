// Author Weslley <we.desouza@hotmail.com>
import * as  fs from 'fs';
import * as  Path from 'path';

const { exec } = require('child_process');

export namespace Nginx{

    export class Server {

        private port:number = 443;

        private didChangeFile = false;

        private file:File      = new File(this);

        private blocks:Block[] = [];

        constructor(private serverName, private serviceName){}

        public getHttpPort():string{
            return this.port + '';
        }

        public getServerUrl(){
            return this.serverName;
        }

        public getReverseProxyPort():string{
            return ''
        }

        public createBlock(type:string,path:string,config:{headers?:any[]}){

            const block = new Block(type,path);

            if(config.headers){
                config.headers.forEach( head =>
                    block.addHeader(head.key,head.value))
            }

            this.blocks.push(block)
        }

        public reloadConfig(force = false) {
            if( this.didChangeFile || force ){
                if(File.isWindows()){
                    exec('C:\\nginx\\nginx -s reload')
                }else exec('sudo /etc/init.d/nginx reload');
            }
        }

        private createServerContent():string{
            return `
#${this.serviceName}            
####################################################
server {
    listen [HTTPPORT];
    server_name  *.[URL] [URL];        
[BLOCKS]
}
            `
                .replace('[HTTPPORT]',this.getHttpPort())
                .replace('[URL]',     this.getServerUrl())
                .replace('[URL]',     this.getServerUrl())
        }

        public render(){
            let serverBlock = this.createServerContent();
            let filePath = `
    #Files
    location / {
        add_header 'Service-Worker-Allowed' '/';
        alias /var/www/projects/bi-tool/frontend/;
        try_files $uri $uri/ /index.html;
    }`
            serverBlock     = serverBlock.replace('[BLOCKS]', `[BLOCKS]
${filePath}`);

            let blocks      = '';
            this.blocks.forEach(block => blocks+= block.render());

            return serverBlock.replace('[BLOCKS]',blocks);
        }

        public renderAndSave(reload = false){
            this.didChangeFile = true
            const content = this.render();
            this.file.writeFileSync(content)
            if(reload)this.reloadConfig()
        }

        public getServiceName(){
            return this.serviceName
        }
    }

    class Block{

        private headers:{ key:string,value:string }[] = []

        private block = `
    ${this.type} ${this.path} {
[CONTENT]
    }
        `;

        constructor(private type:string, private path:string) {

        }

        public addHeader(key:string,value:string):this{
            this.headers.push({
                key:key,
                value:value
            });
            return this
        }

        public render():string{
            let space = `            `
            let header = this.headers.map(head => `${space}${head.key} ${head.value};`).join('\n');
            return this.block.replace('[CONTENT]',header)
        }

    }

    class File{

        filePrefix:string   = '';

        fileName:string     = this._nginx.getServiceName();

        fileSuffix:string   = '.conf';

        filePath:string     = '/etc/nginx/sites-enabled';

        constructor(private _nginx:Server) {

            if(File.isWindows()){
                this.filePath = process.env.NGINX_DIR_PATH || 'C:\\nginx\\conf\\';
            }
        }

        static isWindows(){
            return process.platform === 'win32'
        }

        public writeFileSync(content:string){
            fs.writeFileSync(this.getExportPath(), content,  'utf8');
        }

        private getExportPath(){
            return Path.resolve(this.filePath,  (
                this.filePrefix + this.fileName +this.fileSuffix
            ))
        }
    }
}