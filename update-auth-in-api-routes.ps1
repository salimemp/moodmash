# This script updates the import statement and auth function call in API routes

# Find all API routes that use auth(req, res)
$results = Get-ChildItem -Path src -Recurse -Filter "*.ts" | 
    Select-String -Pattern "auth\(req, res\)" |
    Select-Object Path -Unique

foreach ($result in $results) {
    $filePath = $result.Path
    Write-Host "Updating $filePath"
    
    # Read file content
    $content = Get-Content -Path $filePath -Raw
    
    # Replace the import statement
    $updatedContent = $content -replace "import \{ auth \} from '@/lib/auth/auth';", "import { getSessionFromReq } from '@/lib/auth/utils';"
    
    # Replace imports with destructuring that include auth
    $updatedContent = $updatedContent -replace "import \{(.*)auth(.*)\} from '@/lib/auth/auth';", "import {`$1`$2} from '@/lib/auth/auth';`nimport { getSessionFromReq } from '@/lib/auth/utils';"
    
    # Replace the auth function call
    $updatedContent = $updatedContent -replace "const session = await auth\(req, res\);", "const session = await getSessionFromReq(req, res);"
    
    # Write the updated content back to the file
    Set-Content -Path $filePath -Value $updatedContent
}

Write-Host "Auth function calls updated in API routes" 