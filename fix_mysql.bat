@echo off
echo ==============================================
echo REPARATION AUTOMATIQUE DE XAMPP MYSQL
echo ==============================================

echo [1] Arret du processus MySQL bloque...
taskkill /F /IM mysqld.exe
timeout /t 2 /nobreak > NUL

set MYSQL_DIR=C:\xampp1\mysql
set DATA_DIR=%MYSQL_DIR%\data
set BACKUP_DIR=%MYSQL_DIR%\backup

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set DATA_OLD_DIR=%MYSQL_DIR%\data_old_%mydate%_%mytime%

echo [2] Renommage du dossier data corrompu...
rename "%DATA_DIR%" "data_old_%mydate%_%mytime%"

echo [3] Copie du dossier de backup XAMPP...
xcopy /E /I /H /Y "%BACKUP_DIR%" "%DATA_DIR%" > NUL

echo [4] Restauration de la base de donnees pfe_crm_ia...
xcopy /E /I /H /Y "%DATA_OLD_DIR%\pfe_crm_ia" "%DATA_DIR%\pfe_crm_ia" > NUL
copy /Y "%DATA_OLD_DIR%\ibdata1" "%DATA_DIR%\ibdata1" > NUL

echo ==============================================
echo REPARATION TERMINEE AVEC SUCCES !
echo Vous pouvez maintenant relancer MySQL depuis le panneau XAMPP.
echo ==============================================
pause
