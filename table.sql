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
    `ID`        varchar(10)    CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    `SUBJECT`   varchar(1000)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `URL`   varchar(1000)  CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    `COMPLETE`  char(1)        CHARACTER SET utf8 COLLATE utf8_unicode_ci,
    PRIMARY KEY (`ID`)
)
ENGINE=InnoDB DEFAULT CHARSET=cp1257 COLLATE=cp1257_general_ci ROW_FORMAT=Dynamic;
