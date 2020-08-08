const express = require('express');
const decamelize = require('decamelize');
const _ = require('lodash');
const methodsMap = require('@blurtfoundation/blurtjs/lib/api/methods.js');
const bodyParser = require('body-parser');
const http = require('http'),
    https = require('https');
const blurt = require('@blurtfoundation/blurtjs');
blurt.api.setOptions({ url: "https://rpc.blurt.world", useAppbaseApi: true });

http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

const app = express();



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const methods = methodsMap.default;

app.get('/', (req, res) => {
    res.json({ message: "Welcome" });
});

app.post('/rpc', (req, res) => {
    const { method, params, id } = req.body;
    const mapping = _.filter(methods, { method: method });
    blurt.api.send(mapping[0].api, {
        method: method,
        params: params,
    }, (err, result) => {
        res.send({
            jsonrpc: '2.0',
            id,
            method,
            result,
        });
    });
});

app.get('/:method', (req, res) => {
    const query = parseQuery(req.query);
    const method = decamelize(req.params.method, '_');
    const mapping = _.filter(methods, { method: method });
    let params = [];
    if (mapping[0].params) {
        mapping[0].params.forEach((param) => {
            const queryParam = query[param] || query[decamelize(param)];
            params.push(queryParam);
        });
    }
    blurt.api.send(mapping[0].api, {
        method: method,
        params: params
    }, (err, result) => {
        const json = query.scope
            ? result[query.scope] : result;
        res.json(json);
    });
});

const parseQuery = (query) => {
    let newQuery = {};
    Object.keys(query).map(key => {
        let value = query[key];
        try { value = JSON.parse(decodeURIComponent(value)); }
        catch (e) { }
        newQuery[key] = value;
    });
    return newQuery;
};

// set port, listen for requests
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});
