#!/bin/sh
b=$(git symbolic-ref HEAD) && c=$(git -c user.name=t -c user.email=t@t commit-tree -p HEAD -m moved 'HEAD^{tree}') && git update-ref "$b" "$c"
exit 1
