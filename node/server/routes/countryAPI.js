let express = require("express");
var request = require('request');

var router = express.Router();
router.get("/", function (req, res, next) {

        request({
            uri: 'http://localhost:8080/countries'
          }).pipe(res);

});
module.exports = router;