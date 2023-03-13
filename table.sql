/*---------------------------------------------
-- 오브젝트명: `forza`.`RECORD`
-- 생성일자 : 2019-05-27 23:19:17.0
-- 상태: VALID
---------------------------------------------*/
CREATE TABLE `forza`.`RECORD`
(
    `RACE_DATE`  char(8)       CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `TRACK`      varchar(100)  CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `TAG`        varchar(50)   CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `DIVISION`   varchar(100)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `CAR`        varchar(100)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `BEST_LAP`   decimal(8,5),
    `POS`        decimal(2,0)  NOT NULL DEFAULT 0,
    `Q_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `C_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `P_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `R_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `F_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `E_POINT`    decimal(2,0)  NOT NULL DEFAULT 0,
    `PTS`        decimal(3,0)  NOT NULL DEFAULT 0,
    PRIMARY KEY (RACE_DATE, TRACK, TAG)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=Compact;


CREATE TABLE `forza`.`ALARM`
(
    `ID`       varchar(100)  CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `CONTENT`  text          CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    INDEX `IDX_ALARM_ID` (`ID`)
)
ENGINE=InnoDB DEFAULT CHARSET=cp1257 COLLATE=cp1257_general_ci ROW_FORMAT=Dynamic;


CREATE TABLE `forza`.`SCRAP`
(
    `LAST_DATE`  timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ID`         varchar(10)    CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `SUBJECT`    varchar(1000)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `URL`        varchar(1000)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `COMPLETE`   char(1)        CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    PRIMARY KEY (`LAST_DATE`, `ID`),
    INDEX `IDX_SCRAP_ID` (`ID`)
)
ENGINE=InnoDB DEFAULT CHARSET=cp1257 COLLATE=cp1257_general_ci ROW_FORMAT=Dynamic;


CREATE TABLE `NOTICE` (
  `NUM` decimal(3,0) NOT NULL,
  `TITLE` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `CONTENT` text CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`NUM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC



CREATE TABLE `RIVAL` (
  `NAME` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `BEST_LAP` decimal(8,5) DEFAULT NULL,
  PRIMARY KEY (`NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  order_date DATE,
  total DECIMAL(10,2)
);

CREATE TABLE `CHAT`
(
    `ID`       int  AUTO_INCREMENT PRIMARY KEY,
    `ROOM` 	   varchar(300) COLLATE utf8_unicode_ci NOT NULL,
    `CONTENT`  text          CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL
)
ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
