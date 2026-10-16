@echo off
setlocal
if not defined JAVA_HOME (
    set "JAVA_EXE=java.exe"
) else (
    set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)
"%JAVA_EXE%" -cp "%~dp0gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
exit /b %ERRORLEVEL%
