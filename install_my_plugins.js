'use strict';
/**********************************************************************
 * Copyright (C) 2025 BitCtrl Systems GmbH
 * 
 * install_my_plugins.js
 * 
 * @author  Daniel Hammerschmidt <daniel.hammerschmidt@bitctrl.de>
 * @author  Daniel Hammerschmidt <daniel@redneck-engineering.com>
 * @version 0.0.1
 *********************************************************************/

const { sep: PATH_SEP } = require('node:path');
const PLUGIN_SHORT_NAME = __dirname.split(PATH_SEP).pop();

const config = require('./config.json');

let webserver,  meshserver;
const this_config_url=`
https://raw.githubusercontent.com/interim-mc-plugin-collection/install_my_plugins/refs/heads/main/config.json
`;

const my_favs = {
  devtools: 'https://raw.githubusercontent.com/ryanblenis/MeshCentral-DevTools/master/config.json',
  routeplus: 'https://raw.githubusercontent.com/ryanblenis/MeshCentral-RoutePlus/master/config.json',
  workfromhome: 'https://raw.githubusercontent.com/ryanblenis/MeshCentral-WorkFromHome/master/config.json',
}

module.exports = {
  [PLUGIN_SHORT_NAME]: function (pluginHandler) {
    meshserver = pluginHandler.parent;
    return {
      server_startup() {
        webserver = meshserver.webserver;
        console.log(`Plugin ${PLUGIN_SHORT_NAME} is running.`)
        let newConfigUrls;
        let thisPlugin;
        new Promise((resolve, reject) => {
          meshserver.db.getPlugins((err, docs) => {
            if (err) { return void reject(err); }
            resolve(docs);
          })
        })
        .then((localPlugins) => {
          const configUrls = new Set(localPlugins.map((doc) => (doc.configUrl)));
          thisPlugin = localPlugins[localPlugins.findIndex((doc) => (doc.configUrl == config.configUrl))];
          console.log('this plugin is', thisPlugin._id, thisPlugin.configUrl);
          newConfigUrls = Object.values(my_favs).filter((url) => (!configUrls.has(url)));
          return Promise.all(newConfigUrls.map((url) => (pluginHandler.getPluginConfig(url))));
        })
        .then((requiredPlugins) => {
          return Promise.all(requiredPlugins.map((doc) => (pluginHandler.addPlugin(doc))));
        })
        .then((localPlugins) => {
          if (localPlugins.length == 0) { return Promise.resolve(); }
          const newPlugins = localPlugins.flat().filter((doc) => (newConfigUrls.indexOf(doc.configUrl) != -1));
          return Promise.all(newPlugins.map((doc) => {
            return new Promise((resolve, reject) => (pluginHandler.installPlugin(doc._id, false, null, resolve)));
          }));
        })
        .then((result) => {
          return new Promise((resolve, reject) => (pluginHandler.disablePlugin(thisPlugin._id, resolve)));
        })
        .then((result) => {
          debugger;
        })
        ;
      }
    };
  },
};
