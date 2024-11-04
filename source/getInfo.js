module.exports = function(RED) {
    "use strict";
    const axios = require('axios');
    function getInfo(config) {
        RED.nodes.createNode(this,config);
        
        let node = this;

        node.on('input', function(msg) {     
            try {

              const apikey = msg.apikey || config.apikey;
              const url = msg.url || config.url;
              const filter = JSON.parse(msg.filter||config.filter);

              if (!filter) {
                node.error(RED._('platma-info.errors.no-filter'));
                node.status({ fill: 'red', shape: 'dot', text: 'Error. No filter' });
                return;
              } else if(Array.isArray(filter)){
                filter.forEach(element => {
                if (!element.field||!element.value) {
                  node.error(RED._('platma-info.errors.wrong-filter'));
                  node.status({ fill: 'red', shape: 'dot', text: 'Error. Wrong filter' });
                  return;
                }
              });} else if (!filter.field||!filter.value) {
                node.error(RED._('platma-info.errors.wrong-filter'));
                node.status({ fill: 'red', shape: 'dot', text: 'Error. Wrong filter' });
                return;
              }
              
              if (!url) {
                node.error(RED._('platma-info.errors.no-url'));
                node.status({ fill: 'red', shape: 'dot', text: 'Error. No url' });
              }
        
              if (!apikey) {
                node.error(RED._('platma-info.errors.no-apikey'));
                node.status({ fill: 'red', shape: 'dot', text: 'Error. No apikey' });
                return;
              }
        
              node.status({
                fill: 'blue',
                shape: 'dot',
                text: 'http-request-np.status.requesting',
              });

              let finalUrl = url;
              if (Array.isArray(filter)) {
                let flag = false;
                filter.forEach(element => {
                  if (flag) {finalUrl+="&"} else {finalUrl+="?"}
                  finalUrl += `${element.field}=${element.value}`;
                  flag = true;
                });
              } else {
              finalUrl += `?${filter.field}=${filter.value}`;
              }

              axios({
                method: 'get',
                url: finalUrl,
                headers: {apikey},
              })
                .then((res) => {
                  msg.statusCode = res.status;
                  const body = res.data;
                  msg.payload = body;
        
                  node.status({});
                  node.send(msg);
                })
                .catch((err) => {
                  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
                    node.error(RED._('common.notification.errors.no-response'), msg);
                    node.status({
                      fill: 'red',
                      shape: 'ring',
                      text: 'common.notification.errors.no-response',
                    });
                  } else {
                    node.error(err, msg);
                    node.status({ fill: 'red', shape: 'ring', text: err.code });
                  }
                  msg.payload = err.toString();
                  msg.statusCode =
                    err.code || (err.response ? err.response.statusCode : undefined);
        
                  node.send(msg);
                });
              } catch (error) {
                node.error(error, msg);
                node.status({ fill: 'red', shape: 'ring', text: error.code });              }
        });
        node.on('close', function () {
          node.status({});
        });
    }
    RED.nodes.registerType("getInfo", getInfo);
};