const mysql = require('mysql');
const db_info = require('../config/db_info');
const express = require('express');
const app = express();

var counter = 1; //접속 카운터

app.locals.pretty  = true;
app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static(__dirname + '/public'));

const port = 8088;
/*
var connection = mysql.createConnection({
	  host     :  db_info.host,
	  port     :  db_info.port,
	  user     :  db_info.user,
	  password : db_info.password,
	  database : db_info.database,
	  charset : 'utf8'
	});

connection.connect();
*/

var pool      =    mysql.createPool({
    connectionLimit : 10, //important
    host     :  db_info.host,
	port     :  db_info.port,
	user     :  db_info.user,
	password : db_info.password,
	database : db_info.database,
	charset : 'utf8',    
    debug    :  false
});
	
app.get('/topic', function(req, res){
	res.send(req.query.id);
});

// 리더보드 조회
app.get('/leader_board', function(req, res){
	var dcd = req.query.dcd ;
	
	//dcd가 비어있으면 년도로 기본 셋
	//최근년도 조회 후 연간 누적순위 조회
	if(!dcd) {
		dcd = 'year';
		getMaxYear(req, res, dcd);
	}
	else {		
		// 연간 누적순위
		if(dcd === 'year') {
			calYear(req, res, dcd, '2019');
		}
		// 월간 누적순위
		else if(dcd === 'mon') {
			calMon(req, res, dcd, '2019', '05'); 
		}
		// 그외
		else {
			res.render('leader_board', {dcd: dcd, record: ""});
		}
	}
	
	console.log(counter++);
	
});

app.get('/', function(req, res){
	res.status(404).send('일치하는 주소가 없습니다.');
});

// FCL_BOT2
app.get('/fcl_bot', function(req, res){
	var msg = req.query.msg; // message
	console.log('받은메시지:');
    console.log(msg);
    
    if(msg.indexOf("!일정변경") != -1) {
    	changeSchedule(req, res);
    }
    else if(msg.indexOf("!일정") != -1) {
    	getSchedule(res);
    }
    else {
    	res.send("");
    }
})

app.get('/manager', function(req, res){
	res.send('Manager Page');
});

app.listen(port, function(){
	console.log('Connected 8088 port!');
});

// 일정 업데이트
function changeSchedule(req, res) {
	var content = req.query.msg.split("!일정변경")[1];
	var param = [content];

	var sql = 
		`UPDATE NOTICE
		    SET CONTENT = ?
		  WHERE NUM = 1`;
	
	var query = mysql.format(sql, param);
	
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
		}
			
		res.send('일정변경 완료!');
	});				
}
// 일정 불러오기
function getSchedule(res) {
	var sql = 
			`SELECT CONTENT	
			   FROM NOTICE N
			  WHERE N.NUM = 1`; // 1=일정
			   
	pool.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		res.send(results[0].CONTENT.replace(/\n/gi, "<br>"));
	});		
}

// 연간 누적순위 계산
function calYear(req, res, dcd, year) {
	var sql = 
			`SELECT R.TAG
					    , SUM(PTS) AS PTS
					    , COUNT(R.TAG) AS ENTRY
					    , (SELECT COUNT(*)
						      FROM RECORD SUB1
						    WHERE SUB1.RACE_DATE  LIKE  ?
							    AND SUB1.TAG = R.TAG
							    AND SUB1.POS <= 3) AS PODIUM
					    , (SELECT COUNT(*)
						      FROM RECORD SUB1
						     WHERE SUB1.RACE_DATE  LIKE  ?
							     AND SUB1.TAG = R.TAG
							     AND SUB1.POS = 1) AS WINS
			     FROM RECORD R
			   WHERE R.RACE_DATE LIKE ?
			   GROUP BY R.TAG
			   ORDER BY SUM(PTS) DESC `;
			   
	var param = [year+'%', year+'%', year+'%'];
	
			   
	connection.query(sql, param, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
			
		res.render('leader_board', {dcd: dcd, year:year,  record: results});
	});			
}

// 1. 최종년도 조회 후 
// 2. 연간 누적순위 조회
function getMaxYear(req, res, dcd) {
	var sql = 
			`SELECT SUBSTR(MAX(RACE_DATE), 1, 4) AS YEAR	
			     FROM RECORD R`;
			   
	connection.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		// 연간 누적순위 계산 
		calYear(req, res, dcd, results[0].YEAR);
	});			
}

// 월간 누적순위 계산
function calMon(req, res, dcd, year, mon) {
	var sql = 
			`SELECT R.TAG
					    , SUM(PTS) AS PTS
					    , COUNT(R.TAG) AS ENTRY
					    , (SELECT COUNT(*)
						      FROM RECORD SUB1
						    WHERE SUB1.RACE_DATE  LIKE  ?
							    AND SUB1.TAG = R.TAG
							    AND SUB1.POS <= 3) AS PODIUM
					    , (SELECT COUNT(*)
						      FROM RECORD SUB1
						     WHERE SUB1.RACE_DATE  LIKE  ?
							     AND SUB1.TAG = R.TAG
							     AND SUB1.POS = 1) AS WINS
			     FROM RECORD R
			   WHERE R.RACE_DATE LIKE ?
			   GROUP BY R.TAG
			   ORDER BY SUM(PTS) DESC `;
			   
	var param = [year+mon+'%', year+mon+'%', year+mon+'%'];
	
			   
	connection.query(sql, param, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
			
		res.render('leader_board', {dcd: dcd, year:year,  record: results});
	});			
}
