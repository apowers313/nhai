const {Perception} = require("../index");
const Grid = require("./Grid");
const DeltaFeatureExtractor = require("./DeltaFeatureExtractor");

module.exports = new Perception("vision", Grid);

new DeltaFeatureExtractor().listen("vision");
