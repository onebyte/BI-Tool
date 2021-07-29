export const env = (()=>{
     return{
        load: (path = null)=>{

            path && require('fs').existsSync(path)?
                require('dotenv').config({path: path  }) :
                 require('dotenv').config({path: (require('path').resolve(__dirname,'..','.env'))  }) ;
        }
    }
})()

