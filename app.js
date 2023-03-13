const mysql = require('mysql');
const db_info = require('../config/db_info');
const express = require('express');
const client = require('cheerio-httpcli');
const utf8 = require("utf8");
const cron = require("node-cron");
const app = express();

const multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
const upload = multer({
				  storage: multer.diskStorage({
					    destination: function (req, file, cb) {
					      cb(null, 'public/image/');
					    },
					    filename: function (req, file, cb) {
					      //cb(null, file.originalname);
					    	cb(null, req.body.filename);
					    }
					  }),
					});

const notice = require('./Dao/Notice.js');

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
	
app.get('/temp', function(req, res){
	res.render('temp');
});

app.get('/topic', function(req, res){
	res.send(req.query.id);
});

//일정등록
app.get('/schedule', function(req, res){
	res.render('schedule');
});

//기록등록
app.get('/regist_record', function(req, res){
	res.render('regist_record');
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

app.get('/upload', function(req, res){
	res.render('upload');
});

app.post('/upload', upload.single('userfile'), function(req, res){
  res.send('Uploaded! : '+req.file); // object를 리턴함
  //console.log(req.file); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
});

app.get('/', function(req, res){
	res.status(404).send('일치하는 주소가 없습니다.');
});

// FCL_BOT2
app.get('/fcl_bot', function(req, res){
	var msg = req.query.msg; // message
	//console.log('받은메시지:');
    //console.log(msg);
    
    if(msg.includes("!일정변경")) {
    	notice.changeSchedule(pool, req, res);
    }
    else if(msg.includes("!일정")) {
    	notice.getSchedule(pool, res);
    }
    else if(msg.includes("!라이벌기록")) {
    	try {
    		changeRival(req, res);
    	}
    	catch(err){
    		res.send("라이벌기록 업데이트 중 오류 발생!");
    	}
    	
    }
    else if(msg.startsWith("!라이벌삭제")) {
    	deleteRival(req, res);
    }
    else if(msg.startsWith("!라이벌초기화")) {
    	deleteAllRival(res);
    }
    else if(msg.includes("!라이벌")) {
    	getRival(res);
    }
    else if(msg.startsWith("!알림등록")) {
    	setAlarm(req, res);
    }
    else if(msg.startsWith("!알림삭제")) {
    	deleteAlarm(req, res);
    }
    else if(msg.includes("!알림조회")) {
    	getAlarm(req, res);
    }
    else if(msg.includes("!알림전체조회")) {
    	getAlarmAll(res);
    }
    else if(msg.startsWith("!우승자조회")) {
    	notice.getChamp(pool, res);
    }
    else if(msg.startsWith("!우승")) {
    	notice.setChamp(pool, req, res);
    }
    else if(msg.startsWith("!피리야")) {
   		callParkApi(req, res);
    }
    else {
    	res.send("");
    }
})

app.get('/manager', function(req, res){
	res.send('Manager Page');
});

// 명언관리
app.get('/maxim', function(req, res){
	res.render('maxim');
});

// 루리웹 정보 가져오기
app.get('/ruliweb', function(req, res){
	var sql = 
		`SELECT ID
		      , SUBJECT 
		      , URL
		   FROM SCRAP
		  WHERE COMPLETE <> 'Y'
		    AND LAST_DATE >= '2020-09-26 10:00:00'`;
	
	pool.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		var id = "";
		var subject = "";
		var url = "";
		var msg = "";
		
		// 결과가 없으면 리턴
		if(results.length == 0) {
			res.send("");
			return;
		}
		
		// 결과 메시지 조립
		id = results[0].ID;
		subject = results[0].SUBJECT;
		url = results[0].URL;
		
		msg = subject +"<BR><BR>"
		    + url;

		// 조회된 결과 완료여부 Y로 갱신
		var param = [id];

		var sql = 
			`UPDATE SCRAP
			    SET COMPLETE = 'Y'
                  , LAST_DATE = LAST_DATE
			  WHERE ID = ?`;
		
		var query = mysql.format(sql, param);
		
		pool.query(query, function (error, response) {
			if (error) {
				console.log(error);
			}
		});	
		
		res.send(msg);
	});	

});

//batch
//second minute hour day-of-month month day-of-week
cron.schedule('*/1 * * * *', function(){
  //console.log('node-cron 실행 테스트');
	
	var xbox_url = "http://bbs.ruliweb.com/xbox/board/300003?search_type=subject&search_key=";
	var pc_url = "http://bbs.ruliweb.com/pc/board/300006?search_type=subject&search_key=";
  
	const xbox_words = [
	 //"xsx",
	 "pass",
          "패스",
          "호라",
	  "포르자",
	  "forza"
  	];
	
	const pc_words = [
	  "RTX",
	  "AMD"
  	];
  
	//XBOX 게시판
	for(var i=0; i<xbox_words.length; i++){
		getRuliWeb(xbox_url, xbox_words[i]);  
	}
	
	//PC 게시판
	for(var i=0; i<xbox_words.length; i++){
		getRuliWeb(pc_url, pc_words[i]);  
	}
});

app.listen(port, function(){
	console.log('Connected 8088 port!');
});



// 루리웹 정보검색
function getRuliWeb(url, word) {
	const param = { };
	
	url = url + word;
	
	client.fetch(utf8.encode(url), param, function( error, $, response ) {
		// 에러체크
		if( error ) {
			console.error( "Error : ", error );
			return;
		}

		
		// 게시판 테이블
		var table = $(".board_main.theme_default");
	
		var first_id, first_subject, first_url;
		
		$(".board_main.theme_default .board_list_table .table_body").each(function(idx){
			var id = $(this).children(".id").text().trim();
			var subject = $(this).children(".subject").children(".relative").children(".deco").text().trim();
			var url = $(this).children(".subject").children(".relative").children(".deco").attr("href");
			
			// 공지를 제외한 첫번째 검색 결과를 찾는다
			if(subject.length != 0) {
				//console.log(idx + ":" + id + "," + subject + "," + url);
				first_id = id;
				first_subject = subject;
				first_url = url.split('?')[0]; //검색결과 뒤 주소는 필요없어서 자름
				
				return false;
			}
		});
		
		
		//var first_id = $(".board_main.theme_default .board_list_table .table_body .id").first().text().trim();
		//var first_subject = $(".board_main.theme_default .board_list_table .table_body .deco").first().text().trim();
		//var first_url = $(".board_main.theme_default .board_list_table .table_body .deco").first().attr("href");
		
		// 검색결과 뒤 주소는 필요없어서 잘라
		//first_url = first_url.split('?')[0];
		
		//console.log(first_id);
		//console.log(first_subject);
		//console.log(first_url);
		
		// 결과 저장
		setRuliWeb(first_id, first_subject, first_url);
	});
}

function getAlarmAll(res){
	var sql = 
		`SELECT ID 
		      , GROUP_CONCAT(CONTENT) as CONTENTS 
		   FROM ALARM
		  GROUP BY ID`;
	
	pool.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		var contents = "";
		for(var i=0; i<results.length; i++) {
			if(i==0)
				contents = contents + results[i].ID + "|" + results[i].CONTENTS;	
			else
				contents = contents + "<br>" + results[i].ID + "|" + results[i].CONTENTS;		   
		}

		res.send(contents);
	});	
}

// 알림조회
function getAlarm(req, res){
	var sender = req.query.sender;
	
	var id = sender;
	
	var sql = 
		`SELECT ID
		      , CONTENT	
		   FROM ALARM
		  WHERE ID = ?
		  ORDER BY CONTENT ASC`;
	var param = [id];
	
	pool.query(sql, param, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		if(results.length == 0) {
			res.send("등록된 키워드가 없습니다.");
			return;
		}
		
		var contents = "";
		for(var i=0; i<results.length; i++) {
			contents = contents + results[i].CONTENT + "<br>";		   
		}
		res.send(contents);
	});		
}

// 알림삭제
function deleteAlarm(req, res){
	var msg = req.query.msg;
	var sender = req.query.sender;
	
	msg = msg.split("!알림삭제")[1];
	msg = msg.replace(/\s/gi, ""); //공백제거
	
	if(msg.length == 0) {
		res.send("삭제할 키워드를 입력해주십시오.");
		return;
	}
	
	var id = sender;
	var content = msg;
	
	var param = [id, content];
	
	var sql = 
		`DELETE	
		   FROM ALARM
		  WHERE ID = ?
		    AND CONTENT = ?`;
		   
	var query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
		}
		
		// 업데이트 건수가 1이면 정상
		if(response.affectedRows == 1) {
			getAlarm(req, res);
			return;
		}
		else {
			res.send("삭제할 데이터가 없습니다.");
			return;
		}
	});		

}

// 알림등록
function setAlarm(req, res){
	var msg = req.query.msg;
	var sender = req.query.sender;
	
	msg = msg.split("!알림등록")[1];
	msg = msg.replace(/\s/gi, ""); //공백제거
	
	// 정합성 체크
	if(msg.includes(",")) {
		res.send(",는 입력하지 말아주십시오.");
		return;
	}
	else if(msg.includes("|")) {
		res.send("|는 입력하지 말아주십시오.");
		return;
	}
	
	var id = sender;
	var content = msg;
	
	var sql = 
		`SELECT ID
		      , CONTENT
		   FROM ALARM
		  WHERE ID = ?`;
		   
	var param = [id];
			
	var contents = "";
	
	pool.query(sql, param, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		for(var i=0; i<results.length; i++) {
			// 기등록 키워드 처리
			if(content == results[i].CONTENT) {
				res.send("이미 등록된 키워드입니다.");
				return;
			}
		}
		
		// 기등록 키워드가 없으면 insert
		param = [id, content];
		sql = 
			`INSERT INTO ALARM(ID, CONTENT) VALUES(?, ?)`;
		
		query = mysql.format(sql, param);
		
		pool.query(query, function (error, response) {
			if (error) {
				console.log(error);
			}
			
			getAlarm(req, res);
			return;
		});	
		
	});		
}

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
			
			if(results[i].NAME.includes("래머") || 
					results[i].NAME.includes("세현") ||
					results[i].NAME.includes("레머") ||
					results[i].NAME.includes("새현")) {
				//response = response + "======================<br>";
				response = response + "xxxxxxxxxxxxxxxxxxxxxx<br>";
			}
		}
		
		response = response + "<br>서킷 : 스즈카 서부";
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

// 루리웹 검색 결과 저장
function setRuliWeb(id, subject, url){	
	if(id == null) {
		return;
	}
	
	var sql = 
		`SELECT ID
		   FROM SCRAP
		  WHERE ID = ?`;
		   
	var param = [id];
			
	pool.query(sql, param, function (error, results, fields) {
		if (error) {
			console.log(error);
		}
		
		// 기등록된 정보는 skip
		if(results.length > 0) {
			return;
		}
		
		// 기등록 정보가 없으면 insert
		param = [id, subject, url];
		sql = 
			`INSERT INTO SCRAP(LAST_DATE, ID, SUBJECT, URL, COMPLETE) VALUES(CURRENT_TIMESTAMP, ?, ?, ?, 'N')`;
		
		query = mysql.format(sql, param);
		
		pool.query(query, function (error, response) {
			if (error) {
				console.log(error);
			}
			return;
		});
	});		
}


function callParkApi(req, res) {
	var msg = req.query.msg;
	var room = req.query.room;
	var sender = req.query.sender;
	
	msg = msg.split("!피리야")[1];
	msg = msg.replace(/\s/gi, ""); //공백제거
	
	console.log("msg:" + msg);
	console.log("sender:" + sender);
	
	const apiUrl = 'https://fclgpt.parktube.net/api/submit';

	async function callApi() {
	  const options = {
	    method: 'POST',
	    headers: {
	      'key': 'Chatbot1234',
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    body: new URLSearchParams({
	      'prompt': msg,
	      'similarity_threshold': '0.8',
	      'use_gpt_always': 'False',
	      'use_db': 'true'
	    })
	  };
	
	  try {
		console.log("-----1");
	    const response = await fetch(apiUrl, options);
	    const data = await response.json();
		console.log("-----2");
	   	console.log(data);
		console.log("-----3");
		console.log(data.generated_text);
		
		if(data.generated_text.trim().length() > 0)
			setApiCall(room, content);
		
		res.send(data.generated_text);
	  } catch (error) {
	    console.error(error);
	  }
	}
	
	callApi();
}


// API 호출 결과 저장
function setApiCall(room, content){	
	if(room == null) {
		return;
	}
			
	// insert
	param = [room, content];
	sql = 
		`INSERT INTO CHAT(ROOM, CONTENT) VALUES(?, ?)`;
	
	query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
		}
		return;
	});
}