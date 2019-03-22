
const deco = require('deco');
const express = require('express');

const Controller = deco();

Controller.factory(express.Router);
Controller.decorators(__dirname, ['controller-configure', 'controller-merge']);
module.exports = Controller;
