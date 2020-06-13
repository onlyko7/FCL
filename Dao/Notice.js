// num infomation
// 1:일정
// 2:우승자

const mysql = require('mysql');

// 일정변경
module.exports.changeSchedule = function(pool, req, res) {
	var content = req.query.msg.split("!일정변경")[1];

	var param = [content];
	
	var sql = 
		`UPDATE NOTICE
		    SET CONTENT = ?
		  WHERE NUM = 1`; // 1:일정
	
	var query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
			res.send('일정변경 중 오류 발생!!!');
		}
		
		res.send('일정변경 완료!');
	});
};

//일정 불러오기
module.exports.getSchedule = function(pool, res) {
	var query = 
			`SELECT CONTENT	
			   FROM NOTICE N
			  WHERE N.NUM = 1`; 
	
	pool.query(query, function (error, results, fields) {
		if (error) {
			console.log(error);
			res.send('불러오는 중 오류발생!!!');
		}
		
		res.send(results[0].CONTENT.replace(/\n/gi, "<br>"));
	});		
}

// 우승자 등록
module.exports.setChamp = function(pool, req, res) {
	var content = req.query.msg.split("!우승")[1].trim();

	var param = [content];
	
	var sql = 
		`UPDATE NOTICE
		    SET CONTENT = ?
		  WHERE NUM = 2`; // 2:우승자
	
	var query = mysql.format(sql, param);
	
	pool.query(query, function (error, response) {
		if (error) {
			console.log(error);
			res.send('우승자 변경 중 오류 발생!!!');
		}
		
		sql = 
			`SELECT CONTENT	
			   FROM NOTICE N
			  WHERE N.NUM = 2`; 
		
		pool.query(sql, function (error, results, fields) {
			if (error) {
				console.log(error);
				res.send('불러오는 중 오류발생!!!');
			}
			
			res.send(results[0].CONTENT.replace(/\n/gi, "<br>"));
		});			
	});
}

// 우승자 조회
module.exports.getChamp = function(pool, res) {
	var sql = 
		`SELECT CONTENT	
		   FROM NOTICE N
		  WHERE N.NUM = 2`; 
	
	pool.query(sql, function (error, results, fields) {
		if (error) {
			console.log(error);
			res.send('불러오는 중 오류발생!!!');
		}
		
		res.send(results[0].CONTENT.replace(/\n/gi, "<br>"));
	});			
}