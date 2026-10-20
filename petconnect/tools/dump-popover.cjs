const fs=require('fs');const s=fs.readFileSync('node_modules/primeng/fesm2022/primeng-api.mjs','utf8');const i=s.indexOf('zIndex');console.log(s.slice(i-200,i+800));
