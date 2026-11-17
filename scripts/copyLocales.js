#!/usr/bin/env node
const fs = require("fs")

fs.cpSync("src/locales/", "dist/public/locales", {recursive: true});