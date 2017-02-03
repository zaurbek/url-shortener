var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
console.log(process.env.MONGOLAB_URI)
   //(Focus on This Variable)
var mongoURL = process.env.MONGOLAB_URI;

var express = require('express')
var app = express()
var path = require("path")

app.use('/assets', express.static('assets'))

app.get('/', function(req, res) {
   console.log(req.url)
   res.sendFile(path.join(__dirname + '/index.html'))
});

var regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");

app.get('/new/:url(*)', function(req, res) {

      MongoClient.connect(mongoURL, function(err, db) {
         if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err)
         } else {
            console.log('Connection established to', mongoURL)

            var collection = db.collection('links')

            var Access = function(db, callback) {
               if (regex.test(req.params.url)) {
                  collection.count().then(function(number) {
                     var newElement = {
                        original_url: req.params.url,
                        short_url: "https://shrtn-me.herokuapp.com/" + (number + 1)
                     }
                     collection.insert([newElement])
                     res.json({
                        original_url: req.params.url,
                        short_url: "https://shrtn-me.herokuapp.com/" + (number + 1)
                     })
                  })

               } else {
                  res.json({
                     'error': 'Please provide valid URL in order to shorten it'
                  })
               }
            }

            Access(db, function() {
               db.close()
            })

         }
      })

   })
   
app.get('/:shortid', function(req, res) {

   MongoClient.connect(mongoURL, function(err, db) {
      if (err) {
         console.log('Unable to connect to the mongoDB server. Error:', err)
      } else {

         var collection = db.collection('links')

         var query = function(db, callback) {
            collection.findOne({
               "short_url": "https://shrtn-me.herokuapp.com/" + req.params.shortid
            }, {
               original_url: 1,
               _id: 0
            }, function(err, answer) {
               if (answer === null) {
                  res.json({
                     'error': "Provided URL is not found in our database"
                  })
               } else {
                  if (answer.original_url.split('')[0] == 'w') {
                     res.redirect(301, 'http://' + answer.original_url)
                  } else {
                     res.redirect(301, answer.original_url)
                  }

               }
            })

         }

         query(db, function() {
            db.close()
         })

      }

   })
})

app.listen(process.env.PORT || 8080)