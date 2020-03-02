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
    
    if(msg.includes("!일정변경")) {
    	changeSchedule(req, res);
    }
    else if(msg.includes("!일정")) {
    	getSchedule(res);
    }
    else if(msg.includes("!라이벌기록")) {
    	try {
    		changeRival(req, res);
    	}
    	catch(err){
    		res.send("라이벌기록 업데이트 중 오류 발생!");
    	}
    	
    }
    else if(msg.includes("!라이벌삭제")) {
    	deleteRival(req, res);
    }
    else if(msg.includes("!라이벌초기화")) {
    	deleteAllRival(res);
    }
    else if(msg.includes("!라이벌")) {
    	getRival(res);
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

// Rival 기록 조회
function getRival(res) {
	var sql = 
		`SELECT NAME
		      , FLOOR(BEST_LAP * 100000) + 100000000 AS BEST_LAP	
		   FROM RIVAL
		  ORDER BY BEST_LAP ASC`;
		   
	pool.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		if(results.length == 0) {
			res.send("등록된 라이벌 기록이 없습니다.");
			return;
		}
		
		var response = "";
		var best_lap = "";
		var prepix = "";
		for(var i=0; i<results.length; i++) {
			best_lap = String(results[i].BEST_LAP);
			
			switch(i){
			case 0:
				prepix = "(별)";
				break;
			case 3:
				prepix = "------------------------------<br>" + (i+1);
				break;
			default:
				prepix = (i+1);
				break;
			}
			
			response = response + prepix + " [ " +
						results[i].NAME + " ] " +
						parseInt(best_lap.substr(2,2)) + ":" + best_lap.substr(4,2) + "." + best_lap.substr(6) +"<br>";
					   
		}
		res.send(response);
	});		
}

//Rival 기록 삭제
function deleteRival(req, res) {
	var msg = req.query.msg;
	msg = msg.split("!라이벌삭제")[1];
	msg = msg.replace(/\s/gi, ""); //공백제거
	
	if(msg.length == 0) {
		res.send("삭제할 대상의 이름을 입력해주십시오.");
		return;
	}
	
	name = msg;
	
	var param = [name];
	
	var sql = 
		`DELETE	
		   FROM RIVAL
		  WHERE NAME = ?`;
		   
	var query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
		}
		
		// 업데이트 건수가 1이면 정상
		if(response.affectedRows == 1) {
			res.send("라이벌 기록 삭제 완료.");
			return;
		}
		else {
			res.send("삭제할 데이터가 없습니다.");
			return;
		}
	});		
}

//Rival 기록 전 삭제
function deleteAllRival(res) {
	var sql = 
		`DELETE	
		   FROM RIVAL`;
		   
	pool.query(sql, function (error, response) {
		if (error) {
			console.log(error);
		}
		
		res.send("라이벌 기록 초기화 완료.");		
	});		
}

// Rival 기록 업데이트
function changeRival(req, res) {
	var msg = req.query.msg;
	msg = msg.split("!라이벌기록")[1];
	msg = msg.replace(/\s/gi, ""); //공백제거
	
	var name;
	var best_lap;
	
	var arr = msg.split(",");
	
	name = arr[0];
	best_lap = arr[1];
	
	if(msg.split(",").length != 2) {
		res.send("아래 형식으로 입력해주세요..<br>" +
		 "!라이벌기록 별명,1:12.345");
		return;
	}
	
	if(/^\d{1,2}[:]\d{2}[.]\d{1,3}$/.test(best_lap) == false) {
		res.send("아래 형식으로 입력해주세요.<br>" +
				 "!라이벌기록 별명,1:12.345");
		return;
	}
	
	// 저장하기 위해 숫자형으로 변환
	best_lap = best_lap.replace(".", "").replace(":",".");
	
	// 데이터 갱신
	var param = [best_lap, name];

	var sql = 
		`UPDATE RIVAL
		    SET BEST_LAP = ?
		  WHERE NAME = ?`;
	
	var query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
		}
		
		// 업데이트 건수가 1이면 정상
		if(response.affectedRows == 1) {
			getRival(res);
			return;
		}
		else {
			// 데이터가 없으면 insert
			sql = 
				`INSERT INTO RIVAL(BEST_LAP, NAME) VALUES(?, ?)`;
			
			query = mysql.format(sql, param);
			
			pool.query(query, function (error, response) {
				if (error) {
					console.log(error);
				}
				
				getRival(res);
				return;
			});	
		}
	});	
	
	
	
}

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
