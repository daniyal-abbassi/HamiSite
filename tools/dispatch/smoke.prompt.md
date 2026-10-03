# Smoke test — read-only, answer in four lines

You were dispatched to prove the transport works. Do exactly this and nothing else:

1. Report the repository name from `git remote get-url origin`.
2. Report the current branch from `git rev-parse --abbrev-ref HEAD`.
3. Report whether the file `specs/007-motion-assembly-band/tasks.md` exists, with its line count from `wc -l`.
4. Do not create, edit, move or delete any file. Do not run any git command that writes. Do not run npm.

Definition of done: the four answers above, plus the closing JSON block. `status` is "completed" only if
you answered all four from commands you actually ran. If you cannot run a command, say `blocked` and name it.
