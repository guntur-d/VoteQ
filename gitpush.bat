@echo off
setlocal

REM This script stages all changes, commits them, and pushes to the remote.
REM
REM Usage with a custom message:
REM   gitpush.bat "Your detailed commit message"
REM
REM Usage with the default message ('init'):
REM   gitpush.bat

set "commit_message=%~1"

if not defined commit_message (
    set "commit_message=init"
)

echo [GIT] Staging all changes...
git add .
echo [GIT] Committing with message: "%commit_message%"
git commit -m "%commit_message%"
echo [GIT] Pushing to remote...
git push

endlocal