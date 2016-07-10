#!/usr/bin/env node
require('shelljs/global');
exec('ionic state reset')
exec('cordova platform add android')
