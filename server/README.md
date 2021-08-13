### NodeJS Backend - BI TOOL <br><br>

Instance are running with PM2<br>
ReverseProxy handled by NGINX (NGINX entry are created automatically by NodeJS) <br> <br>


Rest API         | ExpressJS  - https://expressjs.com/de/ <br>
Database         | MySQL      - https://github.com/sidorares/node-mysql2 <br>
Language         | TypeScript - https://www.typescriptlang.org/ <br>
Emailer          | NodeMailer - https://nodemailer.com/about/ <br>
<br><br>
Server State: 
https://app.pm2.io/bucket/60d1010148fcaf6494aacabb/backend/overview/servers
<br><br>

## Running a service

```bash
# nodeJS
$ node dist/auth.js

# PM2
$ pm2 start dist/auth.js

```


## List running services

```bash
# list
$ pm2 list

# log
$ pm2 log 

# clear log
$ pm2 flush 

```
<br>

### NGINX Entry Creation 
https://github.com/onebyte/BI-Tool/blob/main/server/microservices/core/index.ts

<br>

### User Images
User images are loaded automatically, ensure that the following selector matches with the page.<br>
image src should contain first and lastname<br>
importer runs every second day

```
'.employee-portrait img'

```

``` 
src.includes(firstName+'-'+lastName) || src.includes(lastName+'-'+firstName))
```
