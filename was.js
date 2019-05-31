const mysql = require('mysql');
const db_info = require('./db_info');

const http = require('http');
const port = 8088;
const server = http.createServer((req, res) => {
	res.end('Hello World');
	
	var connection = mysql.createConnection({
	  host     :  db_info.host,
	  port     :  db_info.port,
	  user     :  db_info.user,
	  password : db_info.password,
	  database : db_info.database
	});
	  
	connection.connect();
	  
	connection.query('SELECT * FROM DRIVER', function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		console.log(results);
	});
	  
	connection.end();
});

server.listen(port);
