#!/usr/bin/env node
const fs = require("fs")

fs.cpSync("src/templates/", "dist/templates", {recursive: true}); 