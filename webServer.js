"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

// load cs142password.js
var cs142password = require('./cs142password.js');

var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require("fs");
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'cs142project7', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
  response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1?', function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params objects.
  console.log('/test called with param1 = ', request.params.p1);

  var param = request.params.p1 || 'info';

  if (param === 'info') {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error('Doing /user/info error:', err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object - This
        // is also an internal error return.
        response.status(500).send('Missing SchemaInfo');
        return;
      }

      // We got the object - return it in JSON format.
      // console.log('SchemaInfo', info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === 'counts') {
    // In order to return the counts of all the collections we need to do an async
    // call to each collections. That is tricky to do so we use the async package
    // do the work.  We put the collections into array and use async.each to
    // do each .count() query.
    var collections = [
      {name: 'user', collection: User},
      {name: 'photo', collection: Photo},
      {name: 'schemaInfo', collection: SchemaInfo}
    ];
    async.each(collections, function (col, done_callback) {
      col.collection.countDocuments({}, function (err, count) {
        col.count = count;
        done_callback(err);
      });
    }, function (err) {
      if (err) {
        response.status(500).send(JSON.stringify(err));
      } else {
        var obj = {};
        for (var i = 0; i < collections.length; i++) {
          obj[collections[i].name] = collections[i].count;
        }
        response.end(JSON.stringify(obj));
      }
    });
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400) status.
    response.status(400).send('Bad param ' + param);
  }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  User.find({}).select("_id first_name last_name").exec()
    .then(users => {
      // console.log('UserList', users);
      response.status(200).send(JSON.stringify(users));
    })
    .catch(err => {
      console.error('Doing /user/list error:', err);
      response.status(500).send(JSON.stringify(err));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  var id = request.params.id;
  User.findOne({_id: id}).select("-__v -login_name -password_digest -salt").exec()
    .then(user => {
      if (user === null) {
        console.log('User with _id:' + id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      // console.log('User', user);
      response.status(200).send(JSON.stringify(user));
    })
    .catch(err => {
      console.error('Doing /user/:id error:', err);
      console.log('User with _id:' + id + ' not found.');
      response.status(400).send('User not found');
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let id = request.params.id;
  Photo.find({user_id: id}).select("-__v").exec()
    .then(photos => {
      if (photos.length === 0) {
        console.log('Photos for user with _id:' + id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      let newPhotos = JSON.parse(JSON.stringify(photos));
      async.each(newPhotos,function(photo, done_callback_photo) {
        async.each(photo.comments,function(comment, done_callback_comment) {
          let commentUserId = comment.user_id;
          User.findOne({_id: commentUserId}).select("_id first_name last_name").exec()
            .then(user => {
              if (user === null) {
                console.log('User with _id:' + id + ' not found.');
                response.status(400).send('Not found');
                return;
              }
              comment.user = user;
              delete comment.user_id;
              done_callback_comment();
            })
            .catch(err => {
              console.error('find user with _id ' + id + 'error:', err);
              response.status(500).send(JSON.stringify(err));
              done_callback_comment(err);
            });
        }, function(err) {
          if (err) {
            response.status(500).send(JSON.stringify(err));
            done_callback_photo(err);
            return;
          }
          done_callback_photo();
        });
      }, function(err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
          return;
        }
        response.status(200).send(JSON.stringify(newPhotos));
      });
  })
  .catch(err => {
    console.error('Doing /photosOfUser/:id error:', err);
    console.log('Photos for user with _id:' + id + ' not found.');
    response.status(400).send('Photos for the user not found');
  });
});

// new server API
app.get('/photo/list', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  Photo.find({}).select("-__v").exec()
    .then(photos => {
      response.status(200).send(JSON.stringify(photos));
    })
    .catch(err => {
      console.error('Doing /photo/list error:', err);
      response.status(500).send(JSON.stringify(err));
    });
});

/*
 * URL /admin/login - Return the information for User (id)
 */
app.post('/admin/login', function (request, response) {
  let sessionUserId = request.session.user_id;
  if (sessionUserId && sessionUserId === request.body.user_id) {
    User.findOne({_id: sessionUserId}).exec()
      .then(user => {
        if (user === null) {
          console.log('User with user_id:' + sessionUserId + ' not found.');
          response.status(400).send('User not found');
          return;
        }
        response.status(200).send(user);
      })
      .catch(err => {
        console.error('find user with user_id ' + sessionUserId + 'error:', err);
        response.status(500).send(JSON.stringify(err));
      });
    return;
  }
  let loginName = request.body.login_name;
  let password = request.body.password;
  if (!loginName || !password) {
    response.status(400).send('No login name or password provided');
    return;
  }
  User.findOne({login_name: loginName}).exec()
    .then(user => {
      if (user === null) {
        console.log(`User with login_name: ${loginName} not found.`);
        response.status(400).send('User not found, login_name is not a valid account');
        return;
      }
      if (cs142password.doesPasswordMatch(user.password_digest, user.salt, password)) {
        request.session.regenerate((err) => {
          if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
          }
          request.session.login_name = loginName;
          request.session.user_id = user._id;
          // security
          delete user.password_digest;
          delete user.salt;
          response.status(200).send(user);
          return;
        });
      } else {
        response.status(400).send('password is not valid');
        return;
      }
    })
    .catch(err => {
      console.error('find user with login_name ' + loginName + 'error:', err);
      response.status(500).send(JSON.stringify(err));
    });
});

/*
 * URL /admin/logout - delete the session state
 */
app.post('/admin/logout', function (request, response) {
  if (!request.session.login_name) {
    response.status(400).send('No user logged in');
    return;
  }
  request.session.destroy(err => {
    if (err) {
      console.log(err);
      response.status(500).send(err);
    } else {
      response.status(200).send('logout successful');
    }
  });
});

/*
 *  URL /commentsOfPhoto/:photo_id - create the new comments for Photos (photo_id)
 */
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let commentText = request.body.comment;
  let mentionedUsers = request.body.mentionedUsers; // array
  // console.log(commentText);
  // console.log(mentionedUsers);
  if (!commentText) {
    response.status(400).send('No comment text provided');
    return;
  }
  let photo_id = request.params.photo_id;
  let user_id = request.session.user_id;
  Photo.findOne({_id: photo_id}).exec()
    .then(photo => {
      if (photo === null) {
        console.log('Photo with _id:' + photo_id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      // update photo object
      let today = new Date();
      let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      let currentDateTime = date+' '+time;
      let comment = {
        comment: commentText,
        date_time: currentDateTime,
        user_id: user_id,
        mentions: mentionedUsers,
      };
      photo.comments.push(comment);
      photo.save();
      response.status(200).send('Add comment to db successfully');
    })
    .catch(err => {
      console.error('Doing /commentsOfPhoto/:photo_id error:', err);
      response.status(500).send(err);
    });
});

/*
 *  URL /photos/new - create a new photo for user (id)
 */
app.post('/photos/new', function (request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  processFormBody(request, response, function(err) {
    if (err || !request.file) {
      response.status(400).send(err);
      return;
    }
    // image format validation
    let imageTypes = ['image/jpg',  'image/png', 'image/jpeg', 'image/bmp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/webp'];
    if (imageTypes.indexOf(request.file.mimetype) === -1) {
      response.status(400).send('Wrong image type.');
      return;
    }
    // We need to create the file in the directory "images" under an unique name. We make
    // the original file name unique by adding a unique prefix with a timestamp.
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let currentDateTime = date + ' ' + time;
    let timestamp = today.valueOf();
    let filename = 'U' +  String(timestamp) + request.file.originalname;
    fs.writeFile("./images/" + filename, request.file.buffer, function(err) {
      // Once you have the file written into your images directory under the name
      // filename you can create the Photo object in the database
      if (err) {
        response.status(400).send(err);
        return;
      }
      Photo.create({
        file_name: filename,
        date_time: currentDateTime,
        user_id: request.session.user_id,
        comments: [],
      }).then(newPhoto => {
        newPhoto.save();
        response.status(200).send('Add new photo to db successfully.');
      }).catch(err => {
        console.error('Doing /photos/new error:', err);
        response.status(500).send(err);
      });
    });
  });
});

/*
 * URL /user - register a new user
 */
app.post('/user', function (request, response) {
  let loginName = request.body.login_name;
  let first_name = request.body.first_name;
  let last_name = request.body.last_name;
  let password = request.body.password;
  if (!loginName || !first_name || !last_name || !password) {
    response.status(400).send('required field is empty');
    return;
  }
  User.findOne({login_name: loginName}).exec()
    .then(user => {
      if (user !== null) {
        console.log('User with login_name: ' + loginName + ' already exist');
        response.status(400).send('Login name already exist');
        return;
      }
      let passwordEntry = cs142password.makePasswordEntry(password);
      let newUserObj = {
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        location: request.body.location,
        description: request.body.description,
        occupation: request.body.occupation,
        login_name: request.body.login_name,
        password_digest: passwordEntry.hash,
        salt: passwordEntry.salt,
      };
      User.create(newUserObj).then(newUser => {
        newUser.save();
        response.status(200).send('Register new user to db successfully.');
        return;
      }).catch(err => {
        console.error('Doing /user error:', err);
        response.status(500).send(err);
        return;
      });
    })
    .catch(err => {
      console.error('find user with login_name ' + loginName + ' error:', err);
      response.status(500).send(JSON.stringify(err));
    });
});

/*
 * URL /mention/:photo_id - add new user_id to the mentions array
 */
app.post('/mention/:photo_id', function(request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let photo_id = request.params.photo_id;
  let commentText = request.body.comment;
  let mentionedUsers = request.body.mentionedUsers;
  if (!commentText) {
    response.status(400).send('No comment text provided');
    return;
  }
  Photo.findOne({_id: photo_id}).exec()
    .then(photo => {
      if (photo === null) {
        console.log('Photo with _id:' + photo_id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      mentionedUsers.forEach(user => {
        if (photo.mentions.indexOf(user.id) === -1) {
          photo.mentions.push(user.id);
        }
      });
      photo.save();
      response.status(200).send('Add mentioned users to photo successfully');
    })
    .catch(err => {
      console.error('Doing /mention/:photo_id error:', err);
      response.status(500).send(err);
    });
});

/*
 * URL /mention/:user_id - get photos that mention the user (user_id)
 */
app.get('/mention/:user_id', function(request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let user_id = request.params.user_id;
  let mentionList = [];
  Photo.find({}).exec()
    .then(photos => {
      if (photos === null || photos.length === 0) {
        console.log('No photos uploaded');
        response.status(400).send("No photo found");
        return;
      }
      async.each(photos, function(photo, done_callback) {
        if (photo.mentions.indexOf(user_id) !== -1) {
          let mentionInfo = {};
          User.findOne({"_id": photo.user_id}).exec()
            .then(user => {
              if (user === null) {
                console.log('User with _id:' + photo.user_id + ' not found.');
                response.status(400).send('Not found');
                return;
              }
              mentionInfo.author_name = user.first_name + " " + user.last_name;
              mentionInfo.file_name = photo.file_name;
              mentionInfo.photo_id = photo._id;
              mentionInfo.user_id = photo.user_id;
              mentionList.push(mentionInfo);
              done_callback();
            })
            .catch(err => {
              console.error('find user with _id ' + photo.user_id + 'error:', err);
              response.status(500).send(JSON.stringify(err));
              done_callback(err);
            });
        } else {
          done_callback();
        }
      }, function(err) {
        if (err) {
          response.status(400).send(JSON.stringify(err));
          return;
        }
        response.status(200).send(mentionList);
      });
    })
    .catch(err => {
      console.error('Doing /mention/:user_id error:', err);
      response.status(500).send(err);
    });
});

/*
 * URL /favorite/:photo_id - add new photo_id to logged in user's favorite array
 */
app.get('/favorites', function(request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let user_id = request.session.user_id;
  User.findOne({_id: user_id}).exec()
    .then(user => {
      if (user === null) {
        console.log('User with _id:' + user_id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      if (!user.favorites || user.favorites.length === 0) {
        response.status(200).send(user.favorites);
        return;
      }
      let favoriteList = [];
      async.each(user.favorites, function(photoId, done_callback) {
        Photo.findOne({"_id": photoId}).exec()
          .then(photo => {
            if (photo === null) {
              console.log('Photo with _id:' + photoId + ' not found.');
              response.status(400).send('Not found');
              return;
            }
            let newPhoto = JSON.parse(JSON.stringify(photo));
            delete newPhoto.comments;
            delete newPhoto.mentions;
            favoriteList.push(newPhoto);
            done_callback();
          })
          .catch(err => {
            console.error('find photo with _id ' + photoId + 'error:', err);
            response.status(500).send(JSON.stringify(err));
            done_callback(err);
          });
      }, function(err) {
        if (err) {
          response.status(400).send(JSON.stringify(err));
          return;
        }
        response.status(200).send(favoriteList);
      });
    })
    .catch(err => {
      console.error('Doing /favorites error:', err);
      response.status(500).send(err);
    });
});

/*
 * URL /favorite/:photo_id - add new photo_id to logged in user's favorite array
 */
app.post('/favorite/:photo_id', function(request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let photo_id = request.params.photo_id;
  let user_id = request.session.user_id;
  User.findOne({_id: user_id}).exec()
    .then(user => {
      if (user === null) {
        console.log('User with _id:' + user_id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      if (user.favorites.indexOf(photo_id) !== -1) {
        response.status(400).send(`Add photo with _id: ${photo_id} twice`);
        return;
      }
      user.favorites.push(photo_id);
      user.save();
      response.status(200).send('Add favorite photo to the logged in user successfully');
    })
    .catch(err => {
      console.error('Doing post /favorite/:photo_id error:', err);
      response.status(500).send(err);
    });
});

/*
 * URL /favorite/:photo_id - delete current photo_id which is stored in logged in user's favorite array
 */
app.delete('/favorite/:photo_id', function(request, response) {
  if (!request.session.user_id) {
    response.status(401).send('Current user is not logged in');
    return;
  }
  let photo_id = request.params.photo_id;
  let user_id = request.session.user_id;
  User.findOne({_id: user_id}).exec()
    .then(user => {
      if (user === null) {
        console.log('User with _id:' + user_id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      let index = user.favorites.indexOf(photo_id);
      if (index === -1) {
        response.status(400).send(`No photo with _id: ${photo_id}, already deleted or never liked`);
        return;
      }
      user.favorites.splice(index, 1);
      user.save();
      response.status(200).send('Delete liked photo of logged in user successfully');
    })
    .catch(err => {
      console.error('Doing delete /favorite/:photo_id error:', err);
      response.status(500).send(err);
    });
});

var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});