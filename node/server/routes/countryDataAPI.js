let express = require("express");
var request = require('request');

var router = express.Router();
router.get("/", function (req, res, next) {
      console.log(req.query.country);
      
        request({
            uri: `http://localhost:8080/countries/${req.query.country}`
          }).pipe(res);

});
module.exports = router;