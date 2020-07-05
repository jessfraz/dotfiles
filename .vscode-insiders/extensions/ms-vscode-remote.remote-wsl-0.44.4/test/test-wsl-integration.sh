#!/bin/bash	
#set -e	

if grep -qi Microsoft /proc/version; then	
	ROOT=$(dirname $(dirname $(dirname $(readlink -f $0))))/vscode
else	
	echo 'Tests to be run in a WSL Shell'	
	exit 1	
fi	

echo $ROOT

cd $ROOT

# Tests in the extension host	
./scripts/code.sh $ROOT/extensions/vscode-api-tests/testWorkspace --extensionDevelopmentPath=$ROOT/extensions/vscode-api-tests --extensionTestsPath=$ROOT/extensions/vscode-api-tests/out/singlefolder-tests --skip-getting-started	
./scripts/code.sh $ROOT/extensions/vscode-api-tests/testworkspace.code-workspace --extensionDevelopmentPath=$ROOT/extensions/vscode-api-tests --extensionTestsPath=$ROOT/extensions/vscode-api-tests/out/workspace-tests --skip-getting-started	
./scripts/code.sh $ROOT/extensions/vscode-colorize-tests/test --extensionDevelopmentPath=$ROOT/extensions/vscode-colorize-tests --extensionTestsPath=$ROOT/extensions/vscode-colorize-tests/out --skip-getting-started	
./scripts/code.sh $ROOT/extensions/markdown-language-features/test-fixtures --extensionDevelopmentPath=$ROOT/extensions/markdown-language-features --extensionTestsPath=$ROOT/extensions/markdown-language-features/out/test --skip-getting-started	

mkdir -p $ROOT/extensions/emmet/test-fixtures	
./scripts/code.sh $ROOT/extensions/emmet/test-fixtures --extensionDevelopmentPath=$ROOT/extensions/emmet --extensionTestsPath=$ROOT/extensions/emmet/out/test --skip-getting-started .	
rm -r $ROOT/extensions/emmet/test-fixtures	