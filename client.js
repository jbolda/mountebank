'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const got = require("got");
const { HttpProxyAgent } = require("hpagent");
(async () => {
    try {
        const response = await got('https://api.github.com/repos/bbyars/mountebank/contents/README.md',{
            agent: {
            http: new HttpProxyAgent({
                keepAlive: false,
                proxy: "http://localhost:9999",
            }),
        }});
        let content = JSON.parse(response.body).content
        let c = Buffer.from(content,"base64").toString('UTF-8')
        console.log(c);
        //=> '<!doctype html> ...'
    } catch (error) {
        console.log(error.response);
        //=> 'Internal server error ...'
    }
})();


