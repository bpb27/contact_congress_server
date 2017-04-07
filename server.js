var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var app = express();
var googleKey = process.env.GOOGLE_CIVIC_INFO || require('./config.js').apiKeys.googleCivicInfo;

app.set('port', process.env.NODE_PORT || process.env.PORT || 3000);
app.set('host', process.env.NODE_IP || 'localhost');

console.log(app.get('port'), app.get('host'));
mongoose.connect(process.env.MONGODB_URI || require('./config.js').database.localUrl);
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('./public'));
// app.use(express.static('/Users/Jaime/Desktop/brendan_codes/contact_congress'));

var repList = mongoose.model('Replist', {
	text: { type: String, default: '' },
	name: { type: String, default: '' }
});

app.get("/lists/all", function (req, res) {
	repList.find(function (err, lists) {
		if (err) {
			res.send({ status: 'error', message: 'trouble reading from the database' });
		} else {
			res.json(lists);
		}
	});
});

app.get("/lists/:name", function (req, res) {
	repList.find({ name: req.params.name }, function (err, list) {
		if (err) {
			res.send({ status: 'error', message: 'trouble reading from the database' });
		} else if (!list || !list.length) {
			res.send({ status: 'error', message: 'no list found' });
		} else {
			res.json(list);
		}
	});
});

app.post('/lists/create', function (req, res) {
	if (!req.body.name || !req.body.text) {
		res.send({ status: 'error', message: 'fields cannot be blank' });
	} else {
		repList.find({ 'name': req.body.name }, function (err, list) {
			if (err) {
				res.send({ status: 'error', message: 'trouble reading from the database' });
			} else if (!list || !list.length) {
				repList.create({
					text: req.body.text,
					name: req.body.name
				}, function (err, list) {
					if (err) {
						res.send({ status: 'error', message: 'trouble reading from the database' });
					} else {
						res.json({ status: 'success', message: 'success' });
					}
				});
			} else {
				res.send({ status: 'error', message: 'name already taken' });
			}
		});
	}
});

app.get("/localRep/:address", function (req, res) {
	var url = [
		'https://www.googleapis.com/civicinfo/v2/representatives?key=',
		googleKey,
		'&address=',
		req.params.address
	].join('');
	var remote = request(url);
	req.pipe(remote);
	remote.pipe(res);
});

app.get('*', function (req, res) {
	res.redirect('/');
});

app.listen(app.get('port'), app.get('host'), function () {
	console.log('Express server listening on port ' + app.get('port'));
});
